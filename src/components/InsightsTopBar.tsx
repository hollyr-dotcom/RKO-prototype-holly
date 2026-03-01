"use client";

import Image from "next/image";
import { IconSparksFilled } from "@mirohq/design-system-icons";

export default function InsightsTopBar({ onPromptClick }: { onPromptClick?: () => void }) {
  return (
    <div className="flex items-center justify-between h-14 px-4 shrink-0">
      {/* Left: Miro logo */}
      <div className="flex items-center">
        <Image src="/miro-logo.svg" alt="Miro" width={56} height={20} priority />
      </div>

      {/* Right: AI prompt pill + bell + avatar */}
      <div className="flex items-center gap-3">
        {/* AI prompt pill */}
        <div
          className="flex items-center gap-2 h-9 px-3 rounded-full bg-white cursor-pointer hover:shadow-sm transition-all"
          style={{ width: 320 }}
          onClick={onPromptClick}
          role="button"
          aria-label="Open AI assistant"
        >
          {/* AI sparks icon */}
          <span className="shrink-0 text-[#3859ff] flex items-center" style={{ width: 16, height: 16 }}>
            <IconSparksFilled />
          </span>
          <span className="flex-1 text-sm text-[#959aac] truncate">Morning Kajsa, how can I help?</span>
          {/* Submit button */}
          <button className="w-6 h-6 rounded-full bg-[#e9eaef] flex items-center justify-center shrink-0 hover:bg-[#d8dae0] transition-colors">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 9V3M3 6l3-3 3 3" stroke="#656b81" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Bell with badge */}
        <div className="relative">
          <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[#f1f2f5] transition-colors text-[#222428]">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 16.5c.825 0 1.5-.675 1.5-1.5h-3c0 .825.675 1.5 1.5 1.5zm4.5-4.5V8.25c0-2.303-1.223-4.23-3.375-4.74V3c0-.622-.503-1.125-1.125-1.125S7.875 2.378 7.875 3v.51C5.715 4.02 4.5 5.94 4.5 8.25V12L3 13.5V14.25h12V13.5L13.5 12z" fill="currentColor" />
            </svg>
          </button>
          {/* Badge */}
          <div className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#3859ff] flex items-center justify-center">
            <span className="text-[10px] font-semibold text-white leading-none">9</span>
          </div>
        </div>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
          <Image src="/avatars/priya-sharma.png" alt="Kajsa" width={32} height={32} className="w-full h-full object-cover" />
        </div>
      </div>
    </div>
  );
}
