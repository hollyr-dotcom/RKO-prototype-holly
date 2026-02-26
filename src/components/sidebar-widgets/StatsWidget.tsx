"use client";

export interface StatItem {
  label: string;
  value: string;
  change: string;
  changeColor?: "green" | "red" | "neutral";
  /** Optional secondary text shown after the change (e.g. "+92") */
  secondary?: string;
  /** Show an up or down arrow */
  arrow?: "up" | "down";
}

interface StatsWidgetProps {
  stats: [StatItem, StatItem];
}

const changeColors = {
  green: "text-[#0fa83c]",
  red: "text-[#e5484d]",
  neutral: "text-[#656b81]",
};

export function StatsWidget({ stats }: StatsWidgetProps) {
  return (
    <div className="flex gap-3">
      {stats.map((stat, i) => (
        <div
          key={i}
          className="flex flex-1 flex-col justify-between rounded-2xl px-4 pt-6 pb-4"
          style={{ backgroundColor: "var(--space-widget-bg)", minHeight: 143 }}
        >
          <p
            className="text-xl font-semibold text-[#656b81] leading-[1.4]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {stat.label}
          </p>
          <div className="flex flex-col gap-1">
            <p
              className="text-[40px] font-semibold text-[var(--color-gray-800)] leading-[1.4]"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {stat.value}
            </p>
            <div className="flex items-center gap-1">
              <span
                className={`text-base ${changeColors[stat.changeColor ?? "green"]}`}
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {stat.change}
              </span>
              {stat.secondary && (
                <span
                  className="text-base text-[#656b81]"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {stat.secondary}
                </span>
              )}
              {stat.arrow === "up" && (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  className="text-[#0fa83c]"
                >
                  <path
                    d="M6 2.5V9.5M6 2.5L2.5 6M6 2.5L9.5 6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
              {stat.arrow === "down" && (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  className="text-[#e5484d]"
                >
                  <path
                    d="M6 9.5V2.5M6 9.5L2.5 6M6 9.5L9.5 6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
