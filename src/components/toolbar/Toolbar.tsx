"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Editor } from "tldraw";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconMicrophone,
  IconMicrophoneSlash,
} from "@mirohq/design-system-icons";
import { primaryTools, type OverflowItem } from "./toolbar-data";
import { ToolbarItem } from "./ToolbarItem";
import { ChatInput } from "./ChatInput";
import { PlusMenu } from "./PlusMenu";
import { VoiceStopButton } from "./VoiceStopButton";
import { StickerPicker } from "../StickerPicker";
import {
  TOOLBAR_HEIGHT,
  CELL_W,
  CELL_H,
  CONTAINER_RADIUS,
  CONTAINER_PADDING,
  CHAT_INPUT_WIDTH,
  CHAT_INPUT_WIDTH_FOCUSED,
  DISCONNECTED_GAP,
  SPRING,
} from "./toolbar-constants";

interface ToolbarProps {
  editor: Editor | null;
  onToggleChat: () => void;
  isChatOpen: boolean;
  hideInput?: boolean;
  onSubmit: (text: string) => void;
  isLoading: boolean;
  voiceState?: "idle" | "connecting" | "listening" | "speaking" | "error";
  onVoiceToggle?: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
  canvasState?: { frames: any[]; orphans: any[]; arrows: any[] };
  onExpandedChange?: (expanded: boolean) => void;
  responseToast?: string | null;
  onDismissToast?: () => void;
  onOpenChat?: () => void;
  hasMessages?: boolean;
  hasPendingQuestion?: boolean;
  onSuggestionsVisibilityChange?: (visible: boolean) => void;
  onInputChange?: (hasText: boolean) => void;
  onCreateDocument?: () => void;
  onCreateDataTable?: () => void;
  onPlaceSticker?: (
    sticker: { url: string; width: number; height: number; id: string },
    screenPos?: { x: number; y: number }
  ) => void;
  onCreateTaskCard?: () => void;
  onCreateGanttChart?: () => void;
  onCreateKanbanBoard?: () => void;
  onCreateApproveButton?: () => void;
  onMultiLineChange?: (multiLine: boolean) => void;
  isCommentMode?: boolean;
  onToggleCommentMode?: () => void;
}

export function Toolbar({
  editor,
  onToggleChat: _onToggleChat,
  isChatOpen,
  hideInput: _hideInput = false,
  onSubmit,
  isLoading,
  voiceState = "idle",
  onVoiceToggle,
  isMuted = false,
  onToggleMute,
  canvasState = { frames: [], orphans: [], arrows: [] },
  onExpandedChange,
  responseToast,
  onDismissToast,
  onOpenChat,
  hasMessages = false,
  hasPendingQuestion = false,
  onSuggestionsVisibilityChange,
  onInputChange,
  onCreateDocument,
  onCreateDataTable,
  onPlaceSticker,
  onCreateTaskCard,
  onCreateGanttChart,
  onCreateKanbanBoard,
  onCreateApproveButton,
  onMultiLineChange: _onMultiLineChange,
  isCommentMode = false,
  onToggleCommentMode,
}: ToolbarProps) {
  const [activeTool, setActiveTool] = useState("cursor");
  const [isChatFocused, setIsChatFocused] = useState(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [isStickerPickerOpen, setIsStickerPickerOpen] = useState(false);
  const emojiContainerRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const voiceActivateSoundRef = useRef<HTMLAudioElement | null>(null);
  const voiceDeactivateSoundRef = useRef<HTMLAudioElement | null>(null);
  const prevVoiceActiveRef = useRef(false);

  const isVoiceActive = voiceState !== "idle";
  const isConnected = !isChatFocused && !isVoiceActive;
  const showRightSection = !isChatOpen;

  // Play sound when entering voice mode
  useEffect(() => {
    if (isVoiceActive) {
      if (!voiceActivateSoundRef.current) {
        voiceActivateSoundRef.current = new Audio("/voice-activate.mp3");
      }
      voiceActivateSoundRef.current.currentTime = 0;
      voiceActivateSoundRef.current.play();
    }
  }, [isVoiceActive]);

  // Play sound when exiting voice mode
  useEffect(() => {
    if (prevVoiceActiveRef.current && !isVoiceActive) {
      if (!voiceDeactivateSoundRef.current) {
        voiceDeactivateSoundRef.current = new Audio("/voice-deactivate.mp3");
      }
      voiceDeactivateSoundRef.current.currentTime = 0;
      voiceDeactivateSoundRef.current.play();
    }
    prevVoiceActiveRef.current = isVoiceActive;
  }, [isVoiceActive]);

  // Map overflow item IDs to creation callbacks
  const overflowActions = useMemo<Record<string, (() => void) | undefined>>(
    () => ({
      "task-card": onCreateTaskCard,
      approve: onCreateApproveButton,
      document: onCreateDocument,
      "data-table": onCreateDataTable,
      timeline: onCreateGanttChart,
      kanban: onCreateKanbanBoard,
    }),
    [
      onCreateTaskCard,
      onCreateApproveButton,
      onCreateDocument,
      onCreateDataTable,
      onCreateGanttChart,
      onCreateKanbanBoard,
    ]
  );

  // Determine which tool is logically active (for highlight + isActive color)
  const getActiveToolId = useCallback(() => {
    if (isPlusMenuOpen) return "plus";
    if (isStickerPickerOpen) return "emoji";
    if (isCommentMode) return "comment";
    return activeTool;
  }, [isPlusMenuOpen, isStickerPickerOpen, isCommentMode, activeTool]);

  const activeToolId = getActiveToolId();
  const activeIndex = primaryTools.findIndex((t) => t.id === activeToolId);

  // Visible tools: when chat focused, only show "plus"
  const visibleTools = isChatFocused
    ? primaryTools.filter((t) => t.id === "plus")
    : primaryTools;

  // Handle primary tool clicks
  const handleToolClick = useCallback(
    (toolId: string) => {
      const tool = primaryTools.find((t) => t.id === toolId);
      if (!tool) return;

      if (tool.actionType === "plus") {
        setIsPlusMenuOpen((v) => !v);
        setIsStickerPickerOpen(false);
        return;
      }

      if (tool.actionType === "emoji") {
        setIsStickerPickerOpen((v) => !v);
        setIsPlusMenuOpen(false);
        return;
      }

      if (tool.actionType === "comment") {
        onToggleCommentMode?.();
        if (!isCommentMode && editor) {
          editor.setCurrentTool("select");
          setActiveTool("cursor");
        }
        setIsPlusMenuOpen(false);
        setIsStickerPickerOpen(false);
        return;
      }

      if (tool.tldrawTool && editor) {
        editor.setCurrentTool(tool.tldrawTool);
        setActiveTool(toolId);
        if (isCommentMode) {
          onToggleCommentMode?.();
        }
      }
      setIsPlusMenuOpen(false);
      setIsStickerPickerOpen(false);
    },
    [editor, isCommentMode, onToggleCommentMode]
  );

  // Handle overflow menu item selection
  const handleOverflowSelect = useCallback(
    (item: OverflowItem) => {
      if (item.tldrawTool && editor) {
        editor.setCurrentTool(item.tldrawTool);
        setActiveTool(item.id);
        if (isCommentMode) {
          onToggleCommentMode?.();
        }
      } else {
        const action = overflowActions[item.id];
        action?.();
      }
      setIsPlusMenuOpen(false);
    },
    [editor, isCommentMode, onToggleCommentMode, overflowActions]
  );

  // Handle chat focus change
  const handleChatFocusChange = useCallback(
    (focused: boolean) => {
      setIsChatFocused(focused);
    },
    []
  );

  // Notify parent of expanded state changes
  useEffect(() => {
    onExpandedChange?.(isChatFocused);
  }, [isChatFocused, onExpandedChange]);

  return (
    <div
      ref={toolbarRef}
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[70]"
      onWheel={(e) => e.stopPropagation()}
    >
      <div
        className="relative flex items-center"
        style={{ height: TOOLBAR_HEIGHT }}
      >
        {/* Left section: tools */}
        <div
          className="flex items-center bg-white"
          style={{
            height: TOOLBAR_HEIGHT,
            padding: `0 ${CONTAINER_PADDING}px`,
            borderRadius:
              isConnected && showRightSection
                ? `${CONTAINER_RADIUS}px 0 0 ${CONTAINER_RADIUS}px`
                : `${CONTAINER_RADIUS}px`,
            boxShadow:
              isConnected && showRightSection
                ? "none"
                : "0 6px 16px rgba(34,36,40,0.12), 0 0px 8px rgba(34,36,40,0.06)",
            transition:
              "border-radius 0.35s cubic-bezier(0.25,0.1,0.25,1), box-shadow 0.35s cubic-bezier(0.25,0.1,0.25,1)",
          }}
        >
          <div className="relative flex items-center">
            {/* Active tool highlight — sliding pill */}
            {activeIndex >= 0 && !isChatFocused && (
              <motion.div
                className="absolute top-0 left-0 rounded-[18px] bg-[#e8ecfc]"
                animate={{ x: activeIndex * CELL_W }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                style={{ width: CELL_W, height: CELL_H }}
              />
            )}

            <AnimatePresence initial={false}>
              {visibleTools.map((tool) => (
                <motion.div
                  key={tool.id}
                  ref={tool.id === "emoji" ? emojiContainerRef : undefined}
                  className={
                    tool.id === "plus" || tool.id === "emoji"
                      ? "relative"
                      : undefined
                  }
                  initial={{ opacity: 0, width: 0, scale: 0.8 }}
                  animate={{ opacity: 1, width: CELL_W, scale: 1 }}
                  exit={{ opacity: 0, width: 0, scale: 0.8 }}
                  transition={{
                    duration: 0.2,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                  style={{
                    overflow:
                      tool.id === "plus" || tool.id === "emoji"
                        ? undefined
                        : "hidden",
                  }}
                >
                  <ToolbarItem
                    tool={tool}
                    isActive={tool.id === activeToolId}
                    onClick={() => handleToolClick(tool.id)}
                  />

                  {/* Plus menu */}
                  {tool.id === "plus" && (
                    <PlusMenu
                      open={isPlusMenuOpen}
                      onClose={() => setIsPlusMenuOpen(false)}
                      onSelectItem={handleOverflowSelect}
                    />
                  )}

                  {/* Sticker picker */}
                  {tool.id === "emoji" && (
                    <StickerPicker
                      isOpen={isStickerPickerOpen}
                      onClose={() => setIsStickerPickerOpen(false)}
                      onPlaceSticker={(sticker, screenPos) =>
                        onPlaceSticker?.(sticker, screenPos)
                      }
                      triggerRef={
                        emojiContainerRef as React.RefObject<HTMLButtonElement | null>
                      }
                    />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Right section: chat input + voice */}
        {showRightSection && (
          <motion.div
            className="flex items-center justify-center bg-white"
            animate={{
              marginLeft: isConnected ? 0 : DISCONNECTED_GAP,
              width: isVoiceActive
                ? 160
                : isChatFocused
                  ? CHAT_INPUT_WIDTH_FOCUSED + CONTAINER_PADDING * 2
                  : CHAT_INPUT_WIDTH + CONTAINER_PADDING * 2,
            }}
            transition={{
              marginLeft: SPRING,
              width: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
            }}
            style={{
              height: TOOLBAR_HEIGHT,
              padding: `0 ${CONTAINER_PADDING}px`,
              borderRadius: isConnected
                ? `0 ${CONTAINER_RADIUS}px ${CONTAINER_RADIUS}px 0`
                : `${CONTAINER_RADIUS}px`,
              boxShadow: isConnected
                ? "none"
                : "0 6px 16px rgba(34,36,40,0.12), 0 0px 8px rgba(34,36,40,0.06)",
              transition:
                "border-radius 0.35s cubic-bezier(0.25,0.1,0.25,1), box-shadow 0.35s cubic-bezier(0.25,0.1,0.25,1)",
            }}
          >
            {isVoiceActive ? (
              <VoiceStopButton
                voiceState={voiceState}
                onStop={() => onVoiceToggle?.()}
              />
            ) : (
              <div style={{ width: isChatFocused ? CHAT_INPUT_WIDTH_FOCUSED : CHAT_INPUT_WIDTH }}>
                <ChatInput
                  onSubmit={onSubmit}
                  onFocusChange={handleChatFocusChange}
                  onVoiceStart={onVoiceToggle}
                  isLoading={isLoading}
                  hasMessages={hasMessages}
                  hasPendingQuestion={hasPendingQuestion}
                  canvasState={canvasState}
                  onSuggestionsVisibilityChange={
                    onSuggestionsVisibilityChange
                  }
                  onInputChange={onInputChange}
                  responseToast={responseToast}
                  onDismissToast={onDismissToast}
                  onOpenChat={onOpenChat}
                  voiceState={voiceState}
                />
              </div>
            )}
          </motion.div>
        )}

        {/* Shared shadow overlay when connected */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            borderRadius: CONTAINER_RADIUS,
            boxShadow:
              "0 6px 16px rgba(34,36,40,0.12), 0 0px 8px rgba(34,36,40,0.06)",
            opacity: isConnected && showRightSection ? 1 : 0,
            transition: "opacity 0.35s cubic-bezier(0.25,0.1,0.25,1)",
          }}
        />
      </div>

      {/* Floating mute button — pinned right of toolbar when voice active */}
      <AnimatePresence>
        {isVoiceActive && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, x: -8 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: -8 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onClick={onToggleMute}
            className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full transition-colors ${
              isMuted
                ? "bg-[#FF4444] text-white hover:bg-[#e63e3e]"
                : "bg-white/80 text-[#222428] hover:bg-white"
            }`}
            style={{
              left: "calc(100% + 12px)",
              width: 40,
              height: 40,
              boxShadow: isMuted
                ? "none"
                : "0 2px 8px rgba(34,36,40,0.10)",
            }}
            title={isMuted ? "Unmute microphone" : "Mute microphone"}
          >
            <span className="flex items-center justify-center" style={{ width: 20, height: 20 }}>
              {isMuted ? <IconMicrophoneSlash /> : <IconMicrophone />}
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
