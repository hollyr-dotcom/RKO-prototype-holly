"use client";

import type { FeedItem } from "@/types/feed";
import { FeedCard } from "./FeedCard";

interface StackFeedCardProps {
  item: FeedItem;
}

/**
 * Wraps FeedCard for the card stack context.
 * Constrains width/height and applies elevated shadow.
 * Does not modify FeedCard itself.
 */
export function StackFeedCard({ item }: StackFeedCardProps) {
  return (
    <div
      className="w-full max-w-[520px] h-[560px] overflow-y-auto rounded-[32px] shadow-elevated"
    >
      <FeedCard item={item} spaceName={item.spaceName} variant="stack" />
    </div>
  );
}
