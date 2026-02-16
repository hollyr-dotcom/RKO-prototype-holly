"use client";

/**
 * BoardEmoji — renders either a generated image emoji (data URL) or a Unicode emoji.
 *
 * Detection: if the emoji string starts with "data:" it's a generated PNG image,
 * otherwise it's a Unicode emoji rendered as text.
 */

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

  return (
    <span
      className={`inline-flex items-center justify-center flex-shrink-0 leading-none text-center ${className}`}
      style={{ width: size, height: size, fontSize: size }}
    >
      {value}
    </span>
  );
}
