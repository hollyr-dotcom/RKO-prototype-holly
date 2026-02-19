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

/** Stylised Gantt illustration — abstract timeline showing delay (Figma node 1124:3653) */
function GanttIllustration() {
  return (
    <svg width="296" height="168" viewBox="0 0 296 168" preserveAspectRatio="xMidYMid meet">
      {/* Phase 1 bar — light grey, short, left of today line */}
      <rect x="35" y="37" width="113" height="22" rx="4" fill="#d1d5db" />
      {/* Phase 2 bar — light grey, longer, crosses today line */}
      <rect x="35" y="77" width="202" height="22" rx="4" fill="#d1d5db" />
      {/* Today vertical line */}
      <line x1="149" y1="20" x2="149" y2="168" stroke="#9ca3af" strokeWidth="1.5" />
      {/* Delay marker — red */}
      <rect x="115" y="116" width="28" height="22" rx="3" fill="#EF4444" />
      {/* Active phase bar — cyan */}
      <rect x="148" y="116" width="121" height="22" rx="4" fill="#22D3EE" />
    </svg>
  );
}

/** Stylised timeline conflict illustration — overlapping bars (Figma node 1126:3663) */
function TimelineConflictIllustration() {
  return (
    <svg width="234" height="148" viewBox="0 0 234 148" fill="none">
      {/* Pink bar — top, left-aligned with yellow */}
      <rect x="10" y="30" width="95" height="22" rx="4" fill="#F9A8D4" />
      {/* Yellow bar — middle, same left edge as pink, wider */}
      <rect x="10" y="63" width="185" height="22" rx="4" fill="#FBBF24" />
      {/* Cyan bar — bottom, starts near today line, extends to right edge */}
      <rect x="90" y="96" width="140" height="22" rx="4" fill="#7DD3FC" />
      {/* Today vertical line */}
      <line x1="105" y1="16" x2="105" y2="132" stroke="#1E1E2E" strokeWidth="1.5" />
    </svg>
  );
}

/** Stylised OKR progress ring — 3/8 behind pace (Figma node 1108:5303) */
function OkrRingIllustration() {
  // Ring with a gap at the bottom (~270° arc total)
  // 3/8 of the arc is gold (behind), rest is light gray
  const cx = 97;
  const cy = 97;
  const r = 82;
  const strokeW = 18;
  // Arc starts at 135° (bottom-left) and sweeps 270° clockwise to 45° (bottom-right)
  const totalArcDeg = 270;
  const behindFraction = 3 / 8;
  const behindDeg = totalArcDeg * behindFraction;
  const onTrackDeg = totalArcDeg - behindDeg;
  const startAngle = 135; // bottom-left

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const px = (angle: number) => cx + r * Math.cos(toRad(angle));
  const py = (angle: number) => cy + r * Math.sin(toRad(angle));

  // Gold arc: from startAngle, sweeping behindDeg
  const goldEnd = startAngle + behindDeg;
  const goldLargeArc = behindDeg > 180 ? 1 : 0;
  const goldPath = `M ${px(startAngle)} ${py(startAngle)} A ${r} ${r} 0 ${goldLargeArc} 1 ${px(goldEnd)} ${py(goldEnd)}`;

  // Gray arc: from goldEnd, sweeping onTrackDeg
  const grayEnd = goldEnd + onTrackDeg;
  const grayLargeArc = onTrackDeg > 180 ? 1 : 0;
  const grayPath = `M ${px(goldEnd)} ${py(goldEnd)} A ${r} ${r} 0 ${grayLargeArc} 1 ${px(grayEnd)} ${py(grayEnd)}`;

  return (
    <svg width="194" height="194" viewBox="0 0 194 194" fill="none">
      <path d={grayPath} stroke="#E5E7EB" strokeWidth={strokeW} strokeLinecap="round" fill="none" />
      <path d={goldPath} stroke="#FBBF24" strokeWidth={strokeW} strokeLinecap="round" fill="none" />
      <text x={cx} y={cy + 4} textAnchor="middle" dominantBaseline="middle" fontSize="28" fontWeight="700" fill="#374151">3/8</text>
    </svg>
  );
}

export function AgentOpportunityContent({ item }: AgentOpportunityProps) {
  const { forecast, capacity, capacityConflict, confidence, convergence, stalled, invitationStall } = item.payload;

  const hasPayloadContent = forecast || capacity || capacityConflict || confidence != null || convergence || stalled || invitationStall;

  if (!hasPayloadContent) {
    if (item.id === "feed-core-01") {
      return <GanttIllustration />;
    }
    if (item.id === "feed-pq3-01") {
      return <TimelineConflictIllustration />;
    }
    if (item.id === "feed-cross-01") {
      return <OkrRingIllustration />;
    }
    return null;
  }

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
