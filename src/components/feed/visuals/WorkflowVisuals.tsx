"use client";

import { useId } from "react";

// 1. ReviewPipeline - 3 connected nodes showing workflow stages
export function ReviewPipeline({ stages }: { stages: Array<{ label: string; active: boolean }> }) {
  return (
    <div className="mt-3 py-8 px-10 rounded-2xl bg-gray-50 max-h-[240px] overflow-hidden">
      <div className="flex items-center justify-center gap-4">
        {stages.map((stage, index) => (
          <div key={index} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  stage.active
                    ? 'bg-blue-500 shadow-lg shadow-blue-500/50'
                    : 'bg-white border-2 border-gray-300'
                }`}
              >
                <span className={`text-xs font-semibold ${stage.active ? 'text-white' : 'text-gray-400'}`}>
                  {index + 1}
                </span>
              </div>
              <span className={`mt-2 text-xs font-medium ${stage.active ? 'text-blue-700' : 'text-gray-500'}`}>
                {stage.label}
              </span>
            </div>
            {index < stages.length - 1 && (
              <div className="w-16 h-0.5 bg-gray-300 mx-2" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// 2. ApprovalStamp - Different visuals based on icon type
export function ApprovalStamp({ icon }: { icon: "budget" | "strategy" | "identity" | "cfo" }) {
  const gradientId = useId();

  if (icon === "budget") {
    // Green checkmark circle + dollar sign badge
    return (
      <div className="mt-3 py-12 px-10 rounded-2xl bg-gray-50 max-h-[240px] overflow-hidden">
        <div className="relative w-24 h-24 mx-auto">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <path d="M12 24L20 32L36 16" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center shadow-lg text-white font-bold text-sm">
            $
          </div>
        </div>
      </div>
    );
  }

  if (icon === "strategy") {
    // Document icon + rotated green "Approved" stamp overlay
    return (
      <div className="mt-3 py-12 px-10 rounded-2xl bg-gray-50 max-h-[240px] overflow-hidden">
        <div className="relative w-32 h-32 mx-auto">
          {/* Document */}
          <div className="absolute inset-4 rounded-lg bg-white border-2 border-gray-300 shadow-sm">
            <div className="p-3 space-y-1.5">
              <div className="h-1.5 bg-gray-200 rounded w-full" />
              <div className="h-1.5 bg-gray-200 rounded w-3/4" />
              <div className="h-1.5 bg-gray-200 rounded w-5/6" />
            </div>
          </div>
          {/* Stamp overlay */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-12 rounded-md border-4 border-green-500 flex items-center justify-center rotate-12 bg-green-50/90"
          >
            <span className="text-xs font-bold text-green-700 uppercase tracking-wide">
              Approved
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (icon === "identity") {
    // 3 overlapping brand-color circles + green checkmark
    return (
      <div className="mt-3 py-12 px-10 rounded-2xl bg-gray-50 max-h-[240px] overflow-hidden">
        <div className="relative w-24 h-24 mx-auto">
          <div className="absolute top-0 left-4 w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 opacity-80" />
          <div className="absolute top-4 left-0 w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 opacity-80" />
          <div className="absolute top-4 left-8 w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 opacity-80" />
          <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8L6 11L13 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  if (icon === "cfo") {
    // Shield icon + checkmark + budget line bars
    return (
      <div className="mt-3 py-12 px-10 rounded-2xl bg-gray-50 max-h-[240px] overflow-hidden">
        <div className="flex items-center justify-center gap-8">
          {/* Shield with checkmark */}
          <div className="relative">
            <svg width="64" height="72" viewBox="0 0 64 72" fill="none">
              <defs>
                <linearGradient id={`${gradientId}-shield`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#1e40af" />
                </linearGradient>
              </defs>
              <path
                d="M32 4L8 16V32C8 48 32 64 32 64C32 64 56 48 56 32V16L32 4Z"
                fill={`url(#${gradientId}-shield)`}
                stroke="#1e40af"
                strokeWidth="2"
              />
              <path d="M20 32L28 40L44 24" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Budget bars */}
          <div className="space-y-2">
            {[0.9, 0.75, 0.85].map((width, index) => (
              <div key={index} className="h-2 rounded-full bg-white/60 w-16 relative overflow-hidden">
                <div
                  className="absolute h-full rounded-full bg-gradient-to-r from-green-400 to-green-600"
                  style={{ width: `${width * 100}%` }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// 3. ContractSigned - Document with signature line + seal/ribbon icon
export function ContractSigned({ documentType }: { documentType: string }) {
  const gradientId = useId();

  return (
    <div className="mt-3 py-12 px-10 rounded-2xl bg-gray-50 max-h-[240px] overflow-hidden">
      <div className="relative w-40 h-48 mx-auto">
        {/* Document */}
        <div className="absolute inset-0 rounded-lg bg-white border-2 border-gray-300 shadow-md p-4">
          {/* Document lines */}
          <div className="space-y-2 mb-8">
            <div className="h-1 bg-gray-200 rounded w-full" />
            <div className="h-1 bg-gray-200 rounded w-5/6" />
            <div className="h-1 bg-gray-200 rounded w-full" />
            <div className="h-1 bg-gray-200 rounded w-3/4" />
          </div>

          {/* Signature line */}
          <div className="mt-12">
            <svg width="100%" height="24" viewBox="0 0 120 24" className="mb-1">
              <defs>
                <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              <path
                d="M5 12 Q20 8, 35 12 T65 12 Q80 14, 95 10 T115 12"
                stroke={`url(#${gradientId})`}
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
            <div className="h-px bg-gray-300 w-full" />
          </div>
        </div>

        {/* Seal/ribbon */}
        <div className="absolute -bottom-4 -right-4 w-16 h-16">
          <div className="relative w-full h-full">
            {/* Ribbon */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg" />
            {/* Ribbon tails */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 flex gap-1">
              <div className="w-2 h-8 bg-gradient-to-b from-amber-500 to-amber-600 rounded-b" />
              <div className="w-2 h-8 bg-gradient-to-b from-amber-500 to-amber-600 rounded-b" />
            </div>
            {/* Checkmark */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M6 12L10 16L18 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
