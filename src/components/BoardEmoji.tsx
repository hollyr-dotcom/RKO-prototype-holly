"use client";

import {
  IconCreditCard, IconOffice, IconCog, IconPlug, IconRocket,
  IconSmiley, IconShieldLock, IconSparksFilled, IconMap,
  IconUsers, IconChartLine, IconOrgChart, IconMegaphone,
  IconSmileyChat, IconTargetArrow, IconChartBarYSimple,
  IconMagnifyingGlass, IconPalette, IconDollarSignCurrency,
  IconMobile, IconFlask, IconMicrophone, IconBoard,
  IconFlag, IconLightbulb, IconGlobe, IconThumbsUp,
  IconChatLinesTwo, IconUser, IconCalendarBlank, IconBriefcase,
  IconStar, IconTrophy, IconWand, IconTag, IconInsights,
} from "@mirohq/design-system-icons";

type IconComponent = React.ComponentType<{ css?: { width: number; height: number } }>;

const EMOJI_TO_ICON: Record<string, IconComponent> = {
  "💳": IconCreditCard,
  "🏦": IconOffice,
  "🏗️": IconCog,
  "🔌": IconPlug,
  "🚀": IconRocket,
  "😍": IconSmiley,
  "🔐": IconShieldLock,
  "🤖": IconSparksFilled,
  "🗺️": IconMap,
  "👥": IconUsers,
  "📈": IconChartLine,
  "📉": IconChartLine,
  "📐": IconOrgChart,
  "🎪": IconMegaphone,
  "🤝": IconSmileyChat,
  "🎯": IconTargetArrow,
  "📊": IconChartBarYSimple,
  "🔍": IconMagnifyingGlass,
  "🎨": IconPalette,
  "💰": IconDollarSignCurrency,
  "💵": IconDollarSignCurrency,
  "📱": IconMobile,
  "🧪": IconFlask,
  "🎙️": IconMicrophone,
  "🎤": IconMicrophone,
  "💡": IconLightbulb,
  "🌟": IconStar,
  "✨": IconWand,
  "🏅": IconTrophy,
  "🏆": IconTrophy,
  "🌐": IconGlobe,
  "👍": IconThumbsUp,
  "💬": IconChatLinesTwo,
  "🗂️": IconTag,
  "📋": IconBoard,
  "📝": IconBoard,
  "👤": IconUser,
  "📅": IconCalendarBlank,
  "💼": IconBriefcase,
  "🔎": IconMagnifyingGlass,
  "📌": IconFlag,
  "🏢": IconOffice,
  "🌍": IconGlobe,
  "📣": IconMegaphone,
  "🗺": IconMap,
};

export function isGeneratedEmoji(emoji: string | undefined): boolean {
  return !!emoji && emoji.startsWith("data:");
}

interface BoardEmojiProps {
  emoji?: string;
  /** Pixel size for the emoji container. Defaults to 20. */
  size?: number;
  className?: string;
  /** Show a shimmer loading state instead of the emoji */
  loading?: boolean;
}

export function BoardEmoji({
  emoji,
  size = 20,
  className = "",
  loading = false,
}: BoardEmojiProps) {
  if (loading) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-md overflow-hidden flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <span
          className="block w-full h-full rounded-md animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200"
          style={{ backgroundSize: "200% 100%" }}
        />
      </span>
    );
  }

  const value = emoji || "📋";

  if (isGeneratedEmoji(value)) {
    return (
      <span
        className={`inline-flex items-center justify-center flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={value}
          alt="Board emoji"
          width={size}
          height={size}
          className="rounded-[4px] object-cover"
          style={{ width: size, height: size }}
        />
      </span>
    );
  }

  const IconComponent = EMOJI_TO_ICON[value] ?? IconInsights;
  const iconSize = Math.round(size * 0.8);

  return (
    <span
      className={`inline-flex items-center justify-center flex-shrink-0 text-gray-500 ${className}`}
      style={{ width: size, height: size }}
    >
      <IconComponent css={{ width: iconSize, height: iconSize }} />
    </span>
  );
}
