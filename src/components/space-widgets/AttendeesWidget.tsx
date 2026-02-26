"use client";

interface StatColumn {
  value: number;
  label: string;
  highlight?: boolean;
}

interface AttendeesWidgetProps {
  title: string;
  stats: StatColumn[];
}

export function AttendeesWidget({ title, stats }: AttendeesWidgetProps) {
  return (
    <div className="rounded-[24px] p-[24px]" style={{ backgroundColor: "var(--space-100)" }}>
      <h3 className="text-[20px] font-semibold text-[var(--color-gray-800)] mb-5">{title}</h3>
      <div className="flex gap-[24px]">
        {stats.map((stat, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <span
              className="text-[32px] font-bold leading-none"
              style={{ color: stat.highlight ? "var(--space-accent)" : "var(--space-secondary)" }}
            >
              {stat.value}
            </span>
            <span className="text-[12px] text-[var(--color-gray-800)]">{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
