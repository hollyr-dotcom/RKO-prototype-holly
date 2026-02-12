"use client";

import { Canvas } from "@/components/Canvas";
import { useParams } from "next/navigation";
import { RoomProvider } from "@/liveblocks.config";
import { LiveMap } from "@liveblocks/client";
import { Suspense } from "react";

function CanvasLoading() {
  return (
    <div className="h-full w-full flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Connecting to canvas...</p>
      </div>
    </div>
  );
}

export default function CanvasPage() {
  const params = useParams<{ spaceId: string; canvasId: string }>();
  const roomId = `canvas-${params.canvasId}`;

  return (
    <RoomProvider
      id={roomId}
      initialPresence={{ presence: null }}
      initialStorage={{ records: new LiveMap() }}
    >
      <Suspense fallback={<CanvasLoading />}>
        <div className="relative h-full w-full">
          <Canvas />
        </div>
      </Suspense>
    </RoomProvider>
  );
}
