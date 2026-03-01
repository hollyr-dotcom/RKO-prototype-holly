"use client";

import Link from "next/link";
import InsightsTopBar from "@/components/InsightsTopBar";

export default function SignalsPage() {
  return (
    <div className="flex flex-col h-full w-full bg-white">
      <InsightsTopBar />
      <div className="flex-1 flex items-center justify-center text-[#656b81]">
        <div className="text-center">
          <p className="text-xl font-semibold text-[#222428] mb-2">Signals</p>
          <p className="text-base">Coming soon</p>
          <Link href="/insights/overview" className="mt-6 inline-block text-sm underline text-[#3859ff]">
            Back to Overview
          </Link>
        </div>
      </div>
    </div>
  );
}
