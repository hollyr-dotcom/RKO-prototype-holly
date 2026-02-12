"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Canvas } from "@/components/Canvas";
import { RoomProvider } from "@/liveblocks.config";
import { LiveMap } from "@liveblocks/client";

export default function CanvasPage() {
  const params = useParams<{ spaceId: string; canvasId: string }>();
  const roomId = `canvas-${params.canvasId}`;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading canvas...</p>
        </div>
      </div>
    );
  }

  return (
    <RoomProvider
      id={roomId}
      initialPresence={{ presence: null }}
      initialStorage={{ records: new LiveMap() }}
    >
      <Canvas />
    </RoomProvider>
  );
}
