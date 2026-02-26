"use client";

import { IconTable } from "@mirohq/design-system-icons";

// Badge color map — matches Notion-style option colors used in DataTableEditor
const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  Keynote:   { bg: "#f3e8ff", text: "#6b21a8" },
  Talk:      { bg: "#dbeafe", text: "#1e40af" },
  Workshop:  { bg: "#dcfce7", text: "#166534" },
  Panel:     { bg: "#ffedd5", text: "#9a3412" },
  "All-Hands":{ bg: "#fef9c3", text: "#854d0e" },
  Break:     { bg: "var(--color-gray-100)", text: "var(--color-gray-600)" },
  Social:    { bg: "#fce7f3", text: "#9d174d" },
};

// FF26 schedule data — RAI Amsterdam, June 12–13 2026
const SCHEDULE_ROWS: {
  day: string;
  time: string;
  session: string;
  speaker: string;
  type: string;
  location: string;
}[] = [
  { day: "Day 1", time: "09:00", session: "Opening Keynote: The Future of Work",         speaker: "Sarah Chen",          type: "Keynote",   location: "Main Stage" },
  { day: "Day 1", time: "10:30", session: "Coffee Break",                                 speaker: "",                    type: "Break",     location: "Foyer" },
  { day: "Day 1", time: "11:00", session: "FlexForward Product Roadmap",                  speaker: "Marcus Chen",         type: "Talk",      location: "Main Stage" },
  { day: "Day 1", time: "12:30", session: "Lunch",                                        speaker: "",                    type: "Break",     location: "Hall B" },
  { day: "Day 1", time: "14:00", session: "Workshop: AI in the Workplace",                speaker: "Kyra Osei",           type: "Workshop",  location: "Room 201" },
  { day: "Day 1", time: "14:00", session: "Workshop: Building Async Culture",             speaker: "Priya Sharma",        type: "Workshop",  location: "Room 202" },
  { day: "Day 1", time: "15:30", session: "Coffee Break",                                 speaker: "",                    type: "Break",     location: "Foyer" },
  { day: "Day 1", time: "16:00", session: "Panel: Global Teams, Local Impact",            speaker: "Jordan Lee + guests", type: "Panel",     location: "Main Stage" },
  { day: "Day 1", time: "17:30", session: "Evening Reception",                            speaker: "",                    type: "Social",    location: "Rooftop" },
  { day: "Day 2", time: "09:30", session: "Morning Keynote: Culture at Scale",            speaker: "Amy Chen",            type: "Keynote",   location: "Main Stage" },
  { day: "Day 2", time: "11:00", session: "All-Hands Q&A",                               speaker: "Leadership Team",     type: "All-Hands", location: "Main Stage" },
  { day: "Day 2", time: "12:30", session: "Lunch",                                        speaker: "",                    type: "Break",     location: "Hall B" },
  { day: "Day 2", time: "14:00", session: "Workshop: Manager Excellence",                 speaker: "Jordan Lee",          type: "Workshop",  location: "Room 201" },
  { day: "Day 2", time: "14:00", session: "Deep Dive: Product Updates",                   speaker: "Marcus Chen",         type: "Talk",      location: "Room 202" },
  { day: "Day 2", time: "15:30", session: "Coffee Break",                                 speaker: "",                    type: "Break",     location: "Foyer" },
  { day: "Day 2", time: "16:00", session: "Closing Keynote & Awards",                     speaker: "Sarah Chen",          type: "Keynote",   location: "Main Stage" },
  { day: "Day 2", time: "17:30", session: "Networking & Drinks",                          speaker: "",                    type: "Social",    location: "Foyer" },
];

// Column widths — should sum to fill available width; caller controls the wrapper width
const COL = {
  rowNum:   36,
  day:      80,
  time:     70,
  session:  "1fr" as const, // flexible
  speaker:  170,
  type:     110,
  location: 130,
};

function TypeBadge({ type }: { type: string }) {
  const colors = TYPE_COLORS[type] ?? { bg: "var(--color-gray-100)", text: "var(--color-gray-600)" };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "1px 8px",
        borderRadius: 3,
        fontSize: 11,
        fontWeight: 500,
        lineHeight: "18px",
        background: colors.bg,
        color: colors.text,
        whiteSpace: "nowrap",
      }}
    >
      {type}
    </span>
  );
}

const BORDER_ROW  = "1px solid var(--color-gray-100)";
const BORDER_HEAD = "1px solid var(--color-gray-200)";
const BG_HEAD     = "var(--color-gray-50)";

export function ScheduleTable() {
  return (
    <div
      style={{
        border: "0.5px solid var(--color-gray-300)",
        borderRadius: 24,
        background: "#ffffff",
        overflow: "hidden",
        width: "100%",
      }}
    >
      {/* Title bar */}
      <div
        style={{
          padding: "12px 14px",
          borderBottom: BORDER_ROW,
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexShrink: 0,
        }}
      >
        <IconTable css={{ width: 16, height: 16, flexShrink: 0, color: "var(--color-gray-400)" }} />
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--color-gray-700)",
            lineHeight: "18px",
          }}
        >
          Schedule · FlexForward 26
        </span>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto", fontSize: 12 }}>
        <table
          style={{
            borderCollapse: "collapse",
            width: "100%",
            tableLayout: "fixed",
          }}
        >
          <colgroup>
            <col style={{ width: COL.rowNum }} />
            <col style={{ width: COL.day }} />
            <col style={{ width: COL.time }} />
            <col /> {/* session — flexible */}
            <col style={{ width: COL.speaker }} />
            <col style={{ width: COL.type }} />
            <col style={{ width: COL.location }} />
          </colgroup>

          <thead>
            <tr>
              {/* Row-number header */}
              <th style={thStyle({ center: true, rowNum: true })}>#</th>
              <th style={thStyle({})}>Day</th>
              <th style={thStyle({})}>Time</th>
              <th style={thStyle({})}>Session</th>
              <th style={thStyle({})}>Speaker</th>
              <th style={thStyle({})}>Type</th>
              <th style={{ ...thStyle({}), borderRight: "none" }}>Location</th>
            </tr>
          </thead>

          <tbody>
            {SCHEDULE_ROWS.map((row, i) => (
              <tr key={i}>
                <td style={tdStyle({ rowNum: true })}>{i + 1}</td>
                <td style={tdStyle({ muted: true })}>{row.day}</td>
                <td style={tdStyle({ muted: true })}>{row.time}</td>
                <td style={{ ...tdStyle({}), fontWeight: row.type === "Break" || row.type === "Social" ? 400 : 500 }}>
                  {row.session}
                </td>
                <td style={tdStyle({ muted: !row.speaker })}>{row.speaker || "—"}</td>
                <td style={{ ...tdStyle({}), paddingTop: 4, paddingBottom: 4 }}>
                  <TypeBadge type={row.type} />
                </td>
                <td style={{ ...tdStyle({}), borderRight: "none" }}>{row.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function thStyle({ center = false, rowNum = false }: { center?: boolean; rowNum?: boolean }) {
  return {
    padding: "6px 8px",
    borderBottom: BORDER_HEAD,
    borderRight: BORDER_ROW,
    background: BG_HEAD,
    color: rowNum ? "var(--color-gray-400)" : "var(--color-gray-700)",
    fontSize: rowNum ? 11 : 12,
    fontWeight: rowNum ? 500 : 600,
    textAlign: center ? ("center" as const) : ("left" as const),
    position: "sticky" as const,
    top: 0,
    zIndex: 2,
    overflow: "hidden",
  };
}

function tdStyle({ rowNum = false, muted = false }: { rowNum?: boolean; muted?: boolean }) {
  return {
    padding: "5px 8px",
    borderBottom: BORDER_ROW,
    borderRight: BORDER_ROW,
    background: rowNum ? BG_HEAD : "transparent",
    color: rowNum ? "var(--color-gray-400)" : muted ? "var(--color-gray-500)" : "var(--color-gray-800)",
    fontSize: rowNum ? 11 : 12,
    fontWeight: rowNum ? 500 : 400,
    textAlign: rowNum ? ("center" as const) : ("left" as const),
    overflow: "hidden",
    whiteSpace: "nowrap" as const,
    textOverflow: "ellipsis",
  };
}
