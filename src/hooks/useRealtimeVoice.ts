"use client";

import { useState, useRef, useCallback, useEffect } from "react";

type VoiceState = "idle" | "connecting" | "listening" | "speaking" | "error";

type ToolCall = {
  toolName: string;
  args: Record<string, unknown>;
  call_id?: string;
};

export function useRealtimeVoice() {
  const [state, setState] = useState<VoiceState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>("");

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const onToolCallRef = useRef<((toolName: string, args: Record<string, unknown>) => void) | null>(null);
  const onTranscriptRef = useRef<((text: string, role: "user" | "assistant") => void) | null>(null);
  const onMessageToolCallRef = useRef<((toolCall: ToolCall) => void) | null>(null);
  // Track pending tool call for sending responses back to OpenAI
  const pendingToolCallRef = useRef<{ name: string; call_id: string; arguments: string; addedToMessages: boolean } | null>(null);

  // Connect to OpenAI Realtime API
  const connect = useCallback(async (
    onToolCall?: (toolName: string, args: Record<string, unknown>) => void,
    onTranscript?: (text: string, role: "user" | "assistant") => void,
    onMessageToolCall?: (toolCall: ToolCall) => void,
    getCanvasState?: () => Array<{ type: string; text?: string }>,
    captureScreenshot?: () => Promise<string | null>
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

          const message = JSON.parse(event.data);

          // Debug: log all message types
          if (message.type.includes("function") || message.type.includes("transcript") || message.type.includes("output_item")) {
            console.log("[VOICE EVENT]", message.type, message);
          }

          // Handle errors
          if (message.type === "error") {
            console.error("[VOICE ERROR]", message);
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
          }

          // Buffer arguments as they stream - add to messages EARLY for UI tools
          if (message.type === "response.function_call_arguments.delta" && pendingToolCallRef.current) {
            pendingToolCallRef.current.arguments += message.delta || "";

            // No early detection needed for voice mode tools currently
            // (checkpoint removed from voice mode - natural conversation instead)
          }

          // Handle tool call completion
          if (message.type === "response.function_call_arguments.done") {
            const toolName = message.name;
            let args: Record<string, unknown>;

            try {
              args = JSON.parse(message.arguments);
            } catch (parseErr) {
              console.error("Failed to parse tool arguments:", parseErr);
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

            // Canvas tools → execute directly on canvas
            if (onToolCallRef.current) {
              onToolCallRef.current(toolName, args);
            }

            // webSearch - make async HTTP call for real results
            if (toolName === "webSearch") {
              const { query, purpose } = args as { query: string; purpose: string };
              console.log("[VOICE] webSearch called:", { query, purpose });

              // Make async search request
              fetch("/api/voice/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query, purpose }),
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

            // For other tools, auto-respond and continue
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

          // Track AI speaking state
          if (message.type === "response.audio.delta") {
            setState("speaking");
          }

          if (message.type === "response.audio.done" || message.type === "response.done") {
            setState("listening");
          }

        } catch (err) {
          console.error("Failed to parse message:", err);
        }
      });

      dc.addEventListener("open", async () => {
        console.log("Data channel opened");
        setState("listening");

        // Send fresh canvas state as context
        if (getCanvasState) {
          const canvasState = getCanvasState();
          if (canvasState.length > 0) {
            dc.send(JSON.stringify({
              type: "conversation.item.create",
              item: {
                type: "message",
                role: "user",
                content: [{
                  type: "input_text",
                  text: `[CANVAS STATE] ${canvasState.length} items on canvas: ${canvasState.map((i: { type: string; text?: string }) => `${i.type}: ${i.text?.slice(0, 30) || 'no text'}`).join(', ')}`
                }]
              }
            }));
          }
        }

        // Send visual screenshot for spatial understanding
        if (captureScreenshot) {
          try {
            const screenshot = await captureScreenshot();
            if (screenshot) {
              console.log("[VOICE] Sending canvas screenshot for visual context");
              dc.send(JSON.stringify({
                type: "conversation.item.create",
                item: {
                  type: "message",
                  role: "user",
                  content: [{
                    type: "input_image",
                    image_url: screenshot
                  }]
                }
              }));
            }
          } catch (err) {
            console.error("[VOICE] Failed to capture screenshot:", err);
          }
        }
      });

      dc.addEventListener("close", () => {
        console.log("Data channel closed");
        setState("idle");
      });

      dc.addEventListener("error", (event) => {
        console.error("Data channel error:", event);
        setError("Connection error");
        setState("error");
      });

      // Handle incoming audio from AI
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    state,
    error,
    transcript,
    connect,
    disconnect,
    sendMessage,
    isConnected: state === "listening" || state === "speaking",
  };
}
