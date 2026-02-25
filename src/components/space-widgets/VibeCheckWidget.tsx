"use client";

import Image from "next/image";

interface VibeResponse {
  avatar: string;
  position: number;
  offsetY?: number;
}

interface VibeCheckWidgetProps {
  title: string;
  responses: VibeResponse[];
}

export function VibeCheckWidget({ title, responses }: VibeCheckWidgetProps) {
  return (
    <div className="rounded-[24px] p-[24px]" style={{ backgroundColor: "var(--space-widget-bg)" }}>
      <h3 className="text-[20px] font-semibold text-[#222428] mb-5">{title}</h3>
      {/* Emoji endpoints */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[20px]">😴</span>
        <span className="text-[20px]">🔥</span>
      </div>
      {/* Gradient bar with avatars */}
      <div className="relative">
        <div
          className="rounded-full"
          style={{
            height: 24,
            background:
              "linear-gradient(90deg, #ff6b6b, #feca57, #48dbfb, #1dd1a1, #10ac84)",
          }}
        />
        {/* Avatars positioned along the bar */}
        {responses.map((r, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${r.position}%`,
              top: "50%",
              transform: `translate(-50%, calc(-50% + ${r.offsetY ?? 0}px))`,
            }}
          >
            <Image
              src={r.avatar}
              alt=""
              width={24}
              height={24}
              className="rounded-full object-cover ring-2 ring-white"
              style={{ width: 24, height: 24 }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
