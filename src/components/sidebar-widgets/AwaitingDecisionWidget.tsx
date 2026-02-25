"use client";

export interface DecisionItem {
  avatarInitials: string;
  title: string;
  description: string;
  badge?: string;
  badgeColor?: "orange" | "red" | "blue";
}

interface AwaitingDecisionWidgetProps {
  title?: string;
  decisions: DecisionItem[];
  onSeeAll?: () => void;
}

const badgeStyles = {
  orange: "bg-[#ffeede] text-[#da792b]",
  red: "bg-[#ffe5e5] text-[#e5484d]",
  blue: "bg-[#e8ecfc] text-[#4262FF]",
};

export function AwaitingDecisionWidget({
  title = "Awaiting decision",
  decisions,
  onSeeAll,
}: AwaitingDecisionWidgetProps) {
  return (
    <div className="rounded-2xl px-3 py-6" style={{ backgroundColor: "var(--space-widget-bg)" }}>
      <p
        className="text-xl font-semibold text-[#656b81] leading-[1.4] mb-3"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {title}
      </p>
      <div className="flex flex-col gap-2 overflow-hidden">
        {decisions.map((item, i) => (
          <div
            key={i}
            className="flex gap-2 rounded-lg border border-[#e9eaef]/50 bg-[rgba(239,237,253,0.4)] p-2"
          >
            {/* Avatar */}
            <div className="shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e9eaef]">
                <span className="text-base font-semibold text-[#656b81]">
                  {item.avatarInitials}
                </span>
              </div>
            </div>
            {/* Content */}
            <div className="flex flex-col gap-2 min-w-0">
              <p className="text-sm text-[#222428] leading-[1.4] line-clamp-2">
                {item.title}
              </p>
              <p className="text-xs text-[#222428] leading-[1.5] truncate">
                {item.description}
              </p>
              {item.badge && (
                <div
                  className={`inline-flex w-fit items-center rounded px-2 py-1 text-xs ${badgeStyles[item.badgeColor ?? "orange"]}`}
                >
                  {item.badge}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {/* See all link */}
      {onSeeAll !== undefined && (
        <div className="mt-1 flex justify-end">
          <button
            onClick={onSeeAll}
            className="text-sm text-[#222428] underline hover:text-[#656b81]"
          >
            See all
          </button>
        </div>
      )}
    </div>
  );
}
