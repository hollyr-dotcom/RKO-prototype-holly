"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { TopBar } from "@/components/TopBar";
import { CanvasCard } from "@/components/CanvasCard";
import Link from "next/link";

type SpaceWithCanvases = {
  id: string;
  name: string;
  description: string;
  canvases: Array<{
    id: string;
    spaceId: string;
    name: string;
    createdAt: string;
    updatedAt: string;
  }>;
};

export default function SpacePage() {
  const params = useParams<{ spaceId: string }>();
  const router = useRouter();
  const [space, setSpace] = useState<SpaceWithCanvases | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/spaces/${params.spaceId}`)
      .then((res) => res.json())
      .then((data) => {
        setSpace(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.spaceId]);

  const handleCreateCanvas = async () => {
    const name = prompt("Canvas name:");
    if (!name) return;

    const res = await fetch("/api/canvases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, spaceId: params.spaceId }),
    });

    if (res.ok) {
      const newCanvas = await res.json();
      router.push(`/space/${params.spaceId}/canvas/${newCanvas.id}`);
    }
  };

  return (
    <>
      <TopBar
        title={space?.name || "Space"}
        action={{ label: "New canvas", onClick: handleCreateCanvas }}
      />

      {/* Breadcrumb */}
      <div className="px-6 py-3 border-b border-gray-200 bg-white">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-900 transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">
            {space?.name || "..."}
          </span>
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-56 rounded-xl bg-gray-100 animate-pulse"
              />
            ))}
          </div>
        ) : !space ? (
          <div className="text-center py-20">
            <p className="text-sm text-gray-500">Space not found</p>
          </div>
        ) : space.canvases.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-sm text-gray-500">No canvases yet</p>
            <button
              onClick={handleCreateCanvas}
              className="mt-3 text-sm text-gray-900 underline hover:no-underline"
            >
              Create your first canvas
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {space.canvases.map((canvas) => (
              <CanvasCard
                key={canvas.id}
                id={canvas.id}
                spaceId={params.spaceId}
                name={canvas.name}
                updatedAt={canvas.updatedAt}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
