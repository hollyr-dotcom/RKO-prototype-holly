"use client";

interface GenericVisualPreviewProps {
  type: string;
  data: Record<string, unknown>;
}

function getTitle(data: Record<string, unknown>): string | null {
  if (typeof data.title === "string") return data.title;
  return null;
}

function LineChartShape() {
  return (
    <svg width="100%" height="80" viewBox="0 0 240 80" preserveAspectRatio="xMidYMid meet">
      <path d="M20 60 L60 45 L100 50 L140 30 L180 35 L220 15" stroke="#9ca3af" strokeWidth="2" fill="none" strokeLinecap="round" />
      <line x1="20" y1="70" x2="220" y2="70" stroke="#d1d5db" strokeWidth="1" />
      {[20, 60, 100, 140, 180, 220].map((x, i) => (
        <circle key={i} cx={x} cy={[60, 45, 50, 30, 35, 15][i]} r="3" fill="#9ca3af" />
      ))}
    </svg>
  );
}

function BarChartShape() {
  return (
    <svg width="100%" height="80" viewBox="0 0 240 80" preserveAspectRatio="xMidYMid meet">
      {[
        { x: 25, h: 40 },
        { x: 65, h: 55 },
        { x: 105, h: 35 },
        { x: 145, h: 65 },
        { x: 185, h: 48 },
      ].map((bar, i) => (
        <rect key={i} x={bar.x} y={75 - bar.h} width="30" height={bar.h} rx="3" fill="#d1d5db" />
      ))}
      <line x1="15" y1="75" x2="225" y2="75" stroke="#e5e7eb" strokeWidth="1" />
    </svg>
  );
}

function DonutChartShape() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80">
      <circle cx="40" cy="40" r="28" stroke="#e5e7eb" strokeWidth="10" fill="none" />
      <circle cx="40" cy="40" r="28" stroke="#d1d5db" strokeWidth="10" fill="none"
        strokeDasharray="44 132" strokeDashoffset="0" />
      <circle cx="40" cy="40" r="28" stroke="#c4c8cc" strokeWidth="10" fill="none"
        strokeDasharray="35 141" strokeDashoffset="-44" />
      <circle cx="40" cy="40" r="28" stroke="#b0b5bb" strokeWidth="10" fill="none"
        strokeDasharray="26 150" strokeDashoffset="-79" />
    </svg>
  );
}

function MetricsShape() {
  return (
    <div className="flex gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex-1 rounded-lg bg-gray-200/60 p-3 text-center">
          <div className="h-6 w-12 mx-auto bg-gray-300/80 rounded mb-1" />
          <div className="h-2 w-16 mx-auto bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );
}

function ProgressBarsShape() {
  return (
    <div className="space-y-3">
      {[75, 50, 90, 35].map((w, i) => (
        <div key={i}>
          <div className="h-2 w-16 bg-gray-200 rounded mb-1" />
          <div className="h-3 bg-gray-200/60 rounded-full overflow-hidden">
            <div className="h-full bg-gray-300/80 rounded-full" style={{ width: `${w}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function CountdownShape() {
  return (
    <div className="flex items-center justify-center gap-2">
      {["D", "H", "M"].map((label, i) => (
        <div key={i} className="text-center">
          <div className="w-14 h-14 rounded-lg bg-gray-200/80 flex items-center justify-center">
            <span className="text-xl font-bold text-gray-400">--</span>
          </div>
          <span className="text-xs text-gray-400 mt-1">{label}</span>
        </div>
      ))}
    </div>
  );
}

function ApprovalShape() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gray-200/80" />
          <div className="flex-1 h-2 bg-gray-200/60 rounded" />
          <div className="w-14 h-5 rounded-full bg-gray-200/80" />
        </div>
      ))}
    </div>
  );
}

function SlidesDeckShape() {
  return (
    <div className="flex flex-col gap-1.5">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-10 bg-gray-200/60 rounded-lg border border-gray-200/40"
          style={{ marginLeft: `${i * 6}px`, opacity: 1 - i * 0.2 }} />
      ))}
    </div>
  );
}

/* ---------- Timeline helpers ---------- */

interface TimelineBarData {
  start: string;
  end: string;
  label: string;
}

interface TimelineTrackData {
  label: string;
  color: string;
  bars: TimelineBarData[];
}

interface TimelineData {
  startDate: string;
  endDate: string;
  today?: string;
  tracks: TimelineTrackData[];
}

function toLocalDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function diffDays(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/** Map track colors to FormatPreview-style pastel palettes (light bg, colored border, dark text) */
function getBarPalette(hex: string): { bg: string; border: string; text: string } {
  const key = hex.toLowerCase();
  const known: Record<string, { bg: string; border: string; text: string }> = {
    "#4262ff": { bg: "#DBEAFE", border: "#4262FF", text: "#1E40AF" },
    "#3b82f6": { bg: "#DBEAFE", border: "#3B82F6", text: "#1E40AF" },
    "#10b981": { bg: "#BBF7D0", border: "#22C55E", text: "#166534" },
    "#8b5cf6": { bg: "#EDE9FE", border: "#8b5cf6", text: "#4C1D95" },
    "#6366f1": { bg: "#E0E7FF", border: "#6366f1", text: "#3730A3" },
    "#f59e0b": { bg: "#FEF9C3", border: "#FACC15", text: "#854D0E" },
    "#ef4444": { bg: "#FEE2E2", border: "#F87171", text: "#991B1B" },
  };
  if (known[key]) return known[key];
  // Fallback: generate pastel palette from any hex
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const mix = 0.15;
  return {
    bg: `rgb(${Math.round(r * mix + 255 * (1 - mix))},${Math.round(g * mix + 255 * (1 - mix))},${Math.round(b * mix + 255 * (1 - mix))})`,
    border: hex,
    text: `rgb(${Math.round(r * 0.35)},${Math.round(g * 0.35)},${Math.round(b * 0.35)})`,
  };
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function TimelineShape({ data }: { data: Record<string, unknown> }) {
  const td = data as unknown as TimelineData;

  // Fallback: if data doesn't have the expected shape, render a static placeholder
  if (!td.startDate || !td.endDate || !td.tracks?.length) {
    return (
      <div className="flex items-center">
        <div className="flex-1 relative h-16">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-300/80" />
          {[10, 30, 55, 80].map((left, i) => (
            <div key={i} className="absolute" style={{ left: `${left}%`, top: "50%", transform: "translate(-50%, -50%)" }}>
              <div className="w-3 h-3 rounded-full bg-gray-300" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const rangeStart = toLocalDate(td.startDate);
  const rangeEnd = toLocalDate(td.endDate);
  const totalDays = diffDays(rangeStart, rangeEnd) + 1; // inclusive end
  if (totalDays <= 0) return null;

  const pct = (date: Date) => (diffDays(rangeStart, date) / totalDays) * 100;

  // --- Month labels ---
  const months: { label: string; pos: number }[] = [];
  months.push({ label: MONTH_NAMES[rangeStart.getMonth()], pos: 0 });
  let cursor = new Date(rangeStart.getFullYear(), rangeStart.getMonth() + 1, 1);
  while (cursor <= rangeEnd) {
    months.push({ label: MONTH_NAMES[cursor.getMonth()], pos: pct(cursor) });
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }
  // Thin out if many months
  const displayMonths =
    months.length > 7
      ? months.filter((_, i) => i === 0 || i === months.length - 1 || i % 2 === 0)
      : months;

  // --- Today marker ---
  const todayDate = td.today ? toLocalDate(td.today) : null;
  const todayPos = todayDate ? pct(todayDate) : null;
  const showToday = todayPos !== null && todayPos >= 0 && todayPos <= 100;

  const showMonths = displayMonths.length > 1;

  return (
    <div>
      {/* Month labels — hide when range fits a single month */}
      {showMonths && (
        <div className="relative h-4 mb-2">
          {displayMonths.map((m, i) => (
            <span
              key={i}
              className="absolute text-gray-400"
              style={{
                left: `${m.pos}%`,
                fontSize: "11px",
                fontWeight: 500,
                lineHeight: 1,
                transform: i > 0 ? "translateX(-50%)" : undefined,
              }}
            >
              {m.label}
            </span>
          ))}
        </div>
      )}

      {/* Tracks + today line */}
      <div className="relative" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {showToday && (
          <div
            className="absolute top-0 bottom-0 pointer-events-none"
            style={{ left: `${todayPos}%`, width: "1px", backgroundColor: "rgba(0,0,0,0.12)", zIndex: 1 }}
          />
        )}

        {td.tracks.map((track, ti) => {
          const palette = getBarPalette(track.color);
          return (
            <div key={ti} className="relative" style={{ height: "28px" }}>
              {track.bars.map((bar, bi) => {
                const bStart = toLocalDate(bar.start);
                const bEnd = toLocalDate(bar.end);
                const left = pct(bStart);
                const width = Math.max(((diffDays(bStart, bEnd) + 1) / totalDays) * 100, 3);

                return (
                  <div
                    key={bi}
                    className="absolute top-0 h-full overflow-hidden"
                    style={{
                      left: `${left}%`,
                      width: `${width}%`,
                      backgroundColor: palette.bg,
                      border: `1px solid ${palette.border}`,
                      borderRadius: "4px",
                    }}
                  >
                    {width >= 18 && (
                      <span
                        className="absolute inset-0 flex items-center px-2 truncate"
                        style={{ fontSize: "11px", fontWeight: 500, color: palette.text }}
                      >
                        {bar.label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BrainstormShape() {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="w-14 h-10 rounded-lg" style={{ backgroundColor: i === 3 || i === 4 ? '#F9E05C' : '#FCF4C8' }} />
      ))}
    </div>
  );
}

function TableShape() {
  return (
    <div className="space-y-1.5">
      {[0, 1, 2, 3].map((row) => (
        <div key={row} className="flex gap-1.5">
          {[0, 1, 2, 3].map((col) => (
            <div key={col} className={`flex-1 h-4 rounded ${row === 0 ? 'bg-gray-300/60' : 'bg-gray-200/50'}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

function DocShape() {
  return (
    <div className="space-y-2">
      <div className="h-3 bg-gray-300/60 rounded w-2/3" />
      <div className="h-2 bg-gray-200/50 rounded w-full" />
      <div className="h-2 bg-gray-200/50 rounded w-11/12" />
      <div className="h-2 bg-gray-200/50 rounded w-full" />
      <div className="h-2 bg-gray-200/50 rounded w-4/5" />
    </div>
  );
}

function PeopleShape() {
  return (
    <div className="flex gap-2 justify-center">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="text-center">
          <div className="w-10 h-10 rounded-full bg-gray-200/80 mx-auto" />
          <div className="h-1.5 w-8 bg-gray-200/60 rounded mt-1 mx-auto" />
        </div>
      ))}
    </div>
  );
}

function DesignShape() {
  return (
    <div className="flex gap-2">
      {[1, 2].map((i) => (
        <div key={i} className="flex-1 h-20 rounded-lg border-2 border-dashed border-gray-300/60 bg-gray-100/30" />
      ))}
    </div>
  );
}

function HeatmapShape() {
  return (
    <div className="grid grid-cols-5 gap-1">
      {[...Array(20)].map((_, i) => (
        <div key={i} className="h-4 rounded-sm"
          style={{ backgroundColor: `rgba(156, 163, 175, ${0.15 + (i % 5) * 0.15})` }} />
      ))}
    </div>
  );
}

function JourneyMapShape() {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-1 flex-1">
          <div className="flex-1 h-8 rounded bg-gray-200/60 flex items-center justify-center">
            <div className="h-1.5 w-8 bg-gray-300/60 rounded" />
          </div>
          {i < 5 && (
            <svg width="8" height="8" viewBox="0 0 8 8" className="flex-shrink-0">
              <path d="M2 1L6 4L2 7" stroke="#d1d5db" strokeWidth="1.5" fill="none" />
            </svg>
          )}
        </div>
      ))}
    </div>
  );
}

function FlowDiagramShape() {
  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-2 flex-1">
          <div className="flex-1 h-10 rounded-lg bg-gray-200/60 border border-gray-200/40" />
          {i < 3 && <div className="w-4 h-0.5 bg-gray-300 flex-shrink-0" />}
        </div>
      ))}
    </div>
  );
}

function CalendarShape() {
  return (
    <div>
      <div className="flex gap-1 mb-1.5">
        {["M", "T", "W", "T", "F"].map((d, i) => (
          <div key={i} className="flex-1 text-center text-xs text-gray-400">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-5 gap-1">
        {[...Array(15)].map((_, i) => (
          <div key={i} className="h-4 rounded-sm" style={{ backgroundColor: i === 7 ? '#DB4F4F' : '#FFC6C6' }} />
        ))}
      </div>
    </div>
  );
}

function getShapeForType(type: string, data: Record<string, unknown>) {
  switch (type) {
    case "LineChartPreview": return <LineChartShape />;
    case "BarChartPreview": return <BarChartShape />;
    case "DonutChartPreview": return <DonutChartShape />;
    case "MetricsPreview": return <MetricsShape />;
    case "ProgressBarsPreview": return <ProgressBarsShape />;
    case "CountdownPreview": return <CountdownShape />;
    case "ApprovalPreview": return <ApprovalShape />;
    case "SlidesDeckPreview": return <SlidesDeckShape />;
    case "TimelinePreview": return <TimelineShape data={data} />;
    case "BrainstormPreview": return <BrainstormShape />;
    case "TablePreview": return <TableShape />;
    case "DocPreview": return <DocShape />;
    case "PeoplePreview": return <PeopleShape />;
    case "DesignPreview": return <DesignShape />;
    case "HeatmapPreview": return <HeatmapShape />;
    case "JourneyMapPreview": return <JourneyMapShape />;
    case "FlowDiagramPreview": return <FlowDiagramShape />;
    case "CalendarPreview": return <CalendarShape />;
    default: return <BarChartShape />;
  }
}

export function GenericVisualPreview({ type, data }: GenericVisualPreviewProps) {
  const title = getTitle(data);
  const isFrameless = type === "TimelinePreview" || type === "CalendarPreview";

  // Frameless previews: no container chrome — sit directly on the card's white background.
  // Other preview types still use the gray container (to be migrated per visual-system-home.md).
  if (isFrameless) {
    return (
      <div className={`${title ? "mt-3" : ""} px-1`}>
        {title && (
          <div className="text-xs font-medium text-gray-500 mb-3">{title}</div>
        )}
        <div className="w-full">
          {getShapeForType(type, data)}
        </div>
      </div>
    );
  }

  return (
    <div className={title ? "mt-3" : ""}>
      {title && (
        <div className="text-xs font-medium text-gray-500 mb-4">{title}</div>
      )}
      <div className="flex items-center justify-center">
        <div className="w-full max-w-sm">
          {getShapeForType(type, data)}
        </div>
      </div>
    </div>
  );
}
