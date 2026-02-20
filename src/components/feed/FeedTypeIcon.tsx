"use client";

import type { FeedItemType } from "@/types/feed";

export type CardIconType =
  | "flag"
  | "sparkle"
  | "chart"
  | "chart-line"
  | "people"
  | "lightning"
  | "megaphone"
  | "shield"
  | "calendar"
  | "timeline";

/** Map each feed item type to a header icon. */
export const ICON_FOR_TYPE: Partial<Record<FeedItemType, CardIconType>> = {
  "alert-fyi": "flag",
  "agent-opportunity": "flag",
  "agent-completed": "flag",
  "key-metric": "chart",
  chart: "chart",
  "competitor-threat": "shield",
  "budget-notification": "flag",
  "budget-request": "flag",
  "collaboration-request": "people",
  "workflow-change": "flag",
  approval: "flag",
  "team-announcement": "megaphone",
  "live-session": "people",
  "feedback-request": "people",
  talktrack: "flag",
};

/** Per-item icon overrides (takes precedence over type-based mapping) */
export const ICON_FOR_ID: Record<string, CardIconType> = {
  "feed-core-01": "timeline",
  "feed-pq3-01": "timeline",
  "feed-claims-01": "chart-line",
};

function FlagSvg() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path d="M5 3v18M5 3h11l-3 5.5 3 5.5H5" stroke="#222428" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SparkleSvg() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path d="M12 2l2.09 6.26L20 10.27l-4.91 3.82L16.18 22 12 17.27 7.82 22l1.09-7.91L4 10.27l5.91-2.01L12 2z" stroke="#222428" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChartSvg() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="12" width="4" height="9" rx="1" stroke="#222428" strokeWidth="1.5" />
      <rect x="10" y="7" width="4" height="14" rx="1" stroke="#222428" strokeWidth="1.5" />
      <rect x="17" y="3" width="4" height="18" rx="1" stroke="#222428" strokeWidth="1.5" />
    </svg>
  );
}

function ChartLineSvg() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <path d="M23.8327 23.8333H3.24935L2.16602 22.75V4.33334H4.33268V21.6667H23.8327V23.8333Z" fill="#222428" />
      <path d="M12.5932 9.9871L17.0585 13.5607L21.8312 5.92578L23.6677 7.07408L18.2509 15.7406L16.656 16.0129L12.1616 12.4176L8.484 17.9339L6.68113 16.7325L11.0148 10.2325L12.5932 9.9871Z" fill="#222428" />
    </svg>
  );
}

function PeopleSvg() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="7" r="3.25" stroke="#222428" strokeWidth="1.5" />
      <path d="M3 20c0-3.31 2.69-6 6-6s6 2.69 6 6" stroke="#222428" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="17" cy="9" r="2.25" stroke="#222428" strokeWidth="1.5" />
      <path d="M17 14c2.76 0 5 2.24 5 5" stroke="#222428" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function LightningSvg() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" stroke="#222428" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MegaphoneSvg() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path d="M18 8a3 3 0 010 6M3 10.5v3a1 1 0 001 1h1l3 4.5h1v-5.5h1.5a8 8 0 007.5-5v-1a8 8 0 00-7.5-5H9v5.5H5l-1-4.5H4a1 1 0 00-1 1z" stroke="#222428" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShieldSvg() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path d="M12 3l7 3.5v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10v-5L12 3z" stroke="#222428" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CalendarSvg() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="17" rx="2" stroke="#222428" strokeWidth="1.5" />
      <path d="M3 9h18M8 2v4M16 2v4" stroke="#222428" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function TimelineSvg() {
  return (
    <svg width="28" height="28" viewBox="0 0 26 26" fill="none">
      <path fillRule="evenodd" clipRule="evenodd" d="M11.917 17.3333C13.0389 17.3334 13.9612 18.1862 14.072 19.2789L14.0837 19.5V21.6667C14.0837 22.8633 13.1136 23.8333 11.917 23.8333H7.58366C6.4617 23.8333 5.53941 22.9805 5.42863 21.8878L5.41699 21.6667V19.5L5.42757 19.2789C5.53091 18.2591 6.34188 17.4488 7.36149 17.345L7.58366 17.3333H11.917ZM11.917 19.5H7.58366V21.6667H11.917V19.5Z" fill="#222428" />
      <path fillRule="evenodd" clipRule="evenodd" d="M21.667 9.74999C22.7889 9.74999 23.7112 10.6028 23.822 11.6955L23.8337 11.9167V14.0833C23.8337 15.2799 22.8636 16.25 21.667 16.25H11.917C10.7204 16.25 9.75033 15.2799 9.75033 14.0833V11.9167L9.76196 11.6955C9.86538 10.6755 10.6759 9.86504 11.6959 9.76163L11.917 9.74999H21.667ZM21.667 11.9167H11.917V14.0833H21.667V11.9167Z" fill="#222428" />
      <path fillRule="evenodd" clipRule="evenodd" d="M11.917 2.16666C13.0389 2.16672 13.9612 3.01952 14.072 4.11221L14.0837 4.33332V6.49999L14.072 6.7211C13.9612 7.81383 13.0389 8.66666 11.917 8.66666H4.33366L4.11255 8.65502C3.09254 8.55161 2.28204 7.74111 2.17863 6.7211L2.16699 6.49999V4.33332L2.17757 4.11221C2.28091 3.09246 3.09188 2.2821 4.11149 2.17829L4.33366 2.16666H11.917ZM11.917 4.33332H4.33366V6.49999H11.917V4.33332Z" fill="#222428" />
    </svg>
  );
}

export const ICON_COMPONENTS: Record<CardIconType, React.FC> = {
  flag: FlagSvg,
  sparkle: SparkleSvg,
  chart: ChartSvg,
  "chart-line": ChartLineSvg,
  people: PeopleSvg,
  lightning: LightningSvg,
  megaphone: MegaphoneSvg,
  shield: ShieldSvg,
  calendar: CalendarSvg,
  timeline: TimelineSvg,
};

export function CardTypeIcon({ itemType, itemId }: { itemType: FeedItemType; itemId?: string }) {
  const iconType = (itemId && ICON_FOR_ID[itemId]) || ICON_FOR_TYPE[itemType] || "flag";
  const Icon = ICON_COMPONENTS[iconType];
  return <Icon />;
}
