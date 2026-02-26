"use client";

import { useRef } from "react";
import { TasksSection } from "@/components/tasks/TasksSection";
import { useOverscrollNavigation } from "@/hooks/useOverscrollNavigation";

export default function TasksPage() {
  const scrollRef = useRef<HTMLDivElement>(null);

  useOverscrollNavigation({
    scrollRef,
    direction: "up",
    targetPath: "/",
  });

  return (
    <div className="h-full w-full relative overflow-hidden">
      <div ref={scrollRef} className="h-full overflow-y-auto" style={{ paddingTop: 56 }}>
        <TasksSection scrollRef={scrollRef} />
      </div>
    </div>
  );
}
