"use client";

import { useState, useEffect } from "react";

interface CountdownWidgetProps {
  title: string;
  emoji?: string;
  targetDate: string;
}

function computeCountdown(targetDate: string) {
  const diff = Math.max(0, new Date(targetDate).getTime() - Date.now());
  const totalMinutes = Math.floor(diff / 60_000);
  const days = Math.floor(totalMinutes / 1440);
  const hrs = Math.floor((totalMinutes % 1440) / 60);
  const mins = totalMinutes % 60;
  return { days, hrs, mins };
}

function CalendarTile({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="flex flex-col overflow-hidden rounded-[16px]"
        style={{
          width: 54,
          height: 50,
          boxShadow: "0px 2px 4px rgba(34,36,40,0.08)",
          backgroundColor: "#fff",
        }}
      >
        {/* Purple header bar — uses space accent color */}
        <div className="shrink-0" style={{ height: 11, backgroundColor: "var(--space-accent)" }} />
        {/* Number */}
        <div className="flex flex-1 items-center justify-center">
          <span className="text-[24px] font-bold leading-none text-[#222428]">
            {value}
          </span>
        </div>
      </div>
      <span className="text-[14px] text-[#222428]">{label}</span>
    </div>
  );
}

export function CountdownWidget({ title, targetDate }: CountdownWidgetProps) {
  const [countdown, setCountdown] = useState(() => computeCountdown(targetDate));

  useEffect(() => {
    setCountdown(computeCountdown(targetDate));
    const id = setInterval(() => {
      setCountdown(computeCountdown(targetDate));
    }, 60_000);
    return () => clearInterval(id);
  }, [targetDate]);

  return (
    <div className="rounded-[24px] p-[24px]" style={{ backgroundColor: "var(--space-widget-bg)" }}>
      <h3 className="text-[20px] font-semibold text-[#222428] mb-5">{title}</h3>
      <div className="flex justify-between gap-[24px]">
        <CalendarTile value={countdown.days} label="DAYS" />
        <CalendarTile value={countdown.hrs} label="HRS" />
        <CalendarTile value={countdown.mins} label="MINS" />
      </div>
    </div>
  );
}
