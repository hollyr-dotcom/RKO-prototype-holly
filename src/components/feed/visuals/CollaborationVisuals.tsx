"use client";

import { useId } from "react";

// 1. ReviewChecklist - 4 section bars with status dots
export function ReviewChecklist({ sections }: { sections: Array<{ label: string; status: "reviewed" | "pending" | "flagged" }> }) {
  return (
    <div className="mt-3 py-8 px-10 rounded-2xl bg-gray-50 max-h-[240px] overflow-hidden">
      <div className="space-y-3">
        {sections.map((section, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
              section.status === 'reviewed' ? 'bg-green-500' :
              section.status === 'flagged' ? 'bg-amber-500' :
              'bg-gray-300'
            }`} />
            <div className="flex-1 h-2 rounded-full bg-white/60" />
            <span className="text-xs text-gray-600 w-24 text-right">{section.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// 2. OptionCards - 3 pastel gradient cards (A/B/C)
export function OptionCards({ options }: { options: Array<{ label: string; color: string }> }) {
  return (
    <div className="mt-3 py-8 px-10 rounded-2xl bg-gray-50 max-h-[240px] overflow-hidden">
      <div className="grid grid-cols-3 gap-4">
        {options.map((option, index) => (
          <div
            key={index}
            className="aspect-square rounded-xl flex items-center justify-center text-white font-semibold text-lg shadow-sm"
            style={{
              background: `linear-gradient(135deg, ${option.color}, ${option.color}dd)`
            }}
          >
            {String.fromCharCode(65 + index)}
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-4">
        {options.map((option, index) => (
          <div key={index} className="text-center text-xs text-gray-600 font-medium">
            {option.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// 3. DecisionFork - SVG path splitting into two branches
export function DecisionFork({ optionA, optionB }: { optionA: string; optionB: string }) {
  const gradientId = useId();

  return (
    <div className="mt-3 py-12 px-10 rounded-2xl bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex-1 text-center">
          <div className="text-sm font-semibold text-blue-700 mb-2">{optionA}</div>
          <div className="h-1 w-20 mx-auto rounded-full bg-gradient-to-r from-blue-400 to-blue-600" />
        </div>

        <svg width="80" height="80" viewBox="0 0 80 80" className="flex-shrink-0">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>
          </defs>
          {/* Base path */}
          <path d="M10 40 L35 40" stroke={`url(#${gradientId})`} strokeWidth="2" fill="none" />
          {/* Fork */}
          <path d="M35 20 L70 20" stroke="#3b82f6" strokeWidth="2" fill="none" />
          <path d="M35 60 L70 60" stroke="#f59e0b" strokeWidth="2" fill="none" strokeDasharray="4 2" />
          {/* Diamond at fork */}
          <path d="M35 35 L40 40 L35 45 L30 40 Z" fill="#64748b" />
        </svg>

        <div className="flex-1 text-center">
          <div className="text-sm font-semibold text-amber-700 mb-2">{optionB}</div>
          <div className="h-1 w-20 mx-auto rounded-full bg-gradient-to-r from-amber-400 to-amber-600" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #fbbf24 0px, #fbbf24 4px, transparent 4px, transparent 8px)' }} />
        </div>
      </div>
    </div>
  );
}

// 4. FeedbackSteps - 4 progressive steps
export function FeedbackSteps({ steps }: { steps: Array<{ label: string; complete: boolean }> }) {
  return (
    <div className="mt-3 py-8 px-10 rounded-2xl bg-gray-50 max-h-[240px] overflow-hidden">
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
              step.complete ? 'bg-green-500' : 'bg-white border-2 border-gray-300'
            }`}>
              {step.complete && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
            </div>
            <div
              className={`h-2 rounded-full ${step.complete ? 'bg-green-500' : 'bg-white/60'}`}
              style={{ width: `${(index + 1) * 25}%` }}
            />
            <span className="text-xs text-gray-600 font-medium">{step.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// 5. SpeakerSlots - 5 circles (3 solid, 2 dashed)
export function SpeakerSlots({ confirmed, tentative, total }: { confirmed: number; tentative: number; total: number }) {
  return (
    <div className="mt-3 py-12 px-10 rounded-2xl bg-gray-50">
      <div className="flex items-center justify-center gap-4">
        {Array.from({ length: total }, (_, i) => {
          const isConfirmed = i < confirmed;
          const isTentative = i >= confirmed && i < confirmed + tentative;

          return (
            <div key={i} className="relative">
              <div
                className={`w-12 h-12 rounded-full ${
                  isConfirmed ? 'bg-blue-500' :
                  isTentative ? 'bg-white border-2 border-dashed border-amber-500' :
                  'bg-white border-2 border-gray-300'
                }`}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-4 text-center text-xs text-gray-600">
        <span className="font-semibold text-blue-600">{confirmed} confirmed</span>
        <span className="mx-2 text-gray-400">/</span>
        <span className="font-semibold text-amber-600">{tentative} tentative</span>
      </div>
    </div>
  );
}

// 6. VendorCompare - 4 horizontal bars of varying length
export function VendorCompare({ vendors }: { vendors: Array<{ name: string; score: number }> }) {
  const maxScore = Math.max(...vendors.map(v => v.score));
  const colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981'];

  return (
    <div className="mt-3 py-8 px-10 rounded-2xl bg-gray-50 max-h-[240px] overflow-hidden">
      <div className="space-y-3">
        {vendors.map((vendor, index) => (
          <div key={index} className="flex items-center gap-3">
            <span className="text-xs text-gray-600 font-medium w-24 text-right flex-shrink-0">
              {vendor.name}
            </span>
            <div className="flex-1">
              <div className="h-6 rounded-full bg-white/60 relative overflow-hidden">
                <div
                  className="absolute h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(vendor.score / maxScore) * 100}%`,
                    background: `linear-gradient(90deg, ${colors[index % colors.length]}, ${colors[index % colors.length]}dd)`
                  }}
                />
              </div>
            </div>
            <span className="text-xs text-gray-500 w-8 text-right">{vendor.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// 7. SurveyDimensions - 3 concentric colored rings
export function SurveyDimensions({ dimensions }: { dimensions: Array<{ label: string; color: string }> }) {
  return (
    <div className="mt-3 py-12 px-10 rounded-2xl bg-gray-50">
      <div className="relative w-32 h-32 mx-auto">
        {dimensions.map((dim, index) => {
          const size = 128 - (index * 24);
          const radius = size / 2;
          const strokeWidth = 12;
          const circumference = 2 * Math.PI * (radius - strokeWidth / 2);
          const dashArray = `${circumference * 0.75} ${circumference * 0.25}`;

          return (
            <svg
              key={index}
              className="absolute inset-0"
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              style={{
                left: `${index * 12}px`,
                top: `${index * 12}px`
              }}
            >
              <circle
                cx={radius}
                cy={radius}
                r={radius - strokeWidth / 2}
                fill="none"
                stroke={dim.color}
                strokeWidth={strokeWidth}
                strokeDasharray={dashArray}
                strokeLinecap="round"
                transform={`rotate(-90 ${radius} ${radius})`}
                opacity={0.8}
              />
            </svg>
          );
        })}
      </div>
      <div className="mt-6 flex justify-center gap-4">
        {dimensions.map((dim, index) => (
          <div key={index} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: dim.color }} />
            <span className="text-xs text-gray-600">{dim.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
