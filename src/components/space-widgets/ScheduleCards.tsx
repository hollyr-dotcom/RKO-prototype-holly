"use client";

import { motion } from "framer-motion";

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 400, damping: 30 } },
};

type SessionType = "Keynote" | "Talk" | "Workshop" | "Panel" | "All-Hands" | "Break" | "Social";

interface Session {
  time: string;
  title: string;
  summary?: string;
  speaker?: string;
  speakerTitle?: string;
  avatar?: string;
  photo?: string; // right-side image (can be same as avatar or different crop)
  type: SessionType;
  location: string;
}

const TYPE_BADGE: Record<SessionType, { bg: string; text: string }> = {
  Keynote:    { bg: "var(--space-accent)",     text: "#ffffff"              },
  Talk:       { bg: "var(--space-bg)",         text: "var(--space-accent)"  },
  Workshop:   { bg: "var(--space-bg)",         text: "var(--space-accent)"  },
  Panel:      { bg: "var(--space-bg)",         text: "var(--space-accent)"  },
  "All-Hands":{ bg: "var(--space-bg)",         text: "var(--space-accent)"  },
  Break:      { bg: "transparent",             text: "#9ca3af"              },
  Social:     { bg: "transparent",             text: "#9ca3af"              },
};

const DAYS: { label: string; date: string; sessions: Session[] }[] = [
  {
    label: "Day 1",
    date: "June 12",
    sessions: [
      {
        time: "09:00",
        title: "Opening Keynote: The Future of Work",
        summary: "An inspiring look at how distributed, async-first organisations are reshaping the way we collaborate — and what leaders need to do differently to thrive in the next decade.",
        speaker: "Carla Mendes",
        speakerTitle: "Chief People Officer, Lattice",
        avatar: "/avatars/keynote-Carla.png",
        photo: "/avatars/keynote-Carla.png",
        type: "Keynote",
        location: "Main Stage",
      },
      {
        time: "10:30",
        title: "Coffee Break",
        type: "Break",
        location: "Foyer",
      },
      {
        time: "11:00",
        title: "FlexForward Product Roadmap",
        summary: "A deep-dive into what's shipping in 2026 — new canvas primitives, AI-assisted facilitation, and the async workflow integrations the team has been building all year.",
        speaker: "Marcus Chen",
        speakerTitle: "VP Product, Miro",
        avatar: "/avatars/marcus-chen.png",
        photo: "/avatars/marcus-chen.png",
        type: "Talk",
        location: "Main Stage",
      },
      {
        time: "12:30",
        title: "Lunch",
        type: "Break",
        location: "Hall B",
      },
      {
        time: "14:00",
        title: "Workshop: AI in the Workplace",
        summary: "Hands-on exploration of how teams are embedding AI into everyday workflows — from automated standups and meeting summaries to AI-generated design critiques. Bring your laptop.",
        speaker: "Kyra Osei",
        speakerTitle: "Head of AI Enablement, Miro",
        avatar: "/avatars/kyra-osei.png",
        photo: "/avatars/kyra-osei.png",
        type: "Workshop",
        location: "Room 201",
      },
      {
        time: "14:00",
        title: "Workshop: Building Async Culture",
        summary: "A practical playbook for reducing meeting overload: setting async norms, designing rituals that don't require real-time presence, and building documentation as a first-class artifact.",
        speaker: "Priya Sharma",
        speakerTitle: "Culture Lead, Miro",
        avatar: "/avatars/priya-sharma.png",
        photo: "/avatars/priya-sharma.png",
        type: "Workshop",
        location: "Room 202",
      },
      {
        time: "15:30",
        title: "Coffee Break",
        type: "Break",
        location: "Foyer",
      },
      {
        time: "16:00",
        title: "Panel: Global Teams, Local Impact",
        summary: "Leaders from four continents discuss the tension between global alignment and local autonomy — how do you build a coherent culture when your team spans 14 time zones?",
        speaker: "Jordan Lee",
        speakerTitle: "Global Operations Lead, Miro",
        avatar: "/avatars/jordan-lee.png",
        photo: "/avatars/jordan-lee.png",
        type: "Panel",
        location: "Main Stage",
      },
      {
        time: "17:30",
        title: "Evening Reception",
        type: "Social",
        location: "Rooftop",
      },
    ],
  },
  {
    label: "Day 2",
    date: "June 13",
    sessions: [
      {
        time: "09:30",
        title: "Morning Keynote: Culture at Scale",
        summary: "What happens to culture when you go from 200 to 2,000 people? Amy draws on Miro's own journey — the things that broke, the rituals that scaled, and the unexpected lessons from building in public.",
        speaker: "Amy Chen",
        speakerTitle: "Chief People Officer, Miro",
        avatar: "/avatars/amy-chen.png",
        photo: "/avatars/amy-chen.png",
        type: "Keynote",
        location: "Main Stage",
      },
      {
        time: "11:00",
        title: "All-Hands Q&A",
        summary: "Open Q&A with Miro's leadership team. No prepared remarks — just honest answers to the questions you submit live via the FlexForward app.",
        speaker: "Sarah Chen",
        speakerTitle: "CEO, Miro",
        avatar: "/avatars/sarah-chen.png",
        photo: "/avatars/sarah-chen.png",
        type: "All-Hands",
        location: "Main Stage",
      },
      {
        time: "12:30",
        title: "Lunch",
        type: "Break",
        location: "Hall B",
      },
      {
        time: "14:00",
        title: "Workshop: Manager Excellence",
        summary: "A workshop for people managers: giving feedback that sticks, running 1:1s that aren't status updates, and building psychological safety in remote-first teams.",
        speaker: "Jordan Lee",
        speakerTitle: "Global Operations Lead, Miro",
        avatar: "/avatars/jordan-lee.png",
        photo: "/avatars/jordan-lee.png",
        type: "Workshop",
        location: "Room 201",
      },
      {
        time: "14:00",
        title: "Deep Dive: Product Updates",
        summary: "A technical session for power users — new API capabilities, the upcoming developer platform, and a live demo of the canvas-to-doc export pipeline.",
        speaker: "Marcus Chen",
        speakerTitle: "VP Product, Miro",
        avatar: "/avatars/marcus-chen.png",
        photo: "/avatars/marcus-chen.png",
        type: "Talk",
        location: "Room 202",
      },
      {
        time: "15:30",
        title: "Coffee Break",
        type: "Break",
        location: "Foyer",
      },
      {
        time: "16:00",
        title: "Closing Keynote & Awards",
        summary: "Celebrating the teams and individuals who've pushed the boundaries of collaborative work this year — plus a look at what's coming in 2027.",
        speaker: "Lisa Park",
        speakerTitle: "VP Engineering, Figma",
        avatar: "/avatars/keynote-Lisa.png",
        photo: "/avatars/keynote-Lisa.png",
        type: "Keynote",
        location: "Main Stage",
      },
      {
        time: "17:30",
        title: "Networking & Drinks",
        type: "Social",
        location: "Foyer",
      },
    ],
  },
];

function TypeBadge({ type }: { type: SessionType }) {
  const colors = TYPE_BADGE[type];
  if (type === "Break" || type === "Social") return null;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 10px",
        borderRadius: 99,
        fontSize: 11,
        fontWeight: 500,
        lineHeight: "18px",
        background: colors.bg,
        color: colors.text,
        flexShrink: 0,
        border: colors.bg === "var(--space-bg)" ? "1px solid var(--space-secondary)" : undefined,
      }}
    >
      {type}
    </span>
  );
}

function BreakRow({ session }: { session: Session }) {
  return (
    <div
      className="flex items-center gap-4"
      style={{ padding: "10px 0", borderBottom: "1px solid #f3f4f6" }}
    >
      <span style={{ fontSize: 12, fontWeight: 500, color: "#9ca3af", width: 40, flexShrink: 0 }}>
        {session.time}
      </span>
      <span style={{ fontSize: 13, color: "#9ca3af" }}>{session.title}</span>
      <span style={{ fontSize: 12, color: "#d1d5db", marginLeft: "auto" }}>{session.location}</span>
    </div>
  );
}

function SessionCard({ session }: { session: Session }) {
  const hasPhoto = !!session.photo;

  return (
    <motion.div
      variants={staggerItem}
      className="group relative overflow-hidden bg-white transition-shadow duration-200 hover:shadow-card"
      style={{ borderRadius: 24, border: "0.5px solid var(--color-gray-300)" }}
    >
      <div className="flex">
        {/* Left: text content */}
        <div className={`flex flex-col flex-1 min-w-0 p-6 ${hasPhoto ? "pr-4" : ""}`}>
          {/* Meta row: avatar + speaker name + time + location + badge */}
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            {session.avatar && (
              <img
                src={session.avatar}
                alt={session.speaker ?? ""}
                className="rounded-full object-cover flex-shrink-0"
                style={{ width: 32, height: 32 }}
              />
            )}
            {session.speaker && (
              <span className="text-sm font-medium text-gray-900 truncate">
                {session.speaker}
              </span>
            )}
            {session.speakerTitle && (
              <>
                <span style={{ color: "#d1d5db", fontSize: 12 }}>·</span>
                <span className="text-sm text-gray-400 truncate">{session.speakerTitle}</span>
              </>
            )}
            <div className="flex items-center gap-2 ml-auto flex-shrink-0">
              <span className="text-sm text-gray-400">{session.time}</span>
              <span style={{ color: "#d1d5db", fontSize: 12 }}>·</span>
              <span className="text-sm text-gray-400">{session.location}</span>
              <TypeBadge type={session.type} />
            </div>
          </div>

          {/* Title */}
          <h3 className="text-lg font-heading font-medium text-gray-900 leading-snug mb-1">
            {session.title}
          </h3>

          {/* Summary */}
          {session.summary && (
            <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
              {session.summary}
            </p>
          )}
        </div>

        {/* Right: speaker photo */}
        {hasPhoto && (
          <div className="w-[280px] flex-shrink-0 p-4 pl-2 flex items-center justify-center">
            <div
              className="overflow-hidden flex-shrink-0"
              style={{ width: 240, height: 184, borderRadius: 24 }}
            >
              <img
                src={session.photo}
                alt={session.speaker ?? ""}
                className="w-full h-full object-cover object-top"
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function ScheduleCards() {
  return (
    <div className="flex flex-col gap-10">
      {DAYS.map((day) => (
        <div key={day.label}>
          {/* Day heading */}
          <h2
            className="font-heading font-medium mb-5"
            style={{ fontSize: 22, color: "var(--space-accent)", letterSpacing: "-0.5px" }}
          >
            {day.label}
            <span style={{ fontWeight: 400, color: "var(--space-secondary)", marginLeft: 10, fontSize: 16 }}>
              {day.date}
            </span>
          </h2>

          {/* Sessions */}
          <motion.div
            className="flex flex-col gap-3"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {day.sessions.map((session, i) =>
              session.type === "Break" || session.type === "Social" ? (
                <BreakRow key={i} session={session} />
              ) : (
                <SessionCard key={i} session={session} />
              )
            )}
          </motion.div>
        </div>
      ))}
    </div>
  );
}
