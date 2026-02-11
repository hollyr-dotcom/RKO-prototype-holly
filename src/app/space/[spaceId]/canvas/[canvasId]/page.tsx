"use client";

import { Canvas } from "@/components/Canvas";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function CanvasPage() {
  const params = useParams<{ spaceId: string; canvasId: string }>();

  return (
    <div className="relative h-full w-full">
      {/* Back button overlay */}
      <div className="absolute top-4 left-4 z-[500]">
        <Link
          href={`/space/${params.spaceId}`}
          className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-md border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to space
        </Link>
      </div>

      <Canvas />
    </div>
  );
}
