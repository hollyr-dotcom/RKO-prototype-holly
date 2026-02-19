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
      className="flex shrink-0 items-center justify-center text-[#222428] hover:brightness-95"
    >
      {voiceState === "speaking" ? (
        <Lottie
          animationData={aiSpeakingAnimation}
          loop
          style={{ width: ICON_SIZE, height: ICON_SIZE }}
        />
      ) : voiceState === "listening" ? (
        <Lottie
          animationData={aiListeningAnimation}
          loop
          style={{ width: ICON_SIZE, height: ICON_SIZE }}
        />
      ) : (
        <svg
          width="27"
          height="26"
          viewBox="0 0 27 26"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: ICON_SIZE, height: ICON_SIZE }}
        >
          <ellipse cx="6.55805" cy="12.8569" rx="3.53571" ry="8.59625" fill="currentColor" />
          <ellipse cx="13.1158" cy="12.857" rx="3.53571" ry="12.2207" fill="currentColor" />
          <ellipse cx="19.6737" cy="12.8569" rx="3.53571" ry="10.1568" fill="currentColor" />
        </svg>
      )}
    </button>
  );
}
