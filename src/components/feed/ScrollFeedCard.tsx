"use client";

import { useState, useRef } from "react";
import type { FeedItem, FeedItemType } from "@/types/feed";
import { getUser } from "@/lib/users";
import { FeedActions } from "./FeedActions";
import { AgentOpportunityContent } from "./content/AgentOpportunity";
import { AgentCompletedContent } from "./content/AgentCompleted";
import { CollaborationRequestContent } from "./content/CollaborationRequest";
import { WorkflowChangeContent } from "./content/WorkflowChange";
import { AlertFYIContent } from "./content/AlertFYI";

/* ------------------------------------------------------------------ */
/*  Card icon type system                                              */
/*  Add new icon types here with a corresponding SVG component below. */
/* ------------------------------------------------------------------ */

type CardIconType = "flag" | "sparkle" | "chart" | "people" | "lightning" | "megaphone" | "shield" | "calendar" | "timeline";

/** Map each feed item type to a header icon. Extend as needed. */
const ICON_FOR_TYPE: Partial<Record<FeedItemType, CardIconType>> = {
  "alert-fyi": "flag",
  "agent-opportunity": "flag",
  "agent-completed": "flag",
  "key-metric": "chart",
  "chart": "chart",
  "competitor-threat": "shield",
  "budget-notification": "flag",
  "budget-request": "flag",
  "collaboration-request": "people",
  "workflow-change": "flag",
  "approval": "flag",
  "team-announcement": "megaphone",
  "live-session": "people",
  "feedback-request": "people",
  "talktrack": "flag",
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

const ICON_COMPONENTS: Record<CardIconType, React.FC> = {
  flag: FlagSvg,
  sparkle: SparkleSvg,
  chart: ChartSvg,
  people: PeopleSvg,
  lightning: LightningSvg,
  megaphone: MegaphoneSvg,
  shield: ShieldSvg,
  calendar: CalendarSvg,
  timeline: TimelineSvg,
};

/** Per-item icon overrides (takes precedence over type-based mapping) */
const ICON_FOR_ID: Record<string, CardIconType> = {
  "feed-core-01": "timeline",
  "feed-pq3-01": "timeline",
};

function CardTypeIcon({ itemType, itemId }: { itemType: FeedItemType; itemId?: string }) {
  const iconType = (itemId && ICON_FOR_ID[itemId]) || ICON_FOR_TYPE[itemType] || "flag";
  const Icon = ICON_COMPONENTS[iconType];
  return <Icon />;
}


function CardVisual({ item }: { item: FeedItem }) {
  switch (item.type) {
    case "agent-opportunity":
      return <AgentOpportunityContent item={item} />;
    case "agent-completed":
      return <AgentCompletedContent item={item} />;
    case "collaboration-request":
      return <CollaborationRequestContent item={item} />;
    case "workflow-change":
      return <WorkflowChangeContent item={item} />;
    case "alert-fyi":
      return <AlertFYIContent item={item} />;
    case "talktrack":
      return null; // video overlay covers this area
    case "decision":
      return null; // video overlay covers this area
    default:
      return null;
  }
}

const EASE = "cubic-bezier(0.25, 0.46, 0.45, 0.94)";
const DECISION_BASE_BG = "linear-gradient(160deg, rgba(255,235,130,0.18) 0%, rgba(255,215,70,0.10) 50%, rgba(255,200,60,0.06) 100%)";
const VIDEO_TRANSITION = `top 220ms ${EASE}, left 220ms ${EASE}, right 220ms ${EASE}, height 220ms ${EASE}, border-radius 220ms ${EASE}, opacity 200ms ease-out`;

// Pixel positions within the 480px card
// Avatar bottom: pt-8(32) + h-12(48) = 80px
// Visual top: 80 + pt-4(16) + h-[5.25rem](84) + mt-4(16) = 196px
// Footer top: 196 + h-[180px](180) + mt-6(24) = 400px
const VIDEO_DEFAULT = { top: 196, left: 32, right: 32, height: 180, borderRadius: 16, opacity: 1 };
const VIDEO_EXPANDED = { top: 0, left: 0, right: 0, height: 480, borderRadius: 24, opacity: 1 };

type VideoState = "idle" | "loading" | "playing";

export function ScrollFeedCard({ item }: { item: FeedItem }) {
  const videoSrc =
    item.type === "talktrack" || item.type === "decision"
      ? item.payload.videoSrc
      : undefined;

  const isDecision = item.type === "decision";

  const [videoState, setVideoState] = useState<VideoState>("idle");
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDecision || !cardRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    cardRef.current.style.background = `radial-gradient(ellipse 280px 280px at ${x * 100}% ${y * 100}%, rgba(255,225,80,0.30) 0%, rgba(255,210,60,0.12) 50%, transparent 75%), ${DECISION_BASE_BG}`;
  };

  const handleMouseEnter = () => {
    if (!videoSrc) return;
    setVideoState("loading");
    timerRef.current = setTimeout(() => {
      setVideoState("playing");
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }
    }, 1000);
  };

  const handleMouseLeave = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setVideoState("idle");
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    if (isDecision && cardRef.current) {
      cardRef.current.style.background = DECISION_BASE_BG;
    }
  };

  const videoPos = videoState === "playing" ? VIDEO_EXPANDED : VIDEO_DEFAULT;

  return (
    <div
      className={`card-tilt relative flex-shrink-0 group rounded-3xl hover:scale-[1.05] [transition:scale_300ms_ease-out,box-shadow_300ms_ease-out] ${
        isDecision
          ? "hover:shadow-[0_8px_28px_rgba(212,175,55,0.45)]"
          : "hover:shadow-[0_8px_28px_rgba(0,0,0,0.10)]"
      }`}
      style={{
        scrollSnapAlign: "center",
        scrollSnapStop: "always",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={isDecision ? handleMouseMove : undefined}
    >
      {/* Gradient border — gold only, decision cards only */}
      {isDecision && (
        <div
          className="absolute -inset-[1px] rounded-[25px] pointer-events-none transition-opacity opacity-70 group-hover:opacity-100 duration-300"
          style={{ background: "linear-gradient(135deg, #f6d365, #d4af37, #ffa040, #d4af37, #f6d365)" }}
        />
      )}

      {/* Card */}
      <div
        ref={cardRef}
        className={`relative w-[360px] rounded-3xl overflow-hidden flex flex-col border transition-[border-color] duration-300 h-[480px] ${
          isDecision ? "border-transparent" : "bg-gray-50 border-neutral-200"
        }`}
        style={{ transitionTimingFunction: EASE, background: isDecision ? DECISION_BASE_BG : undefined }}
      >
        {/* Header icon — typed SVG, avatar for human sources, sits above video overlay */}
        <div className="px-8 pt-8 relative z-10">
          {item.type === "decision" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/approved.svg"
              alt="Decision"
              className="w-12 h-12 flex-shrink-0"
              style={{
                filter: videoState === "playing" ? "brightness(0) invert(1)" : "none",
                transition: "filter 300ms ease-out",
              }}
            />
          ) : (() => {
            const sourceUser = !item.source.isAgent ? getUser(item.source.userId) : undefined;
            if (sourceUser?.avatar) {
              return (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={sourceUser.avatar}
                  alt={sourceUser.name}
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0 overflow-hidden"
                />
              );
            }
            return <CardTypeIcon itemType={item.type} itemId={item.id} />;
          })()}
        </div>

        {/* Title — fades out on hover when video is present */}
        <div
          className="px-8 pt-4"
          style={{
            transition: "opacity 250ms ease-out",
            opacity: videoSrc && videoState === "playing" ? 0 : 1,
          }}
        >
          <h3 className="text-xl font-semibold tracking-tight text-gray-900 leading-snug line-clamp-3 h-[5.25rem] whitespace-pre-line">
            {item.title}
          </h3>
        </div>

        {/* Visual area — fills remaining space, vertically centers content */}
        <div className="mx-8 mt-4 flex-1 min-h-0 rounded-2xl overflow-hidden flex items-center justify-center">
          <CardVisual item={item} />
        </div>

        {/* Footer — action buttons, 48px tall, 24px from card bottom */}
        <div className="relative flex-shrink-0 mb-6 h-12 z-10">
          {item.type === "decision" ? (
            <div
              className="absolute inset-y-0 inset-x-8 flex items-center"
              style={{ opacity: videoState === "playing" ? 1 : 0, transition: "opacity 200ms ease-out" }}
            >
              <div
                className="flex items-center rounded-full px-2 w-full"
                style={{ height: 44, backgroundColor: "white" }}
              >
                {["\u2764\uFE0F", "\uD83D\uDC4D", "\uD83D\uDD25", "\uD83D\uDC4F", "\uD83D\uDE4C", "\uD83D\uDC40"].map((emoji) => (
                  <button
                    key={emoji}
                    className="flex-1 h-9 flex items-center justify-center text-xl hover:scale-110 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            item.actions.length > 0 && (
              <div className="absolute inset-y-0 inset-x-6 flex items-center opacity-0 group-hover:opacity-100">
                <FeedActions
                  actions={item.actions.map((a) => ({
                    ...a,
                    label:
                      item.type === "collaboration-request" || item.type === "talktrack"
                        ? a.label
                        : a.variant === "primary"
                        ? "Resolve"
                        : "Ignore",
                  }))}
                  size="large"
                  fill
                  onDark={!!videoSrc && videoState === "playing"}
                />
              </div>
            )
          )}
        </div>

        {/* Video overlay — talk track cards only */}
        {videoSrc && (
          <div
            className="absolute overflow-hidden pointer-events-none"
            style={{
              top: videoPos.top,
              left: videoPos.left,
              right: videoPos.right,
              height: videoPos.height,
              borderRadius: videoPos.borderRadius,
              opacity: videoPos.opacity,
              zIndex: 5,
              transition: VIDEO_TRANSITION,
            }}
          >
            <video
              ref={videoRef}
              src={videoSrc}
              className="w-full h-full object-cover"
              loop
              muted
              playsInline
              preload="metadata"
            />
            {/* Icon overlay — play button → spinner → hidden */}
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ opacity: videoState === "playing" ? 0 : 1, transition: "opacity 200ms ease-out" }}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center relative" style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}>
                {/* Play icon */}
                <div className="absolute" style={{ opacity: videoState === "idle" ? 1 : 0, transition: "opacity 200ms ease-out" }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M5.5 3.5L12.5 8L5.5 12.5V3.5Z" fill="white" />
                  </svg>
                </div>
                {/* Spinner */}
                <div
                  className="absolute w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"
                  style={{ opacity: videoState === "loading" ? 1 : 0, transition: "opacity 200ms ease-out" }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
