"use client";

import { IconLinesThreeHorizontal } from "@mirohq/design-system-icons";
import { useSidebar } from "@/hooks/useSidebar";

export function CollapsedBar() {
  const { toggleSidebar } = useSidebar();

  return (
    <div className="fixed top-0 left-0 z-50 pt-5 pl-5">
      <button
        onClick={toggleSidebar}
        className="flex items-center gap-1 bg-white hover:bg-gray-50 rounded-full border border-black/5 transition-colors duration-200 py-2 pl-3 pr-5"
        style={{
          boxShadow:
            "11px 14px 39px 0px rgba(151, 147, 184, 0.1), 43px 57px 71px 0px rgba(151, 147, 184, 0.09), 97px 128px 96px 0px rgba(151, 147, 184, 0.05)",
        }}
        title="Expand navigation"
      >
        {/* Hamburger icon */}
        <div className="w-8 h-8 flex items-center justify-center">
          <IconLinesThreeHorizontal css={{ width: 24, height: 24 }} />
        </div>

        {/* Brand icon */}
        <div className="w-8 h-8 flex items-center justify-center">
          <img src="/flexfund.svg" alt="FlexFund" width={24} height={24} />
        </div>

        {/* Logotype */}
        <span className="text-xl font-semibold text-gray-900 ml-1">
          FlexFund
        </span>
      </button>
    </div>
  );
}
