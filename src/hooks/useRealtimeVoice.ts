"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { IncrementalItemExtractor, STREAMING_TOOLS } from "@/lib/streamingParser";

type VoiceState = "idle" | "connecting" | "listening" | "speaking" | "error";

type ToolCall = {
  toolName: string;
  args: Record<string, unknown>;
  call_id?: string;
};

/**
 * Serialize canvas state into text for the voice AI.
 * Groups confidence stickies with their preceding solution document
 * so the AI doesn't mix up which confidence belongs to which solution.
 * Also detects RECOMMENDED stickers and marks which solution is recommended.
 */
function serializeCanvasState(state: {
  frames: Array<{ id: string; name?: string; children: Array<{ id: string; text?: string; type: string; color?: string }> }>;
  orphans: Array<{ id: string; text?: string; type: string; color?: string }>;
}) {
  const escapeText = (text: string) => text.replace(/"/g, '\\"').replace(/\n/g, ' ');
  const confPattern = /^\d+%\s*confidence$/i;

  const serializeChildren = (children: Array<{ id: string; text?: string; type: string; color?: string }>) => {
    const items: string[] = [];

    // First pass: find if there's a RECOMMENDED sticker in this frame
    const hasRecommendedSticker = children.some(c =>
      c.type === 'image' && c.text === 'RECOMMENDED sticker'
    );

    for (let i = 0; i < children.length; i++) {
      const c = children[i];
      const text = c.text?.slice(0, 200) || 'no text';

      // Skip RECOMMENDED sticker images from the item list (we attach the info to the solution)
      if (c.type === 'image' && text === 'RECOMMENDED sticker') {
        continue;
      }

      // If this is a confidence note, attach it to the previous document instead of listing separately
      if (c.type === 'note' && confPattern.test(text.trim()) && items.length > 0) {
        // Include color: green = recommended, yellow = lower confidence
        const colorInfo = c.color === 'green' ? ', RECOMMENDED' :
                          c.color ? `, color:${c.color}` : '';
        // Append confidence + color to the last item (the solution document)
        items[items.length - 1] = items[items.length - 1].replace(
          /\)$/,
          `, ${escapeText(text.trim())}${colorInfo})`
        );
        continue;
      }

      items.push(`[ID: ${c.id}] ${escapeText(text)} (${c.type})`);
    }

    // If we found a recommended sticker but no green confidence note was tagged,
    // add a note at the end so the AI still knows about the recommendation
    if (hasRecommendedSticker && !items.some(item => item.includes('RECOMMENDED'))) {
      items.push('[This zone contains a RECOMMENDED sticker]');
    }

    return items.join(', ');
  };

  const parts: string[] = [];
  state.frames.forEach(f => {
    const items = serializeChildren(f.children);
    parts.push(`Frame "${escapeText(f.name || 'Untitled')}": ${items}`);
  });
  if (state.orphans.length > 0) {
    parts.push(`Loose: ${state.orphans.map(s => `[ID: ${s.id}] ${escapeText(s.text?.slice(0, 200) || 'no text')} (${s.type})`).join(', ')}`);
  }
  return parts.join('; ');
}

export function useRealtimeVoice() {
  const [state, _setState] = useState<VoiceState>("idle");
  const stateRef = useRef<VoiceState>("idle");
  const setState = useCallback((newState: VoiceState) => {
    if (stateRef.current === newState) return; // Skip if already in this state
    console.log(`[VOICE STATE] ${stateRef.current} → ${newState}`);
    stateRef.current = newState;
    _setState(newState);
  }, []);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const onToolCallRef = useRef<((toolName: string, args: Record<string, unknown>) => void) | null>(null);
  const onTranscriptRef = useRef<((text: string, role: "user" | "assistant") => void) | null>(null);
  const onMessageToolCallRef = useRef<((toolCall: ToolCall) => void) | null>(null);
  const getCanvasStateRef = useRef<(() => unknown) | null>(null);
  const captureScreenshotRef = useRef<(() => Promise<string | null>) | null>(null);
  const chatMessagesRef = useRef<Array<{ role: string; content: string; toolInvocations?: Array<{ toolName: string; args: Record<string, unknown> }> }>>([]);
  // Track pending tool call for sending responses back to OpenAI
  const pendingToolCallRef = useRef<{ name: string; call_id: string; arguments: string; addedToMessages: boolean } | null>(null);
  // Track streaming state for incremental tool call parsing
  const voiceStreamingRef = useRef<{
    callId: string;
    toolName: string;
    extractor: IncrementalItemExtractor;
    hasStreamedItems: boolean;
  } | null>(null);

  // Connect to OpenAI Realtime API
  const connect = useCallback(async (
    onToolCall?: (toolName: string, args: Record<string, unknown>) => void,
    onTranscript?: (text: string, role: "user" | "assistant") => void,
    onMessageToolCall?: (toolCall: ToolCall) => void,
    getCanvasState?: () => unknown,
    captureScreenshot?: () => Promise<string | null>,
    chatMessages?: Array<{ role: string; content: string; toolInvocations?: Array<{ toolName: string; args: Record<string, unknown> }> }>
  ) => {
    try {
      setState("connecting");
      setError(null);
      setTranscript("");

      // Store handlers
      if (onToolCall) {
        onToolCallRef.current = onToolCall;
      }
      if (onTranscript) {
        onTranscriptRef.current = onTranscript;
      }
      if (onMessageToolCall) {
        onMessageToolCallRef.current = onMessageToolCall;
      }
      if (getCanvasState) {
        getCanvasStateRef.current = getCanvasState;
      }
      if (captureScreenshot) {
        captureScreenshotRef.current = captureScreenshot;
      }
      if (chatMessages) {
        chatMessagesRef.current = chatMessages;
      }

      // 1. Get ephemeral token from our server
      const tokenResponse = await fetch("/api/realtime/token", {
        method: "POST",
      });

      if (!tokenResponse.ok) {
        throw new Error("Failed to get ephemeral token");
      }

      const { client_secret } = await tokenResponse.json();

      // 2. Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 24000,
        },
      });
      audioStreamRef.current = stream;

      // 3. Create WebRTC peer connection
      const pc = new RTCPeerConnection();
      peerConnectionRef.current = pc;

      // Add audio track from microphone
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Create data channel for tool calls / events
      const dc = pc.createDataChannel("oai-events");
      dataChannelRef.current = dc;

      // Handle incoming messages (tool calls, transcripts, etc.)
      dc.addEventListener("message", (event) => {
        try {
          if (typeof event.data !== 'string') {
            return;
          }

          let message;
          try {
            message = JSON.parse(event.data);
          } catch {
            // OpenAI sometimes sends non-JSON data on the channel - safe to ignore
            return;
          }

          // Debug: log ALL event types
          if (message.type) {
            console.log("[VOICE EVENT]", message.type);
          }

          // Handle errors
          if (message.type === "error") {
            console.error("[VOICE ERROR]", message);
            console.error("[VOICE ERROR DETAILS]", JSON.stringify(message, null, 2));
            setError(message.error?.message || "Voice connection error");
            setState("error");
          }

          // Handle user speech transcripts - add to messages
          if (message.type === "conversation.item.input_audio_transcription.completed") {
            const userText = message.transcript;
            console.log("[VOICE] User transcript:", userText);
            if (userText && onTranscriptRef.current) {
              console.log("[VOICE] Calling onTranscript callback with user text");
              onTranscriptRef.current(userText, "user");
            } else {
              console.warn("[VOICE] onTranscriptRef.current is not set!");
            }
          }

          // Handle AI response transcripts - add to messages
          if (message.type === "response.output_item.done" && message.item?.content) {
            const content = message.item.content.find((c: { type: string; transcript?: string }) => c.type === "audio");
            if (content?.transcript) {
              console.log("[VOICE] AI transcript:", content.transcript.slice(0, 50) + "...");
              if (onTranscriptRef.current) {
                console.log("[VOICE] Calling onTranscript callback with assistant text");
                onTranscriptRef.current(content.transcript, "assistant");
              }
            }
          }

          // Track pending tool call when function starts
          if (message.type === "response.output_item.added" && message.item?.type === "function_call") {
            console.log("[VOICE] Function call started:", message.item.name, "call_id:", message.item.call_id);
            pendingToolCallRef.current = {
              name: message.item.name,
              call_id: message.item.call_id,
              arguments: "",
              addedToMessages: false,
            };

            // Initialize streaming extractor for supported tools — emit start immediately
            if (STREAMING_TOOLS[message.item.name] && onToolCallRef.current) {
              voiceStreamingRef.current = {
                callId: message.item.call_id,
                toolName: message.item.name,
                extractor: new IncrementalItemExtractor(message.item.name),
                hasStreamedItems: true, // Mark as streamed from the start
              };
              onToolCallRef.current("_streaming_start", {
                toolName: message.item.name,
                callId: message.item.call_id,
                partialArgs: {},
              });
            }
          }

          // Buffer arguments as they stream — also feed incremental parser for streaming
          if (message.type === "response.function_call_arguments.delta" && pendingToolCallRef.current) {
            pendingToolCallRef.current.arguments += message.delta || "";

            // Feed the streaming extractor if active
            const vs = voiceStreamingRef.current;
            if (vs && message.delta && onToolCallRef.current) {
              const result = vs.extractor.feed(message.delta);

              // Forward scalar updates (title, frameName, columns, etc.)
              if (Object.keys(result.scalars).length > 0) {
                onToolCallRef.current("_streaming_scalars", {
                  callId: vs.callId,
                  scalars: result.scalars,
                });
              }

              // Emit _streaming_item for each newly completed array item
              for (const { index, item } of result.newItems) {
                onToolCallRef.current("_streaming_item", {
                  callId: vs.callId,
                  item,
                  index,
                });
              }

              // Emit _streaming_content for document content progress
              if (result.contentSoFar) {
                onToolCallRef.current("_streaming_content", {
                  callId: vs.callId,
                  content: result.contentSoFar,
                });
              }
            }
          }

          // Handle tool call completion
          if (message.type === "response.function_call_arguments.done") {
            const toolName = message.name;
            let args: Record<string, unknown>;

            try {
              args = JSON.parse(message.arguments);
            } catch {
              console.warn("[VOICE] Skipping malformed tool arguments");
              voiceStreamingRef.current = null;
              return;
            }

            const toolCall: ToolCall = {
              toolName,
              args,
              call_id: message.call_id,
            };

            // showProgress - add to messages for progress tracking
            if (toolName === "showProgress" && onMessageToolCallRef.current) {
              onMessageToolCallRef.current(toolCall);
            }

            // If this was a streamed tool call, emit _streaming_done instead of normal dispatch
            const vs = voiceStreamingRef.current;
            if (vs && vs.hasStreamedItems && onToolCallRef.current) {
              onToolCallRef.current("_streaming_done", {
                callId: vs.callId,
                toolName: vs.toolName,
                args,
              });
              voiceStreamingRef.current = null;
            } else {
              voiceStreamingRef.current = null;
              // Canvas tools → execute directly on canvas (normal path)
              // createZone: rename to createZone_result so Canvas.tsx uses the same handler as chat
              const dispatchName = toolName === "createZone" ? "createZone_result" : toolName;
              if (onToolCallRef.current) {
                onToolCallRef.current(dispatchName, args);
              }
            }

            // webSearch - make async HTTP call for real results
            if (toolName === "webSearch") {
              const { query, purpose, maxResults } = args as { query: string; purpose: string; maxResults?: number };
              console.log("[VOICE] webSearch called:", { query, purpose, maxResults });

              // Make async search request
              fetch("/api/voice/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query, purpose, maxResults }),
              })
                .then((res) => res.json())
                .then((searchResults) => {
                  console.log("[VOICE] Search results:", searchResults);

                  // Send real results back to OpenAI
                  dc.send(JSON.stringify({
                    type: "conversation.item.create",
                    item: {
                      type: "function_call_output",
                      call_id: message.call_id,
                      output: JSON.stringify(searchResults),
                    },
                  }));
                  // Trigger AI to continue with the results
                  dc.send(JSON.stringify({ type: "response.create" }));
                })
                .catch((err) => {
                  console.error("[VOICE] Search error:", err);
                  // Send error response
                  dc.send(JSON.stringify({
                    type: "conversation.item.create",
                    item: {
                      type: "function_call_output",
                      call_id: message.call_id,
                      output: JSON.stringify({ error: String(err), results: [] }),
                    },
                  }));
                  dc.send(JSON.stringify({ type: "response.create" }));
                });

              // Don't send auto-response for webSearch - wait for async results
              return;
            }

            // Canvas-modifying tools - send fresh canvas state with the response
            const canvasTools = ["createSticky", "createShape", "createText", "createFrame",
              "createArrow", "createWorkingNote", "createLayout", "createSources",
              "deleteItem", "deleteFrame", "updateSticky", "moveItem", "createWorkshopBoard", "createZone", "addSolutionCard"];
            const isCanvasTool = canvasTools.includes(toolName);

            if (isCanvasTool && getCanvasStateRef.current) {
              // Small delay to let tldraw process the shape creation, then send updated state
              const callId = message.call_id;
              setTimeout(() => {
                if (!getCanvasStateRef.current) return;
                const freshState = getCanvasStateRef.current() as {
                  frames: Array<{ id: string; name?: string; createdBy: string; children: Array<{ id: string; text?: string; type: string; color?: string; createdBy: string }> }>;
                  orphans: Array<{ id: string; text?: string; type: string; createdBy: string }>;
                };
                const summary = serializeCanvasState(freshState);

                const outputData = { success: true, canvasUpdate: summary || "Canvas updated" };
                dc.send(JSON.stringify({
                  type: "conversation.item.create",
                  item: {
                    type: "function_call_output",
                    call_id: callId,
                    output: JSON.stringify(outputData),
                  },
                }));
                dc.send(JSON.stringify({ type: "response.create" }));
              }, 50);
            } else {
              // For non-canvas tools, auto-respond immediately
              dc.send(JSON.stringify({
                type: "conversation.item.create",
                item: {
                  type: "function_call_output",
                  call_id: message.call_id,
                  output: JSON.stringify({ success: true }),
                },
              }));
              dc.send(JSON.stringify({ type: "response.create" }));
            }
          }

          // Track AI speaking state
          // Enter "speaking" when user finishes talking (AI is now processing + responding)
          // Exit "speaking" when output audio buffer stops (audio finished playing)
          if (message.type === "conversation.item.input_audio_transcription.completed") {
            setState("speaking");
          }

          if (message.type === "output_audio_buffer.stopped") {
            setState("listening");
          }

        } catch (err) {
          console.error("Failed to parse message:", err);
        }
      });

      dc.addEventListener("open", async () => {
        console.log("Data channel opened");
        console.log("[VOICE STATE] Changing to 'listening' (data channel opened)");
        setState("listening");

        // Inject chat history so voice AI knows what was discussed in chat
        const recentMessages = chatMessagesRef.current.slice(-20);
        if (recentMessages.length > 0) {
          const historyLines: string[] = [];
          for (const msg of recentMessages) {
            const role = msg.role === "user" ? "User" : "AI";
            const toolSuffix = msg.toolInvocations?.length
              ? ` [used tools: ${msg.toolInvocations.map(t => t.toolName).join(", ")}]`
              : "";
            // Truncate long messages to keep context manageable
            const content = msg.content.length > 300
              ? msg.content.slice(0, 300) + "..."
              : msg.content;
            if (content || toolSuffix) {
              historyLines.push(`${role}: ${content}${toolSuffix}`);
            }
          }
          if (historyLines.length > 0) {
            const historyText = [
              "[CONVERSATION HISTORY — the user discussed the following in chat before switching to voice]",
              ...historyLines,
              "[END HISTORY — continue naturally, don't repeat what was discussed]"
            ].join("\n");
            console.log("[VOICE] Injecting chat history:", historyLines.length, "messages");
            dc.send(JSON.stringify({
              type: "conversation.item.create",
              item: {
                type: "message",
                role: "user",
                content: [{ type: "input_text", text: historyText }]
              }
            }));
          }
        }

        // Send fresh canvas state as context
        if (getCanvasState) {
          const state = getCanvasState() as {
            frames: Array<{ id: string; name?: string; children: Array<{ id: string; text?: string; type: string; color?: string }> }>;
            orphans: Array<{ id: string; text?: string; type: string; color?: string }>;
          };
          const hasContent = state.frames.length > 0 || state.orphans.length > 0;
          if (hasContent) {
            const summary = serializeCanvasState(state);
            dc.send(JSON.stringify({
              type: "conversation.item.create",
              item: {
                type: "message",
                role: "user",
                content: [{
                  type: "input_text",
                  text: `[CANVAS STATE] ${summary}`
                }]
              }
            }));
          }
        }

        // Don't send initial screenshot - it's too large and crashes the data channel
        // The AI will receive fresh screenshots when user makes edits via sendScreenshot()
        console.log("[VOICE] Skipping initial screenshot (too large for WebRTC channel)");
      });

      dc.addEventListener("close", () => {
        console.log("Data channel closed");
        setState("idle");
      });

      dc.addEventListener("error", (event) => {
        console.warn("Data channel error (non-fatal):", event);
        // Don't kill the connection for transient errors — only fatal if channel is closed
        if (dc.readyState === "closed") {
          setError("Connection error");
          setState("error");
        }
      });

      // Handle incoming audio from AI — also set up silence detection
      pc.addEventListener("track", (event) => {
        const audioElement = new Audio();
        audioElement.srcObject = event.streams[0];
        audioElement.play().catch((err) => {
          console.error("Failed to play audio:", err);
        });

      });

      // Monitor connection state
      pc.addEventListener("connectionstatechange", () => {
        console.log("Connection state:", pc.connectionState);
        if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
          setError("Connection lost");
          setState("error");
        }
      });

      // 4. Create offer and set local description
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // 5. Send offer to OpenAI and get answer
      const sdpResponse = await fetch("https://api.openai.com/v1/realtime", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${client_secret}`,
          "Content-Type": "application/sdp",
          "OpenAI-Beta": "realtime=v1",
        },
        body: offer.sdp,
      });

      if (!sdpResponse.ok) {
        const errorText = await sdpResponse.text();
        throw new Error(`Failed to establish connection with OpenAI: ${sdpResponse.status} ${errorText}`);
      }

      const answerSdp = await sdpResponse.text();
      if (pc.signalingState === "closed") {
        console.warn("[VOICE] Connection closed during SDP exchange, aborting");
        return;
      }
      await pc.setRemoteDescription({
        type: "answer",
        sdp: answerSdp,
      });

      console.log("WebRTC connection established");
    } catch (err) {
      console.error("Connection error:", err);
      setError(err instanceof Error ? err.message : "Failed to connect");
      setState("error");
      disconnect();
    }
  }, []);

  // Disconnect and cleanup
  const toggleMute = useCallback(() => {
    if (!audioStreamRef.current) return;

    const audioTracks = audioStreamRef.current.getAudioTracks();
    audioTracks.forEach((track) => {
      track.enabled = !track.enabled;
    });
    setIsMuted((prev) => !prev);
  }, []);

  const disconnect = useCallback(() => {
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }

    pendingToolCallRef.current = null;
    setState("idle");
    setIsMuted(false);
  }, []);

  // Send message to AI (natural conversation)
  const sendMessage = useCallback((text: string) => {
    if (!dataChannelRef.current || dataChannelRef.current.readyState !== "open") {
      console.error("[VOICE] Data channel not ready");
      return;
    }

    const dc = dataChannelRef.current;

    // Send user message
    dc.send(JSON.stringify({
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [{ type: "input_text", text }],
      },
    }));

    // Trigger AI response
    dc.send(JSON.stringify({ type: "response.create" }));
  }, []);

  // Send canvas state update to AI (when user manually adds shapes)
  const sendCanvasUpdate = useCallback(() => {
    if (!dataChannelRef.current || dataChannelRef.current.readyState !== "open") {
      return;
    }
    if (!getCanvasStateRef.current) {
      return;
    }

    const dc = dataChannelRef.current;
    const state = getCanvasStateRef.current() as {
      frames: Array<{ id: string; name?: string; children: Array<{ id: string; text?: string; type: string; color?: string }> }>;
      orphans: Array<{ id: string; text?: string; type: string; color?: string }>;
    };

    const hasContent = state.frames.length > 0 || state.orphans.length > 0;
    if (hasContent) {
      const summary = serializeCanvasState(state);
      console.log("[VOICE] Sending canvas update:", summary);
      dc.send(JSON.stringify({
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [{
            type: "input_text",
            text: `[CANVAS UPDATED] ${summary}`
          }]
        }
      }));
    }
  }, []);

  // Send a fresh screenshot to the AI, with optional description of what changed
  const sendScreenshot = useCallback(async (changeDescription?: string) => {
    if (!dataChannelRef.current || dataChannelRef.current.readyState !== "open") return;
    if (!captureScreenshotRef.current) return;

    try {
      const screenshot = await captureScreenshotRef.current();
      if (!screenshot) return;

      // Check screenshot size - WebRTC data channels have ~16-64KB message limits
      // Base64 images are ~1.33x larger than raw bytes, so we need to be conservative
      const sizeKB = Math.round(screenshot.length / 1024);
      const MAX_SIZE_KB = 50; // Conservative limit to stay well below WebRTC limits

      if (sizeKB > MAX_SIZE_KB) {
        console.warn(`[VOICE] Screenshot too large (${sizeKB}KB), skipping to prevent data channel crash. Complex layouts with many shapes produce large screenshots.`);
        return;
      }

      const changeNote = changeDescription
        ? ` The user just: ${changeDescription}. Look for the new additions.`
        : '';

      const dc = dataChannelRef.current;
      console.log(`[VOICE] Sending live canvas screenshot (${sizeKB}KB)`, changeDescription || "");
      dc.send(JSON.stringify({
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [{
            type: "input_text",
            text: `[LIVE CANVAS SCREENSHOT]${changeNote} Here is what the canvas looks like now.`
          }, {
            type: "input_image",
            image_url: screenshot
          }]
        }
      }));
    } catch (err) {
      console.error("[VOICE] Failed to send screenshot:", err);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const isConnected = state === "listening" || state === "speaking";

  return useMemo(() => ({
    state,
    error,
    transcript,
    connect,
    disconnect,
    toggleMute,
    isMuted,
    sendMessage,
    sendCanvasUpdate,
    sendScreenshot,
    isConnected,
  }), [state, error, transcript, connect, disconnect, toggleMute, isMuted, sendMessage, sendCanvasUpdate, sendScreenshot, isConnected]);
}
