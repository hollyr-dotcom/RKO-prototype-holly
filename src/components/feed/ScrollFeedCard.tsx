"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import type { FeedItem } from "@/types/feed";
import { formatTimeAgo } from "@/lib/formatTimeAgo";
import { getUser } from "@/lib/users";
import { FeedActions } from "./FeedActions";
import { CardTypeIcon } from "./FeedTypeIcon";
import { AgentOpportunityContent } from "./content/AgentOpportunity";
import { AgentCompletedContent } from "./content/AgentCompleted";
import { CollaborationRequestContent } from "./content/CollaborationRequest";
import { WorkflowChangeContent } from "./content/WorkflowChange";
import { AlertFYIContent } from "./content/AlertFYI";
import { GenericVisualPreview } from "./visuals/GenericVisualPreview";
import "./holo-card.css";

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
      if (item.id === "feed-ff-05") {
        return (
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-14 h-10 rounded-lg" style={{ backgroundColor: i === 2 ? '#F9E05C' : '#FCF4C8' }} />
              ))}
            </div>
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-14 h-10 rounded-lg" style={{ backgroundColor: i === 2 ? '#F9E05C' : '#FCF4C8' }} />
              ))}
            </div>
          </div>
        );
      }
      if (item.id === "feed-ff-youth-04") {
        return (
          <div className="flex items-center gap-4">
            <svg width="108" height="115" viewBox="0 0 108 115" fill="none">
              <path d="M54.9697 9.61279C83.9022 9.61279 107.357 33.0671 107.357 61.9995C107.357 90.9321 83.9023 114.387 54.9697 114.387C26.0373 114.387 2.58301 90.932 2.58301 61.9995C2.58305 55.4151 3.79701 49.1141 6.01465 43.3091L52.2568 60.9634C53.566 61.463 54.9697 60.4965 54.9697 59.0952V11.6128C54.9697 10.6157 54.2397 9.79156 53.2852 9.64014C53.8445 9.62246 54.4061 9.6128 54.9697 9.61279Z" fill="#E9EAEF" />
              <path d="M48.3578 49.4462C48.3578 50.8477 46.9538 51.8145 45.6445 51.3147L1.27256 34.3737C0.240495 33.9797 -0.280194 32.8216 0.153425 31.8055C7.89531 13.6645 25.5783 0.781464 46.3578 0.00137677C47.4616 -0.040061 48.3578 0.859329 48.3578 1.9639V49.4462Z" fill="#04BBEE" />
            </svg>
            <span className="font-bold text-gray-800 tracking-tight leading-none" style={{ fontSize: '20pt' }}>$ 4.2M</span>
          </div>
        );
      }
      return <AgentCompletedContent item={item} />;
    case "collaboration-request":
      if (item.id === "feed-ff-06") {
        return (
          <div className="flex gap-2 justify-between w-full px-2">
            {["keynote-Carla", "keynote-Lisa", "keynote-Nina", "keynote-Tom"].map((name) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={name}
                src={`/avatars/${name}.png`}
                alt=""
                className="rounded-full object-cover flex-1 min-w-0 aspect-square"
              />
            ))}
          </div>
        );
      }
      return <CollaborationRequestContent item={item} />;
    case "workflow-change":
      return <WorkflowChangeContent item={item} />;
    case "alert-fyi":
      if (item.id === "feed-cross-06") {
        return (
          <div className="flex flex-col items-center" style={{ marginTop: -8 }}>
            <div className="flex gap-1.5 mb-2">
              {["M", "T", "W", "T", "F"].map((d, i) => (
                <div key={i} className="w-12 text-center text-xs text-gray-400">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {[...Array(15)].map((_, i) => (
                <div key={i} className="w-12 h-6 rounded-sm" style={{ backgroundColor: i === 7 ? '#DB4F4F' : '#FFC6C6' }} />
              ))}
            </div>
          </div>
        );
      }
      return <AlertFYIContent item={item} />;
    case "talktrack": {
      // Static image talktrack — render image with play overlay
      const staticImage = item.payload.staticImage;
      if (staticImage) {
        return (
          <div className="relative w-full h-[180px] rounded-2xl overflow-hidden" style={{ backgroundColor: "rgba(0,0,0,0.2)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={staticImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M5.5 3.5L12.5 8L5.5 12.5V3.5Z" fill="white" />
                </svg>
              </div>
            </div>
          </div>
        );
      }
      return null; // video overlay covers this area for video talktracks
    }
    case "decision":
      return null; // video overlay covers this area
  }
  if (item.visualPreview) {
    return <GenericVisualPreview type={item.visualPreview.type} data={item.visualPreview.data} />;
  }
  return null;
}

const TILT_MAX = 4;
const TILT_SPRING = { stiffness: 300, damping: 25 };

const EASE = "cubic-bezier(0.25, 0.46, 0.45, 0.94)";
const VIDEO_TRANSITION = `top 220ms ${EASE}, left 220ms ${EASE}, right 220ms ${EASE}, height 220ms ${EASE}, border-radius 220ms ${EASE}, opacity 200ms ease-out`;

// Pixel positions within the 480px card
// Avatar bottom: pt-8(32) + h-12(48) = 80px
// Visual top: 80 + pt-4(16) + h-[5.25rem](84) + mt-4(16) = 196px
// Footer top: 196 + h-[180px](180) + mt-6(24) = 400px
const VIDEO_DEFAULT = { top: 196, left: 32, right: 32, height: 180, borderRadius: 16, opacity: 1 };
const VIDEO_EXPANDED = { top: 0, left: 0, right: 0, height: 480, borderRadius: 24, opacity: 1 };

/** Map a value from one range to another (used for CSS custom property calculation). */
const adjust = (v: number, fMin: number, fMax: number, tMin: number, tMax: number) =>
  ((v - fMin) / (fMax - fMin)) * (tMax - tMin) + tMin;

type VideoState = "idle" | "loading" | "playing";

export function ScrollFeedCard({ item, isActive = false, suppressHover = false }: { item: FeedItem; isActive?: boolean; suppressHover?: boolean }) {
  // Full-bleed video card — completely different layout
  const fullBleedVideo =
    item.type === "agent-completed" ? item.payload.fullBleedVideo : undefined;

  const videoSrc =
    item.type === "talktrack" || item.type === "decision"
      ? item.payload.videoSrc
      : undefined;

  // Blurred background image for talktrack cards
  const cardBgImage =
    item.type === "talktrack"
      ? item.payload.backgroundImage || item.payload.staticImage
      : undefined;

  const isDecision = item.type === "decision";

  const [videoState, setVideoState] = useState<VideoState>("idle");
  const [isHovered, setIsHovered] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; emoji: string; x: number }[]>([]);
  const emojiIdRef = useRef(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const activeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const effectiveHover = isHovered && !suppressHover;
  const isEngaged = effectiveHover || isActive;

  // Trigger video loading/cleanup when isActive changes (keyboard nav)
  // Only when not already hovered — mouse hover takes priority
  useEffect(() => {
    if (effectiveHover || !videoSrc) return;
    if (isActive) {
      setVideoState("loading");
      activeTimerRef.current = setTimeout(() => {
        setVideoState("playing");
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current.play().catch(() => {});
        }
      }, 1000);
    } else {
      if (activeTimerRef.current) {
        clearTimeout(activeTimerRef.current);
        activeTimerRef.current = null;
      }
      setVideoState("idle");
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
    return () => {
      if (activeTimerRef.current) {
        clearTimeout(activeTimerRef.current);
        activeTimerRef.current = null;
      }
    };
  }, [isActive, effectiveHover, videoSrc]);

  // 3D tilt parallax (decision cards only)
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const rawRotateX = useTransform(mouseY, [0, 1], effectiveHover && isDecision ? [TILT_MAX, -TILT_MAX] : [0, 0]);
  const rawRotateY = useTransform(mouseX, [0, 1], effectiveHover && isDecision ? [-TILT_MAX, TILT_MAX] : [0, 0]);
  const rotateX = useSpring(rawRotateX, TILT_SPRING);
  const rotateY = useSpring(rawRotateY, TILT_SPRING);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    mouseX.set(nx);
    mouseY.set(ny);

    if (isDecision && cardRef.current) {
      const px = nx * 100;
      const py = ny * 100;
      const el = cardRef.current;
      el.style.setProperty("--pointer-x", `${px}%`);
      el.style.setProperty("--pointer-y", `${py}%`);
      el.style.setProperty("--background-x", `${adjust(px, 0, 100, 37, 63)}%`);
      el.style.setProperty("--background-y", `${adjust(py, 0, 100, 33, 67)}%`);
      const fromCenter = Math.min(
        Math.sqrt((py - 50) ** 2 + (px - 50) ** 2) / 50,
        1
      );
      el.style.setProperty("--pointer-from-center", String(fromCenter));
      el.style.setProperty("--pointer-from-top", String(py / 100));
      el.style.setProperty("--pointer-from-left", String(px / 100));
    }
  }, [isDecision, mouseX, mouseY]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    if (!videoSrc) return;
    setVideoState("loading");
    timerRef.current = setTimeout(() => {
      setVideoState("playing");
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }
    }, 1000);
  }, [videoSrc]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    mouseX.set(0.5);
    mouseY.set(0.5);
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
      const el = cardRef.current;
      el.style.setProperty("--pointer-x", "50%");
      el.style.setProperty("--pointer-y", "50%");
      el.style.setProperty("--background-x", "50%");
      el.style.setProperty("--background-y", "50%");
      el.style.setProperty("--pointer-from-center", "0");
      el.style.setProperty("--pointer-from-top", "0.5");
      el.style.setProperty("--pointer-from-left", "0.5");
    }
  }, [isDecision, mouseX, mouseY]);

  const videoPos = videoState === "playing" ? VIDEO_EXPANDED : VIDEO_DEFAULT;

  /* ── Full-bleed video card ─────────────────────────────────────── */
  if (fullBleedVideo) {
    return (
      <div className="flex-shrink-0">
        <motion.div
          className="relative group rounded-3xl [transition:box-shadow_300ms_ease-out]"
          animate={{ scale: isEngaged ? 1.02 : 1 }}
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ boxShadow: isEngaged ? "0 8px 28px rgba(0,0,0,0.10)" : "none" }}
          onMouseEnter={() => {
            setIsHovered(true);
            setVideoState("loading");
            timerRef.current = setTimeout(() => {
              setVideoState("playing");
              if (videoRef.current) {
                videoRef.current.currentTime = 0;
                videoRef.current.play().catch(() => {});
              }
            }, 600);
          }}
          onMouseLeave={() => {
            setIsHovered(false);
            if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
            setVideoState("idle");
            if (videoRef.current) { videoRef.current.pause(); videoRef.current.currentTime = 0; }
          }}
        >
          <div className="relative w-[360px] rounded-3xl overflow-hidden h-[480px] border border-neutral-200 bg-black">
            {/* Video — full-bleed, aspect-fill the entire card */}
            <video
              ref={videoRef}
              src={fullBleedVideo}
              className="absolute inset-0 w-full h-full object-cover"
              loop
              muted
              playsInline
              preload="metadata"
            />

            {/* Gradient overlay for text legibility */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.08) 30%, rgba(0,0,0,0.05) 50%, rgba(0,0,0,0.08) 70%, rgba(0,0,0,0.22) 100%)" }}
            />

            {/* Header icon — same position as other cards */}
            <div className="px-8 pt-8 relative z-10">
              <CardTypeIcon itemType={item.type} itemId={item.id} />
            </div>

            {/* Title — same position as other cards */}
            <div className="px-8 pt-4 relative z-10">
              <h3 className="text-xl font-semibold tracking-tight text-gray-900 leading-snug line-clamp-3 h-[5.25rem] whitespace-pre-line">
                {item.title}
              </h3>
            </div>

            {/* Footer — hover-reveal actions */}
            <div className="absolute bottom-0 left-0 right-0 z-10 mb-6 h-12 overflow-hidden">
              {item.actions.length > 0 && (
                <div className={`absolute inset-y-0 inset-x-6 flex items-center transition-[transform,opacity] duration-300 ease-out ${isEngaged ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}`}>
                  <FeedActions
                    actions={item.actions}
                    size="large"
                    fill
                    onDark
                  />
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="flex-shrink-0"
      style={{
        perspective: isDecision ? 800 : undefined,
      }}
    >
   
    <motion.div
      className="relative group rounded-3xl [transition:box-shadow_300ms_ease-out]"
      animate={{
        scale: !isDecision && isEngaged ? 1.02 : 1,
      }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{
        boxShadow: isEngaged
          ? isDecision
            ? "0 8px 28px rgba(212,175,55,0.45)"
            : "0 8px 28px rgba(0,0,0,0.10)"
          : "none",
        rotateX: isDecision ? rotateX : 0,
        rotateY: isDecision ? rotateY : 0,
        transformStyle: isDecision ? "preserve-3d" : undefined,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
    

      {/* Gradient border — gold only, decision cards only */}
      {isDecision && (
        <div
          className={`absolute -inset-[1px] rounded-[25px] pointer-events-none transition-opacity duration-300 ${isEngaged ? "opacity-100" : "opacity-70"}`}
          style={{ background: "linear-gradient(135deg, rgb(255 232 158), rgb(238 193 47), rgb(255 163 70), rgb(212, 175, 55), rgb(246, 211, 101))" }}
        />
      )}

      {/* Card */}
      <div
        ref={cardRef}
        className={`relative w-[360px] rounded-3xl overflow-hidden flex flex-col border transition-[border-color] duration-300 h-[480px] ${
          isDecision
            ? `border-transparent holo-card${isEngaged ? " holo-active" : ""}`
            : "bg-white border-neutral-200"
        }`}
        style={{ transitionTimingFunction: EASE }}
      >
        {/* Blurred background image fill — talktrack cards only */}
        {cardBgImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cardBgImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            style={{ opacity: 0.4, filter: "blur(60px)", transform: "scale(1.3)" }}
          />
        )}

        {/* Gold card face — wraps content, equivalent to <img> in pokemon-cards-css */}
        <div
          className="w-full h-full flex flex-col"
          style={{
            background: isDecision
              ? "linear-gradient(135deg, rgb(255 232 158), rgb(238 193 47), rgb(255 163 70), rgb(212, 175, 55), rgb(246, 211, 101))"
              : undefined,
          }}
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



          {/* Footer — sits above video overlay */}
          <div className="relative mt-6 mb-6 h-12 overflow-hidden z-10">
           
            {/* Hover reveal: emoji reactions (decision) or action buttons */}
            {item.type === "decision" ? (
              <div
                className="absolute inset-y-0 inset-x-8 flex items-center"
                style={{ opacity: videoState === "playing" ? 1 : 0, pointerEvents: videoState === "playing" ? "auto" : "none", transition: "opacity 200ms ease-out" }}
              >
                <div
                  className="flex items-center rounded-full px-2 w-full"
                  style={{ height: 44, backgroundColor: "white" }}
                >
                  {["❤️", "👍", "🔥", "👏", "🙌", "👀"].map((emoji, i) => (
                    <button
                      key={emoji}
                      className="flex-1 h-9 flex items-center justify-center text-xl hover:scale-110 transition-transform pointer-events-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        const id = ++emojiIdRef.current;
                        const btnRect = e.currentTarget.getBoundingClientRect();
                        const cardRect = cardRef.current?.getBoundingClientRect();
                        const x = cardRect ? btnRect.left - cardRect.left + btnRect.width / 2 : 180;
                        setFloatingEmojis((prev) => [...prev, { id, emoji, x }]);
                        setTimeout(() => {
                          setFloatingEmojis((prev) => prev.filter((e) => e.id !== id));
                        }, 900);
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              item.actions.length > 0 && (
                <div className={`absolute inset-y-0 inset-x-6 flex items-center transition-[transform,opacity] duration-300 ease-out ${isEngaged ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}`}>
                  <FeedActions
                    actions={item.actions.map((a) => ({
                      ...a,
                      label:
                        item.type === "collaboration-request" || item.type === "talktrack" || item.id === "feed-ff-youth-04" || item.id === "feed-ff-05" || item.id === "feed-cross-06"
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
        </div>

        {/* Holographic overlay — shine → glare on top of gold face (pokemon-cards-css structure) */}
        {isDecision && (
          <>
            <div className="holo-shine" />
            <div className="holo-glare" />
          </>
        )}

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

      {/* Floating emoji bubbles — outside overflow-hidden card */}
      {floatingEmojis.map(({ id, emoji, x }) => (
        <motion.span
          key={id}
          className="absolute pointer-events-none text-3xl select-none"
          style={{ left: x, bottom: 60, translateX: "-50%", zIndex: 20 }}
          initial={{ opacity: 1, y: 0, scale: 0.4, rotate: 0 }}
          animate={{
            opacity: [1, 1, 0],
            y: -120,
            scale: [0.4, 1.3, 1],
            rotate: [0, -12, 10, -6, 0],
          }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {emoji}
        </motion.span>
      ))}
    </motion.div>
    </div>
  );
}
