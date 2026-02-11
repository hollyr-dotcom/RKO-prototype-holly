import Link from "next/link";

interface SpaceCardProps {
  id: string;
  name: string;
  description: string;
  canvasCount: number;
  updatedAt: string;
}

export function SpaceCard({
  id,
  name,
  description,
  canvasCount,
  updatedAt,
}: SpaceCardProps) {
  const timeAgo = formatTimeAgo(updatedAt);

  return (
    <Link
      href={`/space/${id}`}
      className="group block rounded-xl border border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm transition-all"
    >
      {/* Thumbnail placeholder */}
      <div className="h-36 rounded-t-xl bg-gray-50 flex items-center justify-center">
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          className="text-gray-300"
        >
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-sm font-medium text-gray-900 group-hover:text-gray-700 truncate">
          {name}
        </h3>
        {description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
            {description}
          </p>
        )}
        <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
          <span>
            {canvasCount} canvas{canvasCount !== 1 ? "es" : ""}
          </span>
          <span>Updated {timeAgo}</span>
        </div>
      </div>
    </Link>
  );
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
