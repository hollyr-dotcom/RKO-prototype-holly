"use client";

import {
  IconBoard,
  IconDocFormat,
  IconTableFormat,
  IconFrame,
} from "@mirohq/design-system-icons";
import type { ArtifactPreview } from "@/types/feed";

interface FeedArtifactPreviewProps {
  artifact: ArtifactPreview;
  variant?: "full" | "compact" | "hero";
  timeSpent?: string;
}

// Get icon component and colors based on artifact type
function getArtifactIcon(type: ArtifactPreview["type"]) {
  switch (type) {
    case "canvas":
      return { Icon: IconBoard, color: "#4262FF", bgGradient: "from-blue-50 via-indigo-50 to-purple-50" };
    case "document":
      return { Icon: IconDocFormat, color: "#3b82f6", bgGradient: "from-blue-50 via-cyan-50 to-blue-50" };
    case "table":
      return { Icon: IconTableFormat, color: "#10b981", bgGradient: "from-emerald-50 via-teal-50 to-green-50" };
    case "frame":
      return { Icon: IconFrame, color: "#8b5cf6", bgGradient: "from-purple-50 via-violet-50 to-indigo-50" };
  }
}

export function FeedArtifactPreview({
  artifact,
  variant = "full",
  timeSpent,
}: FeedArtifactPreviewProps) {
  const { Icon, color, bgGradient } = getArtifactIcon(artifact.type);

  if (variant === "compact") {
    return (
      <div className="mt-3 rounded-2xl overflow-hidden border border-gray-200 bg-white hover:shadow-md transition-shadow duration-200">
        <div className="flex items-stretch h-[200px]">
          {/* Left side: Icon and title */}
          <div className="flex-shrink-0 w-64 p-6 flex flex-col bg-white">
            {/* Icon */}
            <div className="mb-4">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <Icon css={{ width: 20, height: 20, color }} />
              </div>
            </div>

            {/* Title */}
            <h4 className="text-base font-semibold text-gray-900 leading-snug">
              {artifact.name}
            </h4>
          </div>

          {/* Right side: Visual preview extending to edge */}
          <div className={`flex-1 bg-gradient-to-br ${bgGradient} relative overflow-hidden`}>
            {artifact.type === "canvas" && (
              <div className="absolute inset-0 p-6 flex flex-wrap gap-2 content-start">
                <div className="w-20 h-16 bg-blue-200/70 rounded-lg shadow-sm" />
                <div className="w-24 h-16 bg-purple-200/70 rounded-lg shadow-sm" />
                <div className="w-16 h-16 bg-yellow-200/70 rounded-lg shadow-sm" />
                <div className="w-28 h-20 bg-green-200/70 rounded-lg shadow-sm" />
                <div className="w-18 h-14 bg-pink-200/70 rounded-lg shadow-sm" />
              </div>
            )}
            {artifact.type === "document" && (
              <div className="absolute inset-0 p-8 space-y-3">
                <div className="h-2 bg-white/60 rounded w-full" />
                <div className="h-2 bg-white/60 rounded w-11/12" />
                <div className="h-2 bg-white/60 rounded w-full" />
                <div className="h-2 bg-white/60 rounded w-10/12" />
                <div className="h-2 bg-white/60 rounded w-full" />
                <div className="h-2 bg-white/60 rounded w-9/12" />
                <div className="h-2 bg-white/60 rounded w-full" />
              </div>
            )}
            {artifact.type === "table" && (
              <div className="absolute inset-0 p-4">
                <div className="grid grid-cols-3 gap-2 h-full">
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      className={`rounded ${
                        i < 3 ? "bg-white/80" : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
            {artifact.type === "frame" && (
              <div className="absolute inset-0 m-6 border-4 border-white/60 border-dashed rounded-lg" />
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === "hero") {
    return (
      <div className="mt-3 rounded-2xl overflow-hidden border border-gray-200 bg-white hover:shadow-md transition-shadow duration-200">
        <div className="flex items-stretch h-[200px]">
          {/* Left side: Icon and title */}
          <div className="flex-shrink-0 w-72 p-8 flex flex-col bg-white">
            {/* Icon */}
            <div className="mb-6">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                <Icon css={{ width: 24, height: 24, color }} />
              </div>
            </div>

            {/* Title */}
            <h4 className="text-base font-semibold text-gray-900 leading-snug">
              {artifact.name}
            </h4>
          </div>

          {/* Right side: Visual preview extending to edge */}
          <div className={`flex-1 bg-gradient-to-br ${bgGradient} relative overflow-hidden`}>
            {artifact.type === "canvas" && (
              <div className="absolute inset-0 p-8 flex flex-wrap gap-3 content-start">
                <div className="w-24 h-20 bg-blue-200/70 rounded-xl shadow-sm" />
                <div className="w-28 h-20 bg-purple-200/70 rounded-xl shadow-sm" />
                <div className="w-20 h-20 bg-yellow-200/70 rounded-xl shadow-sm" />
                <div className="w-32 h-24 bg-green-200/70 rounded-xl shadow-sm" />
                <div className="w-22 h-18 bg-pink-200/70 rounded-xl shadow-sm" />
                <div className="w-26 h-20 bg-cyan-200/70 rounded-xl shadow-sm" />
              </div>
            )}
            {artifact.type === "document" && (
              <div className="absolute inset-0 p-12 space-y-4">
                <div className="h-3 bg-white/60 rounded w-full" />
                <div className="h-3 bg-white/60 rounded w-11/12" />
                <div className="h-3 bg-white/60 rounded w-full" />
                <div className="h-3 bg-white/60 rounded w-10/12" />
                <div className="h-3 bg-white/60 rounded w-full" />
                <div className="h-3 bg-white/60 rounded w-9/12" />
                <div className="h-3 bg-white/60 rounded w-full" />
                <div className="h-3 bg-white/60 rounded w-11/12" />
              </div>
            )}
            {artifact.type === "table" && (
              <div className="absolute inset-0 p-6">
                <div className="grid grid-cols-4 gap-2 h-full">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className={`rounded ${
                        i < 4 ? "bg-white/80" : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
            {artifact.type === "frame" && (
              <div className="absolute inset-0 m-8 border-4 border-white/60 border-dashed rounded-xl" />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default "full" variant
  return (
    <div className="mt-3 rounded-2xl overflow-hidden border border-gray-200 bg-white hover:shadow-md transition-shadow duration-200">
      <div className="flex items-stretch h-[200px]">
        {/* Left side: Icon, title, and type */}
        <div className="flex-shrink-0 w-64 p-6 flex flex-col bg-white">
          {/* Icon */}
          <div className="mb-4">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <Icon css={{ width: 20, height: 20, color }} />
            </div>
          </div>

          {/* Title */}
          <h4 className="text-base font-semibold text-gray-900 mb-4 leading-snug flex-1">
            {artifact.name}
          </h4>

          {/* Type label */}
          <div>
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              {artifact.type}
            </span>
          </div>
        </div>

        {/* Right side: Visual preview extending to edge */}
        <div className={`flex-1 bg-gradient-to-br ${bgGradient} relative overflow-hidden`}>
          {artifact.type === "canvas" && (
            <div className="absolute inset-0 p-6 flex flex-wrap gap-2 content-start">
              <div className="w-20 h-16 bg-blue-200/70 rounded-lg shadow-sm" />
              <div className="w-24 h-16 bg-purple-200/70 rounded-lg shadow-sm" />
              <div className="w-16 h-16 bg-yellow-200/70 rounded-lg shadow-sm" />
              <div className="w-28 h-20 bg-green-200/70 rounded-lg shadow-sm" />
              <div className="w-18 h-14 bg-pink-200/70 rounded-lg shadow-sm" />
            </div>
          )}
          {artifact.type === "document" && (
            <div className="absolute inset-0 p-8 space-y-3">
              <div className="h-2 bg-white/60 rounded w-full" />
              <div className="h-2 bg-white/60 rounded w-11/12" />
              <div className="h-2 bg-white/60 rounded w-full" />
              <div className="h-2 bg-white/60 rounded w-10/12" />
              <div className="h-2 bg-white/60 rounded w-full" />
              <div className="h-2 bg-white/60 rounded w-9/12" />
            </div>
          )}
          {artifact.type === "table" && (
            <div className="absolute inset-0 p-4">
              <div className="grid grid-cols-3 gap-2 h-full">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className={`rounded ${
                      i < 3 ? "bg-white/80" : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
          {artifact.type === "frame" && (
            <div className="absolute inset-0 m-6 border-4 border-white/60 border-dashed rounded-lg" />
          )}
        </div>
      </div>
    </div>
  );
}
