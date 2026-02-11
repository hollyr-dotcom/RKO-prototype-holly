"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/TopBar";
import { SpaceCard } from "@/components/SpaceCard";

type Space = {
  id: string;
  name: string;
  description: string;
  canvasCount: number;
  createdAt: string;
  updatedAt: string;
};

export default function HomePage() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/spaces")
      .then((res) => res.json())
      .then((data) => {
        setSpaces(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleCreateSpace = async () => {
    const name = prompt("Space name:");
    if (!name) return;

    const res = await fetch("/api/spaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: "" }),
    });

    if (res.ok) {
      const newSpace = await res.json();
      router.push(`/space/${newSpace.id}`);
    }
  };

  return (
    <>
      <TopBar
        title="Home"
        action={{ label: "New space", onClick: handleCreateSpace }}
      />
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
        ) : spaces.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-sm text-gray-500">No spaces yet</p>
            <button
              onClick={handleCreateSpace}
              className="mt-3 text-sm text-gray-900 underline hover:no-underline"
            >
              Create your first space
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {spaces.map((space) => (
              <SpaceCard
                key={space.id}
                id={space.id}
                name={space.name}
                description={space.description}
                canvasCount={space.canvasCount}
                updatedAt={space.updatedAt}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
