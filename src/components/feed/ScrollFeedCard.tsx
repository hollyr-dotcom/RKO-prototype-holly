"use client";

import { useState, useRef } from "react";
import type { FeedItem, FeedSource } from "@/types/feed";
import { formatTimeAgo } from "@/lib/formatTimeAgo";
import { FeedActions } from "./FeedActions";
import { AgentOpportunityContent } from "./content/AgentOpportunity";
import { AgentCompletedContent } from "./content/AgentCompleted";
import { CollaborationRequestContent } from "./content/CollaborationRequest";
import { WorkflowChangeContent } from "./content/WorkflowChange";
import { AlertFYIContent } from "./content/AlertFYI";
import { GenericVisualPreview } from "./visuals/GenericVisualPreview";
import { IconSingleSparksFilled } from "@mirohq/design-system-icons";
import { getUser, getInitials, getUserColor } from "@/lib/users";

function CardAvatar({ source }: { source: FeedSource }) {
  const [imgFailed, setImgFailed] = useState(false);

  if (source.isAgent) {
    return (
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: "#111827" }}
      >
        <IconSingleSparksFilled css={{ width: 24, height: 24, color: "white" }} />
      </div>
    );
  }

  const user = getUser(source.userId);
  const name = user?.name ?? "Unknown";
  const color = getUserColor(source.userId);

  if (user?.avatar && !imgFailed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.avatar}
        alt={name}
        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <div
      className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: color }}
    >
      <span className="text-white text-sm font-semibold">{getInitials(name)}</span>
    </div>
  );
}

function CardVisual({ item }: { item: FeedItem }) {
  switch (item.type) {
    case "agent-opportunity": {
      const content = <AgentOpportunityContent item={item as Extract<FeedItem, { type: "agent-opportunity" }>} />;
      // AgentOpportunityContent returns null for items without payload/illustration —
      // fall through to GenericVisualPreview if visualPreview data exists
      const p = (item as Extract<FeedItem, { type: "agent-opportunity" }>).payload;
      const hasPayload = p.forecast || p.capacity || p.capacityConflict || p.confidence != null || p.convergence || p.stalled || p.invitationStall;
      const hasIllustration = item.id === "feed-core-01" || item.id === "feed-pq3-01" || item.id === "feed-cross-01" || item.id === "feed-claims-01";
      if (hasPayload || hasIllustration) return content;
      break; // fall through to visualPreview
    }
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
  }
  if (item.visualPreview) {
    return <GenericVisualPreview type={item.visualPreview.type} data={item.visualPreview.data} />;
  }
  return null;
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
      {/* HDR grain video — multiply blend, decision cards only */}
      {isDecision && (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video
          poster="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQAAAAA3iMLMAAAAAXNSR0IArs4c6QAAAA5JREFUeNpj+P+fgRQEAP1OH+HeyHWXAAAAAElFTkSuQmCC"
          src="data:video/mp4;base64,AAAAHGZ0eXBpc29tAAACAGlzb21pc28ybXA0MQAAAAhmcmVlAAAAvG1kYXQAAAAfTgEFGkdWStxcTEM/lO/FETzRQ6gD7gAA7gIAA3EYgAAAAEgoAa8iNjAkszOL+e58c//cEe//0TT//scp1n/381P/RWP/zOW4QtxorfVogeh8nQDbQAAAAwAQMCcWUTAAAAMAAAMAAAMA84AAAAAVAgHQAyu+KT35E7gAADFgAAADABLQAAAAEgIB4AiS76MTkNbgAAF3AAAPSAAAABICAeAEn8+hBOTXYAADUgAAHRAAAAPibW9vdgAAAGxtdmhkAAAAAAAAAAAAAAAAAAAD6AAAAKcAAQAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAw10cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAABAAAAAAAAAKcAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAABAAAAAQAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAACnAAAAAAABAAAAAAKFbWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAABdwAAAD6BVxAAAAAAAMWhkbHIAAAAAAAAAAHZpZGUAAAAAAAAAAAAAAABDb3JlIE1lZGlhIFZpZGVvAAAAAixtaW5mAAAAFHZtaGQAAAABAAAAAAAAAAAAAAAkZGluZgAAABxkcmVmAAAAAAAAAAEAAAAMdXJsIAAAAAEAAAHsc3RibAAAARxzdHNkAAAAAAAAAAEAAAEMaHZjMQAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAQABAASAAAAEgAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABj//wAAAHVodmNDAQIgAAAAsAAAAAAAPPAA/P36+gAACwOgAAEAGEABDAH//wIgAAADALAAAAMAAAMAPBXAkKEAAQAmQgEBAiAAAAMAsAAAAwAAAwA8oBQgQcCTDLYgV7kWVYC1CRAJAICiAAEACUQBwChkuNBTJAAAAApmaWVsAQAAAAATY29scm5jbHgACQAQAAkAAAAAEHBhc3AAAAABAAAAAQAAABRidHJ0AAAAAAAALPwAACz8AAAAKHN0dHMAAAAAAAAAAwAAAAIAAAPoAAAAAQAAAAEAAAABAAAD6AAAABRzdHNzAAAAAAAAAAEAAAABAAAAEHNkdHAAAAAAIBAQGAAAAChjdHRzAAAAAAAAAAMAAAABAAAAAAAAAAEAAAfQAAAAAgAAAAAAAAAcc3RzYwAAAAAAAAABAAAAAQAAAAQAAAABAAAAJHN0c3oAAAAAAAAAAAAAAAQAAABvAAAAGQAAABYAAAAWAAAAFHN0Y28AAAAAAAAAAQAAACwAAABhdWR0YQAAAFltZXRhAAAAAAAAACFoZGxyAAAAAAAAAABtZGlyYXBwbAAAAAAAAAAAAAAAACxpbHN0AAAAJKl0b28AAAAcZGF0YQAAAAEAAAAATGF2ZjYwLjMuMTAw"
          muted
          autoPlay
          playsInline
          loop
          className="absolute inset-0 w-full h-full rounded-3xl pointer-events-none z-[5] object-cover transition-opacity duration-300 opacity-0 group-hover:opacity-[0.15]"
          style={{ mixBlendMode: "multiply" }}
        />
      )}

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
        {/* Avatar — sits above video overlay */}
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
          ) : (
            <CardAvatar source={item.source} />
          )}
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

        {/* Footer — sits above video overlay */}
        <div className="relative mt-6 mb-6 h-12 overflow-hidden z-10">
          {/* Space + timestamp — slides up and out on hover */}
          <div className="absolute inset-y-0 inset-x-8 flex items-center transition-[transform,opacity] duration-300 ease-out group-hover:-translate-y-full group-hover:opacity-0 pointer-events-none">
            <p className={`text-sm ${isDecision ? "" : "text-gray-400"}`} style={isDecision ? { color: "rgba(0,0,0,0.6)" } : undefined}>
              {item.spaceName && (
                <>
                  {item.spaceName}
                  <span className="mx-1.5 opacity-40">·</span>
                </>
              )}
              {formatTimeAgo(item.timestamp)}
            </p>
          </div>

          {/* Hover reveal: emoji reactions (decision) or action buttons */}
          {item.type === "decision" ? (
            <div
              className="absolute inset-y-0 inset-x-8 flex items-center"
              style={{ opacity: videoState === "playing" ? 1 : 0, transition: "opacity 200ms ease-out" }}
            >
              <div
                className="flex items-center rounded-full px-2 w-full"
                style={{ height: 44, backgroundColor: "white" }}
              >
                {["❤️", "👍", "🔥", "👏", "🙌", "👀"].map((emoji) => (
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
                        ? "Unpack"
                        : "Assign",
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
