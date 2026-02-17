"use client";

import type { FeedItem } from "@/types/feed";

type AlertFYIItem = Extract<FeedItem, { type: "alert-fyi" }>;

interface AlertFYIProps {
  item: AlertFYIItem;
}

function WeatherIcon({ condition }: { condition: string }) {
  if (condition === "rain" || condition === "storm") {
    return (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mx-auto">
        <circle cx="24" cy="18" r="12" fill="#60a5fa" opacity="0.8" />
        <circle cx="14" cy="22" r="8" fill="#93c5fd" opacity="0.9" />
        <circle cx="34" cy="22" r="8" fill="#93c5fd" opacity="0.9" />
        <path d="M20 32 L18 38" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M24 30 L22 36" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M28 32 L26 38" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (condition === "cloudy") {
    return (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mx-auto">
        <circle cx="24" cy="20" r="11" fill="#9ca3af" opacity="0.7" />
        <circle cx="15" cy="24" r="7" fill="#d1d5db" opacity="0.8" />
        <circle cx="33" cy="24" r="7" fill="#d1d5db" opacity="0.8" />
      </svg>
    );
  }

  return null;
}

export function AlertFYIContent({ item }: AlertFYIProps) {
  const { forecast } = item.payload;

  if (!forecast) return null;

  return (
    <div className="px-6 pb-6">
      <div className="mt-3 rounded-xl bg-gray-50 p-6">
        <div className="grid grid-cols-4 gap-4">
          {forecast.days.map((day, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className="text-sm font-semibold text-gray-900 mb-3">
                {day.day}
              </div>
              <WeatherIcon condition={day.condition} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
