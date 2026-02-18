"use client";

import {
  IconBoard,
  IconDocFormat,
  IconTableFormat,
  IconFrame,
} from "@mirohq/design-system-icons";
import type { ArtifactPreview } from "@/types/feed";
import type { ComponentType } from "react";

interface FeedArtifactPreviewProps {
  artifact: ArtifactPreview;
  variant?: "full" | "compact" | "hero";
  timeSpent?: string;
}

// Placeholder SVG icons for new artifact types
function SlidesIcon({ size = 20, color = "#e67e22" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <rect x="2" y="3" width="16" height="11" rx="1.5" stroke={color} strokeWidth="1.5" />
      <rect x="4" y="5" width="6" height="3" rx="0.5" fill={color} opacity="0.3" />
      <line x1="4" y1="10" x2="14" y2="10" stroke={color} strokeWidth="1" opacity="0.4" />
      <line x1="4" y1="12" x2="10" y2="12" stroke={color} strokeWidth="1" opacity="0.4" />
      <line x1="7" y1="16" x2="13" y2="16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function KanbanIcon({ size = 20, color = "#2ecc71" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <rect x="2" y="3" width="4.5" height="14" rx="1" stroke={color} strokeWidth="1.2" />
      <rect x="7.75" y="3" width="4.5" height="10" rx="1" stroke={color} strokeWidth="1.2" />
      <rect x="13.5" y="3" width="4.5" height="7" rx="1" stroke={color} strokeWidth="1.2" />
      <rect x="3" y="5" width="2.5" height="1.5" rx="0.3" fill={color} opacity="0.4" />
      <rect x="3" y="8" width="2.5" height="1.5" rx="0.3" fill={color} opacity="0.4" />
      <rect x="8.75" y="5" width="2.5" height="1.5" rx="0.3" fill={color} opacity="0.4" />
    </svg>
  );
}

function TimelineIcon({ size = 20, color = "#9b59b6" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <line x1="3" y1="10" x2="17" y2="10" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="5" cy="10" r="2" fill={color} opacity="0.6" />
      <circle cx="10" cy="10" r="2" fill={color} opacity="0.8" />
      <circle cx="15" cy="10" r="2" fill={color} />
      <line x1="5" y1="6" x2="5" y2="8" stroke={color} strokeWidth="1" opacity="0.5" />
      <line x1="10" y1="12" x2="10" y2="14" stroke={color} strokeWidth="1" opacity="0.5" />
      <line x1="15" y1="6" x2="15" y2="8" stroke={color} strokeWidth="1" opacity="0.5" />
    </svg>
  );
}

function PrototypeIcon({ size = 20, color = "#3498db" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <rect x="4" y="2" width="12" height="16" rx="2" stroke={color} strokeWidth="1.5" />
      <rect x="6" y="5" width="8" height="5" rx="1" fill={color} opacity="0.2" />
      <rect x="6" y="12" width="3" height="2" rx="0.5" fill={color} opacity="0.3" />
      <rect x="11" y="12" width="3" height="2" rx="0.5" fill={color} opacity="0.3" />
      <circle cx="10" cy="16.5" r="0.8" fill={color} opacity="0.5" />
    </svg>
  );
}

function JourneyMapIcon({ size = 20, color = "#e74c3c" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M3 14 Q6 6, 10 10 Q14 14, 17 6" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <circle cx="3" cy="14" r="1.5" fill={color} opacity="0.5" />
      <circle cx="10" cy="10" r="1.5" fill={color} opacity="0.7" />
      <circle cx="17" cy="6" r="1.5" fill={color} />
    </svg>
  );
}

function DiagramIcon({ size = 20, color = "#1abc9c" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <rect x="2" y="2" width="5" height="4" rx="1" stroke={color} strokeWidth="1.2" />
      <rect x="13" y="2" width="5" height="4" rx="1" stroke={color} strokeWidth="1.2" />
      <rect x="7.5" y="14" width="5" height="4" rx="1" stroke={color} strokeWidth="1.2" />
      <line x1="4.5" y1="6" x2="10" y2="14" stroke={color} strokeWidth="1" opacity="0.5" />
      <line x1="15.5" y1="6" x2="10" y2="14" stroke={color} strokeWidth="1" opacity="0.5" />
    </svg>
  );
}

function FlowIcon({ size = 20, color = "#f39c12" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <rect x="1" y="8" width="4" height="4" rx="0.5" fill={color} opacity="0.5" />
      <rect x="8" y="8" width="4" height="4" rx="0.5" fill={color} opacity="0.7" />
      <rect x="15" y="8" width="4" height="4" rx="0.5" fill={color} />
      <path d="M5 10 L8 10" stroke={color} strokeWidth="1.2" markerEnd="url(#arrow)" />
      <path d="M12 10 L15 10" stroke={color} strokeWidth="1.2" />
      <polygon points="7.5,9 8,10 7.5,11" fill={color} opacity="0.7" />
      <polygon points="14.5,9 15,10 14.5,11" fill={color} />
    </svg>
  );
}

function ActivityIcon({ size = 20, color = "#8e44ad" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <rect x="3" y="4" width="10" height="2" rx="1" fill={color} opacity="0.8" />
      <rect x="3" y="8" width="7" height="2" rx="1" fill={color} opacity="0.6" />
      <rect x="3" y="12" width="12" height="2" rx="1" fill={color} opacity="0.4" />
      <rect x="3" y="16" width="5" height="2" rx="1" fill={color} opacity="0.3" />
    </svg>
  );
}

// Get icon component and colors based on artifact type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getArtifactIcon(type: ArtifactPreview["type"]): {
  Icon: any;
  SvgIcon: ComponentType<{ size?: number; color?: string }> | null;
  color: string;
  bgGradient: string;
} {
  switch (type) {
    case "canvas":
      return { Icon: IconBoard, SvgIcon: null, color: "#4262FF", bgGradient: "from-blue-50 via-indigo-50 to-purple-50" };
    case "document":
      return { Icon: IconDocFormat, SvgIcon: null, color: "#3b82f6", bgGradient: "from-blue-50 via-cyan-50 to-blue-50" };
    case "table":
      return { Icon: IconTableFormat, SvgIcon: null, color: "#10b981", bgGradient: "from-emerald-50 via-teal-50 to-green-50" };
    case "frame":
      return { Icon: IconFrame, SvgIcon: null, color: "#8b5cf6", bgGradient: "from-purple-50 via-violet-50 to-indigo-50" };
    case "slides":
      return { Icon: null, SvgIcon: SlidesIcon, color: "#e67e22", bgGradient: "from-orange-50 via-amber-50 to-yellow-50" };
    case "kanban":
      return { Icon: null, SvgIcon: KanbanIcon, color: "#2ecc71", bgGradient: "from-green-50 via-emerald-50 to-teal-50" };
    case "timeline":
      return { Icon: null, SvgIcon: TimelineIcon, color: "#9b59b6", bgGradient: "from-purple-50 via-fuchsia-50 to-pink-50" };
    case "prototype":
      return { Icon: null, SvgIcon: PrototypeIcon, color: "#3498db", bgGradient: "from-sky-50 via-blue-50 to-cyan-50" };
    case "journey-map":
      return { Icon: null, SvgIcon: JourneyMapIcon, color: "#e74c3c", bgGradient: "from-red-50 via-rose-50 to-pink-50" };
    case "diagram":
      return { Icon: null, SvgIcon: DiagramIcon, color: "#1abc9c", bgGradient: "from-teal-50 via-cyan-50 to-emerald-50" };
    case "flow":
      return { Icon: null, SvgIcon: FlowIcon, color: "#f39c12", bgGradient: "from-amber-50 via-yellow-50 to-orange-50" };
    case "activity":
      return { Icon: null, SvgIcon: ActivityIcon, color: "#8e44ad", bgGradient: "from-violet-50 via-purple-50 to-fuchsia-50" };
  }
}

function renderVisualPreview(type: ArtifactPreview["type"]) {
  switch (type) {
    case "canvas":
      return (
        <div className="absolute inset-0 p-6 flex flex-wrap gap-2 content-start">
          <div className="w-20 h-16 bg-blue-200/70 rounded-lg shadow-sm" />
          <div className="w-24 h-16 bg-purple-200/70 rounded-lg shadow-sm" />
          <div className="w-16 h-16 bg-yellow-200/70 rounded-lg shadow-sm" />
          <div className="w-28 h-20 bg-green-200/70 rounded-lg shadow-sm" />
          <div className="w-18 h-14 bg-pink-200/70 rounded-lg shadow-sm" />
        </div>
      );
    case "document":
      return (
        <div className="absolute inset-0 p-8 space-y-3">
          <div className="h-2 bg-white/60 rounded w-full" />
          <div className="h-2 bg-white/60 rounded w-11/12" />
          <div className="h-2 bg-white/60 rounded w-full" />
          <div className="h-2 bg-white/60 rounded w-10/12" />
          <div className="h-2 bg-white/60 rounded w-full" />
          <div className="h-2 bg-white/60 rounded w-9/12" />
        </div>
      );
    case "table":
      return (
        <div className="absolute inset-0 p-4">
          <div className="grid grid-cols-3 gap-2 h-full">
            {[...Array(12)].map((_, i) => (
              <div key={i} className={`rounded ${i < 3 ? "bg-white/80" : "bg-white/50"}`} />
            ))}
          </div>
        </div>
      );
    case "frame":
      return <div className="absolute inset-0 m-6 border-4 border-white/60 border-dashed rounded-lg" />;
    case "slides":
      return (
        <div className="absolute inset-0 p-6 flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex-1 bg-white/50 rounded-lg shadow-sm border border-white/40" style={{ transform: `translateX(${i * 4}px)` }} />
          ))}
        </div>
      );
    case "kanban":
      return (
        <div className="absolute inset-0 p-4 flex gap-2">
          {[0, 1, 2].map((col) => (
            <div key={col} className="flex-1 flex flex-col gap-2">
              <div className="h-3 bg-white/70 rounded" />
              {[...Array(3 - col)].map((_, i) => (
                <div key={i} className="flex-1 bg-white/40 rounded shadow-sm" />
              ))}
            </div>
          ))}
        </div>
      );
    case "timeline":
      return (
        <div className="absolute inset-0 flex items-center px-6">
          <div className="w-full relative">
            <div className="h-1 bg-white/60 rounded-full w-full" />
            {[15, 35, 55, 75].map((left, i) => (
              <div key={i} className="absolute w-3 h-3 bg-white/80 rounded-full shadow-sm" style={{ left: `${left}%`, top: '-4px' }} />
            ))}
          </div>
        </div>
      );
    case "prototype":
      return (
        <div className="absolute inset-0 p-6 flex items-center justify-center">
          <div className="w-16 h-28 border-2 border-white/60 rounded-xl relative">
            <div className="absolute inset-2 top-4 bg-white/40 rounded" />
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-white/50 rounded-full" />
          </div>
        </div>
      );
    case "journey-map":
      return (
        <div className="absolute inset-0 flex items-center px-4">
          <svg width="100%" height="60" viewBox="0 0 200 60" preserveAspectRatio="none">
            <path d="M10 40 Q50 10, 100 30 Q150 50, 190 20" stroke="white" strokeWidth="3" fill="none" opacity="0.5" strokeLinecap="round" />
            {[10, 55, 100, 145, 190].map((x, i) => (
              <circle key={i} cx={x} cy={i % 2 === 0 ? 40 : 20} r="4" fill="white" opacity="0.6" />
            ))}
          </svg>
        </div>
      );
    case "diagram":
      return (
        <div className="absolute inset-0 p-6 flex items-center justify-center">
          <svg width="100" height="80" viewBox="0 0 100 80">
            <rect x="10" y="5" width="25" height="18" rx="3" fill="white" opacity="0.5" />
            <rect x="65" y="5" width="25" height="18" rx="3" fill="white" opacity="0.5" />
            <rect x="37" y="55" width="25" height="18" rx="3" fill="white" opacity="0.5" />
            <line x1="35" y1="14" x2="65" y2="14" stroke="white" strokeWidth="1.5" opacity="0.4" />
            <line x1="22" y1="23" x2="50" y2="55" stroke="white" strokeWidth="1.5" opacity="0.4" />
            <line x1="78" y1="23" x2="50" y2="55" stroke="white" strokeWidth="1.5" opacity="0.4" />
          </svg>
        </div>
      );
    case "flow":
      return (
        <div className="absolute inset-0 p-4 flex items-center gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className="w-full h-8 bg-white/45 rounded shadow-sm" />
              {i < 3 && <div className="w-3 h-0.5 bg-white/50 flex-shrink-0" />}
            </div>
          ))}
        </div>
      );
    case "activity":
      return (
        <div className="absolute inset-0 p-6 space-y-3">
          {[80, 55, 90, 40, 70].map((w, i) => (
            <div key={i} className="h-3 bg-white/50 rounded" style={{ width: `${w}%` }} />
          ))}
        </div>
      );
  }
}

export function FeedArtifactPreview({
  artifact,
  variant = "full",
}: FeedArtifactPreviewProps) {
  const { Icon, SvgIcon, color, bgGradient } = getArtifactIcon(artifact.type);

  const renderIcon = (iconSize: number, containerSize: string, containerRounding: string) => (
    <div className={`${containerSize} ${containerRounding} bg-gray-100 flex items-center justify-center`}>
      {Icon ? (
        <Icon css={{ width: iconSize, height: iconSize, color }} />
      ) : SvgIcon ? (
        <SvgIcon size={iconSize} color={color} />
      ) : null}
    </div>
  );

  if (variant === "compact") {
    return (
      <div className="mt-3 rounded-2xl overflow-hidden border border-gray-200 bg-white hover:shadow-md transition-shadow duration-200">
        <div className="flex items-stretch h-[200px]">
          <div className="flex-shrink-0 w-64 p-6 flex flex-col bg-white">
            <div className="mb-4">{renderIcon(20, "w-10 h-10", "rounded-lg")}</div>
            <h4 className="text-base font-semibold text-gray-900 leading-snug">{artifact.name}</h4>
          </div>
          <div className={`flex-1 bg-gradient-to-br ${bgGradient} relative overflow-hidden`}>
            {renderVisualPreview(artifact.type)}
          </div>
        </div>
      </div>
    );
  }

  if (variant === "hero") {
    return (
      <div className="mt-3 rounded-2xl overflow-hidden border border-gray-200 bg-white hover:shadow-md transition-shadow duration-200">
        <div className="flex items-stretch h-[200px]">
          <div className="flex-shrink-0 w-72 p-8 flex flex-col bg-white">
            <div className="mb-6">{renderIcon(24, "w-12 h-12", "rounded-xl")}</div>
            <h4 className="text-base font-semibold text-gray-900 leading-snug">{artifact.name}</h4>
          </div>
          <div className={`flex-1 bg-gradient-to-br ${bgGradient} relative overflow-hidden`}>
            {renderVisualPreview(artifact.type)}
          </div>
        </div>
      </div>
    );
  }

  // Default "full" variant
  return (
    <div className="mt-3 rounded-2xl overflow-hidden border border-gray-200 bg-white hover:shadow-md transition-shadow duration-200">
      <div className="flex items-stretch h-[200px]">
        <div className="flex-shrink-0 w-64 p-6 flex flex-col bg-white">
          <div className="mb-4">{renderIcon(20, "w-10 h-10", "rounded-lg")}</div>
          <h4 className="text-base font-semibold text-gray-900 mb-4 leading-snug flex-1">{artifact.name}</h4>
          <div>
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{artifact.type}</span>
          </div>
        </div>
        <div className={`flex-1 bg-gradient-to-br ${bgGradient} relative overflow-hidden`}>
          {renderVisualPreview(artifact.type)}
        </div>
      </div>
    </div>
  );
}
