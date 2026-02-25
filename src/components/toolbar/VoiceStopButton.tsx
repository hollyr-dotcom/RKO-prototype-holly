"use client";

import Lottie from "lottie-react";
import aiListeningAnimation from "./lottie/ai-listening.json";
import aiSpeakingAnimation from "./lottie/ai-speaking.json";
import {
  TOOLBAR_HEIGHT,
  CONTAINER_PADDING,
  CONTAINER_RADIUS,
  ICON_SIZE,
} from "./toolbar-constants";

interface VoiceStopButtonProps {
  voiceState: "idle" | "connecting" | "listening" | "speaking" | "error";
  onStop: () => void;
}

export function VoiceStopButton({ voiceState, onStop }: VoiceStopButtonProps) {
  const buttonWidth = 160 - CONTAINER_PADDING * 2;
  const buttonHeight = TOOLBAR_HEIGHT - CONTAINER_PADDING * 2;

  return (
    <button
      onClick={onStop}
      style={{
        width: buttonWidth,
        height: buttonHeight,
        backgroundColor: voiceState === "error" ? "#FF4444" : "#FFD02F",
        borderRadius: CONTAINER_RADIUS - CONTAINER_PADDING,
      }}
      className="flex shrink-0 items-center justify-center text-gray-900 hover:brightness-95"
    >
      <Lottie
        animationData={voiceState === "speaking" ? aiSpeakingAnimation : aiListeningAnimation}
        loop
        style={{ width: ICON_SIZE, height: ICON_SIZE }}
      />
    </button>
  );
}
