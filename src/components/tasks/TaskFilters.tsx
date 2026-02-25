"use client";

import type { TaskPriority } from "@/types/task";

type StatusFilter = "active" | "completed" | null;
type SortOption = "due_date" | "priority" | "created_at";

interface TaskFiltersProps {
  activeSpace: string | null;
  activePriority: TaskPriority | null;
  activeStatus: StatusFilter;
  sort: SortOption;
  spaces: { id: string; name: string }[];
  onSpaceChange: (spaceId: string | null) => void;
  onPriorityChange: (priority: TaskPriority | null) => void;
  onStatusChange: (status: StatusFilter) => void;
  onSortChange: (sort: SortOption) => void;
}

function FilterChip({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-2.5 py-1 rounded-full border transition-colors duration-200 ${
        isActive
          ? "bg-blue-50 border-blue-500 text-blue-500"
          : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
      }`}
    >
      {label}
    </button>
  );
}

export function TaskFilters({
  activeSpace,
  activePriority,
  activeStatus,
  sort,
  spaces,
  onSpaceChange,
  onPriorityChange,
  onStatusChange,
  onSortChange,
}: TaskFiltersProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Space filters */}
      <FilterChip
        label="All spaces"
        isActive={activeSpace === null}
        onClick={() => onSpaceChange(null)}
      />
      {spaces.map((space) => (
        <FilterChip
          key={space.id}
          label={space.name}
          isActive={activeSpace === space.id}
          onClick={() =>
            onSpaceChange(activeSpace === space.id ? null : space.id)
          }
        />
      ))}

      {/* Divider */}
      <div className="w-px h-4 bg-gray-200" />

      {/* Priority filters */}
      {(["high", "medium", "low"] as TaskPriority[]).map((priority) => (
        <FilterChip
          key={priority}
          label={priority.charAt(0).toUpperCase() + priority.slice(1)}
          isActive={activePriority === priority}
          onClick={() =>
            onPriorityChange(activePriority === priority ? null : priority)
          }
        />
      ))}

      {/* Divider */}
      <div className="w-px h-4 bg-gray-200" />

      {/* Status */}
      <FilterChip
        label="Active"
        isActive={activeStatus === "active"}
        onClick={() =>
          onStatusChange(activeStatus === "active" ? null : "active")
        }
      />
      <FilterChip
        label="Completed"
        isActive={activeStatus === "completed"}
        onClick={() =>
          onStatusChange(activeStatus === "completed" ? null : "completed")
        }
      />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Sort dropdown */}
      <select
        value={sort}
        onChange={(e) => onSortChange(e.target.value as SortOption)}
        className="text-xs px-2.5 py-1 rounded-full border border-gray-200 text-gray-500 bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
      >
        <option value="due_date">Sort: Due date</option>
        <option value="priority">Sort: Priority</option>
        <option value="created_at">Sort: Created</option>
      </select>
    </div>
  );
}
