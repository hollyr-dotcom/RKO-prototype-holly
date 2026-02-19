"use client";

import type { FeedItem } from "@/types/feed";

type AgentOpportunityItem = Extract<FeedItem, { type: "agent-opportunity" }>;

interface AgentOpportunityProps {
  item: AgentOpportunityItem;
}

function ConflictTimeline({ capacity }: { capacity: { venue: number; expected: number; overflow: number } }) {
  const venuePercentage = (capacity.venue / capacity.expected) * 100;

  return (
    <div className="w-full px-6 space-y-3">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-gray-500">Venue Capacity</span>
          <span className="text-xs font-semibold text-gray-700">{capacity.venue}</span>
        </div>
        <div className="h-2.5 rounded-full bg-gray-200 relative overflow-hidden">
          <div className="absolute h-full rounded-full bg-gray-400" style={{ width: `${venuePercentage}%` }} />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-gray-500">Expected Attendance</span>
          <span className="text-xs font-semibold text-amber-600">{capacity.expected}</span>
        </div>
        <div className="h-2.5 rounded-full bg-gray-200 relative overflow-hidden">
          <div className="absolute h-full rounded-full bg-amber-400" style={{ width: "100%" }} />
        </div>
      </div>
    </div>
  );
}

function WeatherIcon({ condition }: { condition: string }) {
  if (condition === "rain" || condition === "storm") {
    return (
      <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="18" r="12" fill="#93c5fd" />
        <circle cx="14" cy="22" r="8" fill="#bfdbfe" />
        <circle cx="34" cy="22" r="8" fill="#bfdbfe" />
        <path d="M20 32 L18 38" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M24 30 L22 36" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M28 32 L26 38" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (condition === "cloudy") {
    return (
      <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="20" r="11" fill="#d1d5db" />
        <circle cx="15" cy="24" r="7" fill="#e5e7eb" />
        <circle cx="33" cy="24" r="7" fill="#e5e7eb" />
      </svg>
    );
  }
  if (condition === "sunny") {
    return (
      <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="10" fill="#fbbf24" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          return <line key={angle} x1={24 + 14 * Math.cos(rad)} y1={24 + 14 * Math.sin(rad)} x2={24 + 18 * Math.cos(rad)} y2={24 + 18 * Math.sin(rad)} stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />;
        })}
      </svg>
    );
  }
  return null;
}

function WeatherForecast({ forecast }: { forecast: { days: Array<{ day: string; condition: string }> } }) {
  return (
    <div className="w-full px-6">
      <div className="grid grid-cols-4 gap-2">
        {forecast.days.map((day, index) => (
          <div key={index} className="flex flex-col items-center gap-2">
            <WeatherIcon condition={day.condition} />
            <div className="text-xs font-medium text-gray-500">{day.day}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RiskStallIndicator({ days }: { days: number }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <svg width="72" height="64" viewBox="0 0 100 90" fill="none">
        <path d="M50 10 L90 78 L10 78 Z" fill="none" stroke="#f97316" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="50" y1="30" x2="50" y2="52" stroke="#f97316" strokeWidth="4" strokeLinecap="round" />
        <circle cx="50" cy="63" r="3.5" fill="#f97316" />
      </svg>
      <div className="text-sm font-semibold text-orange-600">
        {days} {days === 1 ? "day" : "days"} stalled
      </div>
    </div>
  );
}

function ConvergenceDiagram({ sources, target }: { sources: Array<{ label: string; color: string }>; target: { label: string; color: string } }) {
  return (
    <div className="w-full px-4 flex items-center gap-4">
      <div className="space-y-3 flex-shrink-0">
        {sources.map((source, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gray-400 flex-shrink-0" />
            <span className="text-xs text-gray-500">{source.label}</span>
          </div>
        ))}
      </div>
      <svg width="120" height="90" viewBox="0 0 200 120" className="flex-shrink-0">
        <path d="M30 20 Q100 20, 160 60" stroke="#d1d5db" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M30 60 L160 60" stroke="#d1d5db" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M30 100 Q100 100, 160 60" stroke="#d1d5db" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <circle cx="20" cy="20" r="6" fill="#d1d5db" />
        <circle cx="20" cy="60" r="6" fill="#d1d5db" />
        <circle cx="20" cy="100" r="6" fill="#d1d5db" />
        <path d="M155 57 L160 60 L155 63" stroke="#10b981" strokeWidth="2" fill="none" strokeLinecap="round" />
        <circle cx="170" cy="60" r="10" fill="#10b981" />
      </svg>
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
        <span className="text-xs font-medium text-emerald-700">{target.label}</span>
      </div>
    </div>
  );
}

function GapIndicator({ confidence }: { confidence: number }) {
  const percentage = Math.round(confidence * 100);
  const r = 38;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative">
      <svg width="120" height="120" viewBox="0 0 120 120" className="transform -rotate-90">
        <circle cx="60" cy="60" r={r} stroke="#e5e7eb" strokeWidth="10" fill="none" />
        <circle
          cx="60" cy="60" r={r}
          stroke="#6366f1" strokeWidth="10" fill="none"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-3xl font-bold text-gray-800 leading-none">{percentage}%</div>
        <div className="text-xs font-medium text-gray-400 mt-0.5">Confidence</div>
      </div>
    </div>
  );
}

function VenueCapacity({ capacity }: { capacity: { venue: number; expected: number; overflow: number } }) {
  const venuePercentage = (capacity.venue / capacity.expected) * 100;
  const overflowPercentage = (capacity.overflow / capacity.expected) * 100;

  return (
    <div className="w-full px-6 space-y-3">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-gray-500">Venue Capacity</span>
          <span className="text-xs font-semibold text-gray-700">{capacity.venue}</span>
        </div>
        <div className="h-2.5 rounded-full bg-gray-200 relative overflow-hidden">
          <div className="absolute h-full rounded-full bg-gray-400" style={{ width: `${venuePercentage}%` }} />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-gray-500">Expected Attendance</span>
          <span className="text-xs font-semibold text-amber-600">{capacity.expected}</span>
        </div>
        <div className="h-2.5 rounded-full bg-gray-200 relative overflow-hidden">
          <div className="absolute h-full rounded-full bg-amber-400" style={{ width: "100%" }} />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-gray-500">Overflow</span>
          <span className="text-xs font-semibold text-red-600">{capacity.overflow}</span>
        </div>
        <div className="h-2.5 rounded-full bg-gray-200 relative overflow-hidden">
          <div className="absolute h-full rounded-full bg-red-400" style={{ width: `${overflowPercentage}%` }} />
        </div>
      </div>
    </div>
  );
}

function InvitationStall({ invitations, days }: { invitations: number; days: number }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-3">
        {Array.from({ length: invitations }, (_, i) => (
          <div key={i} className="relative">
            <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
              <rect x="4" y="8" width="24" height="16" rx="2" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="1.5" />
              <path d="M4 10L16 18L28 10" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-white text-[9px] font-bold">?</div>
          </div>
        ))}
      </div>
      <div className="text-sm font-semibold text-red-600">
        {days} {days === 1 ? "day" : "days"} — no response
      </div>
    </div>
  );
}

export function AgentOpportunityContent({ item }: AgentOpportunityProps) {
  const { forecast, capacity, capacityConflict, confidence, convergence, stalled, invitationStall } = item.payload;

  return (
    <div className="w-full flex items-center justify-center">
      {forecast && <WeatherForecast forecast={forecast} />}
      {capacity && <ConflictTimeline capacity={capacity} />}
      {capacityConflict && <VenueCapacity capacity={capacityConflict} />}
      {convergence && <ConvergenceDiagram sources={convergence.sources} target={convergence.target} />}
      {confidence != null && <GapIndicator confidence={confidence} />}
      {stalled && <RiskStallIndicator days={stalled.days} />}
      {invitationStall && <InvitationStall invitations={invitationStall.invitations} days={invitationStall.days} />}
    </div>
  );
}
