"use client";

export interface GoalItem {
  title: string;
  type: "objective" | "key-result";
  progress: number;
}

interface GoalsWidgetProps {
  goals: GoalItem[];
}

const typeConfig = {
  objective: { label: "Objective", icon: "◎" },
  "key-result": { label: "Key Result", icon: "◇" },
};

/** Progress fill color: orange < 40%, yellow 40-65%, green > 65% */
function progressColor(value: number): string {
  if (value < 40) return "#f8d3af";
  if (value <= 65) return "#fff6b6";
  return "#adf0c7";
}

export function GoalsWidget({ goals }: GoalsWidgetProps) {
  return (
    <div className="flex flex-col gap-2.5 rounded-xl py-3" style={{ backgroundColor: "var(--space-widget-bg)" }}>
      {goals.map((goal, i) => (
        <div
          key={i}
          className="rounded-lg px-4 pt-2.5 pb-4"
        >
          <p
            className="truncate text-sm font-bold text-[var(--color-gray-800)] leading-[1.4]"
            title={goal.title}
          >
            {goal.title}
          </p>
          <div className="mt-1 flex items-center gap-2 pr-1">
            {/* Tag with progress fill */}
            <div className="relative flex h-6 items-center gap-1 rounded-full bg-[#f2f4fc] px-1.5 py-0.5 overflow-hidden flex-1 min-w-0">
              {/* Progress fill */}
              <div
                className="absolute inset-y-0 left-0 rounded-l-full mix-blend-multiply"
                style={{
                  width: `${goal.progress}%`,
                  backgroundColor: progressColor(goal.progress),
                }}
              />
              <span className="relative text-xs text-[#656b81] shrink-0">
                {typeConfig[goal.type].icon}
              </span>
              <span className="relative text-xs text-[var(--color-gray-800)] truncate">
                {typeConfig[goal.type].label}
              </span>
            </div>
            {/* Percentage */}
            <span className="text-sm text-[#1a1b1e] tabular-nums shrink-0">
              {goal.progress}%
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
