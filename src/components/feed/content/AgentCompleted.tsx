"use client";

import type { FeedItem } from "@/types/feed";
import { FeedArtifactPreview } from "../FeedArtifactPreview";
import { MatrixGrid, WorkstreamBars, ScheduleGrid, TravelMap } from "../visuals/CompletedVisuals";

type AgentCompletedItem = Extract<FeedItem, { type: "agent-completed" }>;

interface AgentCompletedProps {
  item: AgentCompletedItem;
}

export function AgentCompletedContent({ item }: AgentCompletedProps) {
  const { artifact, timeSpent, matrixGrid, workstreamBars, scheduleGrid, travelMap } = item.payload;

  return (
    <div className="px-6 pb-2">
      {/* Show artifact preview if present (document/board reference) */}
      {artifact && (
        <FeedArtifactPreview artifact={artifact} variant="hero" timeSpent={timeSpent} />
      )}

      {/* Only show bespoke visual if no artifact */}
      {!artifact && matrixGrid && <MatrixGrid rows={matrixGrid.rows} cols={matrixGrid.cols} label={matrixGrid.label} timeSpent={timeSpent} />}
      {!artifact && workstreamBars && <WorkstreamBars streams={workstreamBars.streams} blockers={workstreamBars.blockers} timeSpent={timeSpent} />}
      {!artifact && scheduleGrid && <ScheduleGrid sessions={scheduleGrid.sessions} tracks={scheduleGrid.tracks} timeSpent={timeSpent} />}
      {!artifact && travelMap && <TravelMap attendees={travelMap.attendees} hotels={travelMap.hotels} transfers={travelMap.transfers} timeSpent={timeSpent} />}
    </div>
  );
}
