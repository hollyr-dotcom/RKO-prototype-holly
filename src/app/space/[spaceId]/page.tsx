"use client";

import { useParams } from "next/navigation";
import { SpaceFeed } from "@/components/feed/SpaceFeed";

export default function SpacePage() {
  const params = useParams<{ spaceId: string }>();

  return (
    <div className="flex-1 overflow-y-auto">
      <SpaceFeed spaceId={params.spaceId} />
    </div>
  );
}
