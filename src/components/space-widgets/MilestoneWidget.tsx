"use client";

interface MilestoneWidgetProps {
  title: string;
  name: string;
  date: string;
}

export function MilestoneWidget({ title, name, date }: MilestoneWidgetProps) {
  return (
    <div className="rounded-[24px] p-[24px]" style={{ backgroundColor: "var(--space-widget-bg)" }}>
      <h3 className="text-[20px] font-semibold text-[var(--color-gray-800)] mb-3">{title}</h3>
      <div className="flex flex-col">
        <span className="text-[16px] font-semibold text-[var(--color-gray-800)] leading-[1.5]">
          {name}
        </span>
        <span className="text-[14px] text-[var(--color-gray-800)] leading-[1.4]">
          {date}
        </span>
      </div>
    </div>
  );
}
