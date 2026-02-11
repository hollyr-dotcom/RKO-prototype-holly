import Link from "next/link";

interface CanvasCardProps {
  id: string;
  spaceId: string;
  name: string;
  updatedAt: string;
}

export function CanvasCard({ id, spaceId, name, updatedAt }: CanvasCardProps) {
  const timeAgo = formatTimeAgo(updatedAt);

  return (
    <Link
      href={`/space/${spaceId}/canvas/${id}`}
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
          <rect x="2" y="2" width="20" height="20" rx="2" />
          <line x1="7" y1="8" x2="17" y2="8" />
          <line x1="7" y1="12" x2="13" y2="12" />
          <line x1="7" y1="16" x2="15" y2="16" />
        </svg>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-sm font-medium text-gray-900 group-hover:text-gray-700 truncate">
          {name}
        </h3>
        <p className="text-xs text-gray-400 mt-2">Updated {timeAgo}</p>
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
