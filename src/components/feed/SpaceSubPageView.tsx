"use client";

import { useState, useEffect } from "react";
import { PromptBar } from "@/components/PromptBar";
import { getSpaceHue, generateSpaceTheme, spaceThemeToCssVars } from "@/lib/space-theme";
import { SPACE_MEMBERS } from "@/data/space-members";
import { FF26_WIDGETS, FIRSTFLEX_WIDGETS } from "@/data/space-widgets-data";
import { SIDEBAR_WIDGET_DATA } from "@/data/sidebar-widget-data";
import { ScheduleCards } from "@/components/space-widgets/ScheduleCards";
import { AttendeesTable } from "@/components/space-widgets/AttendeesTable";

const FEED_WIDTH = 712;
const SIDEBAR_WIDTH = 320;
const SIDEBAR_GAP = 48;

const SPACE_WIDGETS: Record<string, unknown> = { "space-ff26": FF26_WIDGETS };
const FIRSTFLEX_SPACE_WIDGETS: Record<string, unknown> = { "space-firstflex": FIRSTFLEX_WIDGETS };

function getContainerWidth(spaceId: string) {
  const hasSidebar = !!(SPACE_WIDGETS[spaceId] || FIRSTFLEX_SPACE_WIDGETS[spaceId] || SIDEBAR_WIDGET_DATA[spaceId]);
  return hasSidebar ? FEED_WIDTH + SIDEBAR_GAP + SIDEBAR_WIDTH : FEED_WIDTH;
}

// Section label lookup — mirrors SPACE_SECTIONS in SecondaryPanel
const SECTION_LABELS: Record<string, Record<string, string>> = {
  "space-paygrid": { tasks: "Tasks", people: "People", budget: "Budget" },
  "space-firstflex": { tasks: "Tasks", people: "People", budget: "Budget" },
  "space-core": { tasks: "Tasks", people: "People", timeline: "Timeline" },
  "space-embed": { tasks: "Tasks", people: "People", partners: "Partners" },
  "space-launch-q3": { tasks: "Tasks", people: "People", timeline: "Timeline" },
  "space-brand": { tasks: "Tasks", people: "People", assets: "Assets" },
  "space-kyc": { tasks: "Tasks", people: "People", compliance: "Compliance" },
  "space-claims": { tasks: "Tasks", people: "People", models: "Models" },
  "space-ff26": { schedule: "Schedule", attendees: "Attendees", logistics: "Logistics" },
  "space-roadmaps": { tasks: "Tasks", people: "People", priorities: "Priorities" },
  "space-epd": { people: "People", goals: "Goals", reviews: "Reviews" },
  "space-revenueops": { pipeline: "Pipeline", people: "People", metrics: "Metrics" },
  "space-org27": { people: "People", budget: "Budget", timeline: "Timeline" },
  "space-1on1-james": { goals: "Goals", actions: "Actions", notes: "Notes" },
  "space-1on1-amara": { goals: "Goals", actions: "Actions", notes: "Notes" },
  "space-1on1-daniel": { goals: "Goals", actions: "Actions", notes: "Notes" },
};

interface SpaceSubPageViewProps {
  spaceId: string;
  sectionId: string;
}

export function SpaceSubPageView({ spaceId, sectionId }: SpaceSubPageViewProps) {
  const [space, setSpace] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/spaces/${spaceId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (!cancelled && data) setSpace(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [spaceId]);

  const theme = generateSpaceTheme(getSpaceHue(spaceId));
  const cssVars = spaceThemeToCssVars(theme);

  const members = SPACE_MEMBERS[spaceId];
  const pageLabel = SECTION_LABELS[spaceId]?.[sectionId] ?? sectionId;
  const containerWidth = getContainerWidth(spaceId);

  return (
    <div
      className="h-full relative overflow-hidden"
      style={{ backgroundColor: theme.bg, ...cssVars } as React.CSSProperties}
    >
      <div className="h-full overflow-y-auto">
        {/* Top bar — page name left, avatars right, same width as overview */}
        <div className="flex justify-center px-16">
          <div style={{ width: containerWidth }}>
            <div
              className="flex items-center justify-between"
              style={{ paddingTop: 32, paddingBottom: 32 }}
            >
              {/* Page name */}
              <h1
                className="font-heading font-medium leading-tight"
                style={{
                  fontSize: 36,
                  letterSpacing: "-1px",
                  color: "var(--space-accent)",
                }}
              >
                {pageLabel}
              </h1>

              {/* Avatar stack */}
              {members && (
                <div className="flex items-center">
                  {members.avatars.map((src, i) => (
                    <img
                      key={src}
                      src={src}
                      alt=""
                      className="rounded-full object-cover"
                      style={{
                        width: 40,
                        height: 40,
                        marginLeft: i > 0 ? -16 : 0,
                        zIndex: members.avatars.length - i,
                        position: "relative",
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="flex justify-center px-16">
          <div style={{ width: containerWidth }} className="pb-28">
            {spaceId === "space-ff26" && sectionId === "schedule" && (
              <ScheduleCards />
            )}
            {spaceId === "space-ff26" && sectionId === "attendees" && (
              <AttendeesTable />
            )}
          </div>
        </div>
      </div>

      {/* Gradient fade + prompt bar — centered across full content area */}
      <div className="absolute bottom-0 left-0 right-0 z-[19] flex justify-center px-16 pointer-events-none">
        <div className="relative" style={{ width: containerWidth }}>
          {/* Gradient overlay spanning full container */}
          <div
            className="absolute bottom-0 left-0 right-0 pointer-events-none"
            style={{
              height: "calc(128px + 2rem)",
              background: `linear-gradient(180deg, hsla(${theme.tintHue},80%,96%,0) 0%, hsla(${theme.tintHue},80%,96%,0.8) 60%, hsla(${theme.tintHue},80%,96%,0.98) 100%)`,
            }}
          />
          {/* Prompt bar — centered */}
          <div className="relative pb-8 flex justify-center pointer-events-auto">
            <div className="w-full max-w-3xl px-6">
              <PromptBar onSubmit={() => {}} inputBg={theme.bg} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
