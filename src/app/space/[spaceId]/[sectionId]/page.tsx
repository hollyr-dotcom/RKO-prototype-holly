"use client";

import { useParams } from "next/navigation";
import { SpaceSubPageView } from "@/components/feed/SpaceSubPageView";

export default function SpaceSectionPage() {
  const params = useParams<{ spaceId: string; sectionId: string }>();

  return (
    <div className="flex-1 overflow-y-auto">
      <SpaceSubPageView spaceId={params.spaceId} sectionId={params.sectionId} />
    </div>
  );
}
