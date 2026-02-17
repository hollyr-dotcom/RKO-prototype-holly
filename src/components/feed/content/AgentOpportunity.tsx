"use client";

import type { FeedItem } from "@/types/feed";

type AgentOpportunityItem = Extract<FeedItem, { type: "agent-opportunity" }>;

interface AgentOpportunityProps {
  item: AgentOpportunityItem;
}


function ConflictTimeline({ capacity }: { capacity: { venue: number; expected: number; overflow: number } }) {
  const venuePercentage = (capacity.venue / capacity.expected) * 100;

  return (
    <div className="mt-3 py-8 px-10 rounded-2xl bg-gray-50">
      <div className="space-y-6">
        {/* Capacity bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-700">Venue Capacity</span>
            <span className="text-xs font-bold text-blue-600">{capacity.venue}</span>
          </div>
          <div className="h-8 rounded-full bg-white/60 shadow-inner relative overflow-hidden">
            <div
              className="absolute h-full rounded-full"
              style={{
                width: `${venuePercentage}%`,
                background: 'linear-gradient(to right, #3b82f6, #60a5fa)'
              }}
            />
          </div>
        </div>

        {/* Demand bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-700">Expected Attendance</span>
            <span className="text-xs font-bold text-orange-600">{capacity.expected}</span>
          </div>
          <div className="h-8 rounded-full bg-white/60 shadow-inner relative overflow-hidden">
            <div
              className="absolute h-full rounded-full"
              style={{
                width: '100%',
                background: 'linear-gradient(to right, #f59e0b, #f97316)'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
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

function WeatherForecast({ forecast }: { forecast: { days: Array<{ day: string; condition: string }> } }) {
  return (
    <div className="mt-3 rounded-2xl bg-gray-50 py-6 px-10">
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
  );
}

function RiskStallIndicator({ days }: { days: number }) {
  return (
    <div className="mt-3 py-12 px-10 rounded-2xl bg-gray-50">
      <div className="flex items-center justify-center">
        {/* Warning triangle with exclamation */}
        <svg width="100" height="100" viewBox="0 0 100 100" className="mx-auto">
          <defs>
            <linearGradient id="warning-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
          </defs>

          {/* Triangle outline */}
          <path
            d="M50 15 L85 75 L15 75 Z"
            fill="none"
            stroke="url(#warning-gradient)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Exclamation mark */}
          <line
            x1="50"
            y1="35"
            x2="50"
            y2="55"
            stroke="url(#warning-gradient)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle cx="50" cy="65" r="3" fill="url(#warning-gradient)" />
        </svg>
      </div>

      {/* Stalled status bars */}
      <div className="mt-4 space-y-2">
        <div className="h-2 rounded-full bg-white/60 shadow-inner relative overflow-hidden">
          <div
            className="absolute h-full w-[20%] rounded-full"
            style={{
              background: "linear-gradient(to right, #ef4444, #f97316)"
            }}
          />
        </div>
        <div className="text-center">
          <div className="text-sm font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
            {days} {days === 1 ? 'day' : 'days'} stalled
          </div>
        </div>
      </div>
    </div>
  );
}

function ConvergenceDiagram({ sources, target }: { sources: Array<{ label: string; color: string }>; target: { label: string; color: string } }) {
  return (
    <div className="mt-3 py-12 px-10 rounded-2xl bg-gray-50">
      <div className="flex items-center justify-between">
        {/* Source streams */}
        <div className="space-y-6 flex-1">
          {sources.map((source, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full" style={{background: `linear-gradient(135deg, ${source.color}, ${source.color}dd)`}}></div>
              <span className="text-xs font-medium text-gray-700">{source.label}</span>
            </div>
          ))}
        </div>

        {/* Convergence visualization */}
        <svg width="200" height="120" viewBox="0 0 200 120" className="mx-auto flex-shrink-0">
          <defs>
            <linearGradient id="flow-gradient-1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            <linearGradient id="flow-gradient-2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            <linearGradient id="flow-gradient-3" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            <radialGradient id="source-gradient">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#3b82f6" />
            </radialGradient>
            <radialGradient id="target-gradient">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#10b981" />
            </radialGradient>
          </defs>

          {/* Flowing paths with gradients */}
          <path
            d="M30 20 Q100 20, 160 60"
            stroke="url(#flow-gradient-1)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            opacity="0.8"
          />
          <path
            d="M30 60 L160 60"
            stroke="url(#flow-gradient-2)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            opacity="0.8"
          />
          <path
            d="M30 100 Q100 100, 160 60"
            stroke="url(#flow-gradient-3)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            opacity="0.8"
          />

          {/* Source circles with gradient */}
          <circle cx="20" cy="20" r="8" fill="url(#source-gradient)" />
          <circle cx="20" cy="60" r="8" fill="url(#source-gradient)" />
          <circle cx="20" cy="100" r="8" fill="url(#source-gradient)" />

          {/* Arrow indicators */}
          <path d="M155 57 L160 60 L155 63" stroke="#10b981" strokeWidth="2" fill="none" strokeLinecap="round" />

          {/* Target circle with gradient and glow */}
          <circle cx="170" cy="60" r="12" fill="url(#target-gradient)" opacity="0.3" />
          <circle cx="170" cy="60" r="10" fill="url(#target-gradient)" />
        </svg>

        {/* Target */}
        <div className="flex items-center gap-3 flex-1 justify-end">
          <span className="text-xs font-semibold text-green-700">{target.label}</span>
          <div className="w-4 h-4 rounded-full" style={{background: `linear-gradient(135deg, ${target.color}, ${target.color}dd)`}}></div>
        </div>
      </div>
    </div>
  );
}

function GapIndicator({ confidence }: { confidence: number }) {
  const percentage = Math.round(confidence * 100);
  const circumference = 2 * Math.PI * 45; // radius = 45
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="mt-3 py-12 px-10 rounded-2xl bg-gray-50 flex items-center justify-center">
      <div className="relative">
        {/* Circular progress ring */}
        <svg width="140" height="140" viewBox="0 0 140 140" className="transform -rotate-90">
          <defs>
            <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>

          {/* Background ring */}
          <circle
            cx="70"
            cy="70"
            r="45"
            stroke="#e0e7ff"
            strokeWidth="12"
            fill="none"
          />

          {/* Progress ring with gradient */}
          <circle
            cx="70"
            cy="70"
            r="45"
            stroke="url(#ring-gradient)"
            strokeWidth="12"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: "stroke-dashoffset 0.5s ease"
            }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
            {percentage}%
          </div>
          <div className="text-xs font-medium text-indigo-600 mt-1">
            Confidence
          </div>
        </div>
      </div>
    </div>
  );
}


function VenueCapacity({ capacity }: { capacity: { venue: number; expected: number; overflow: number } }) {
  const venuePercentage = (capacity.venue / capacity.expected) * 100;
  const expectedPercentage = 100;
  const overflowPercentage = (capacity.overflow / capacity.expected) * 100;

  return (
    <div className="mt-3 py-8 px-10 rounded-2xl bg-gray-50">
      <div className="flex items-center justify-center gap-4 mb-6">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M8 12h4v8H8zM20 12h4v8h-4z" fill="#ef4444" />
          <path d="M12 16h8v4h-8z" fill="#f87171" />
          <rect x="4" y="20" width="24" height="4" rx="1" fill="#b91c1c" />
        </svg>
      </div>
      <div className="space-y-4">
        {/* Venue bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-700">Venue Capacity</span>
            <span className="text-xs font-bold text-red-600">{capacity.venue}</span>
          </div>
          <div className="h-8 rounded-full bg-white/60 shadow-inner relative overflow-hidden">
            <div
              className="absolute h-full rounded-full"
              style={{
                width: `${venuePercentage}%`,
                background: 'linear-gradient(to right, #ef4444, #f87171)'
              }}
            />
          </div>
        </div>
        {/* Expected bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-700">Expected Attendance</span>
            <span className="text-xs font-bold text-amber-600">{capacity.expected}</span>
          </div>
          <div className="h-8 rounded-full bg-white/60 shadow-inner relative overflow-hidden">
            <div
              className="absolute h-full rounded-full"
              style={{
                width: '100%',
                background: 'linear-gradient(to right, #f59e0b, #fbbf24)'
              }}
            />
          </div>
        </div>
        {/* Overflow bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-700">Overflow</span>
            <span className="text-xs font-bold text-red-700">{capacity.overflow}</span>
          </div>
          <div className="h-8 rounded-full bg-white/60 shadow-inner relative overflow-hidden">
            <div
              className="absolute h-full rounded-full"
              style={{
                width: `${overflowPercentage}%`,
                background: 'linear-gradient(to right, #b91c1c, #dc2626)'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function InvitationStall({ invitations, days }: { invitations: number; days: number }) {
  return (
    <div className="mt-3 py-12 px-10 rounded-2xl bg-gray-50">
      <div className="flex items-center justify-center gap-3 mb-6">
        {Array.from({ length: invitations }, (_, i) => (
          <div key={i} className="relative">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect x="4" y="8" width="24" height="16" rx="2" fill="#e0e7ff" stroke="#6366f1" strokeWidth="1.5" />
              <path d="M4 10L16 18L28 10" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold">
              ?
            </div>
          </div>
        ))}
      </div>
      <div className="text-center">
        <div className="text-sm font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
          {days} {days === 1 ? 'day' : 'days'} — no response
        </div>
      </div>
    </div>
  );
}

export function AgentOpportunityContent({ item }: AgentOpportunityProps) {
  const { forecast, capacity, capacityConflict, confidence, convergence, stalled, invitationStall } = item.payload;

  return (
    <div className="px-6 pb-6">
      {/* Render bespoke visualization based on what data is present */}
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
