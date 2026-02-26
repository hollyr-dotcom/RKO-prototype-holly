"use client";

import { useRef, useEffect, useCallback } from "react";
import { generateScaleFromHue, SCALE_STEPS } from "@/lib/oklch";

interface SpaceColorSettingsProps {
  hue: number;
  chroma: number;
  onHueChange: (hue: number) => void;
  onChromaChange: (chroma: number) => void;
  onClose: () => void;
}

const CHROMA_MIN = 0.05;
const CHROMA_MAX = 0.30;

export function SpaceColorSettings({
  hue,
  chroma,
  onHueChange,
  onChromaChange,
  onClose,
}: SpaceColorSettingsProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  const scale = generateScaleFromHue(hue, chroma);

  const handleHueInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onHueChange(Number(e.target.value));
    },
    [onHueChange]
  );

  const handleChromaInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChromaChange(Number(e.target.value));
    },
    [onChromaChange]
  );

  return (
    <div
      ref={popoverRef}
      className="absolute right-0 z-50 bg-white rounded-xl"
      style={{
        top: "calc(100% + 8px)",
        width: 280,
        padding: 16,
        boxShadow:
          "0px 6px 16px 0px rgba(34,36,40,0.12), 0px 0px 8px 0px rgba(34,36,40,0.06)",
      }}
    >
      {/* Hue */}
      <label className="block mb-3">
        <span className="text-xs font-medium text-gray-600 mb-1.5 block">
          Hue
          <span className="text-gray-400 font-normal ml-1">{Math.round(hue)}°</span>
        </span>
        <div className="relative h-6 rounded-full overflow-hidden">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
            }}
          />
          <input
            type="range"
            min={0}
            max={359}
            step={1}
            value={hue}
            onChange={handleHueInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          {/* Thumb indicator */}
          <div
            className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              left: `${(hue / 359) * 100}%`,
              marginLeft: -8,
              width: 16,
              height: 16,
              borderRadius: "50%",
              backgroundColor: scale[10],
              border: "2px solid white",
              boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
            }}
          />
        </div>
      </label>

      {/* Chroma */}
      <label className="block mb-4">
        <span className="text-xs font-medium text-gray-600 mb-1.5 block">
          Chroma
          <span className="text-gray-400 font-normal ml-1">{chroma.toFixed(2)}</span>
        </span>
        <div className="relative h-6 rounded-full overflow-hidden">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `linear-gradient(to right, ${generateScaleFromHue(hue, CHROMA_MIN)[5]}, ${generateScaleFromHue(hue, CHROMA_MAX)[5]})`,
            }}
          />
          <input
            type="range"
            min={CHROMA_MIN}
            max={CHROMA_MAX}
            step={0.005}
            value={chroma}
            onChange={handleChromaInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          {/* Thumb indicator */}
          <div
            className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              left: `${((chroma - CHROMA_MIN) / (CHROMA_MAX - CHROMA_MIN)) * 100}%`,
              marginLeft: -8,
              width: 16,
              height: 16,
              borderRadius: "50%",
              backgroundColor: scale[5],
              border: "2px solid white",
              boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
            }}
          />
        </div>
      </label>

      {/* Scale preview */}
      <div>
        <span className="text-xs font-medium text-gray-600 mb-1.5 block">
          Scale preview
        </span>
        <div className="flex gap-0.5">
          {scale.map((hex, i) => (
            <div
              key={SCALE_STEPS[i]}
              className="flex-1 rounded-sm"
              style={{ backgroundColor: hex, height: 20 }}
              title={`${SCALE_STEPS[i]}: ${hex}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
