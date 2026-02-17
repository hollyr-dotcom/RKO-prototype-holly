"use client";

// 1. MatrixGrid - 6×4 colored squares heatmap
export function MatrixGrid({
  rows,
  cols,
  label,
  timeSpent
}: {
  rows: number;
  cols: number;
  label: string;
  timeSpent?: string;
}) {
  const colors = [
    '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa',
    '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af'
  ];

  return (
    <div className="mt-3 py-8 px-10 rounded-2xl bg-gray-50 relative max-h-[240px] overflow-hidden">
      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`
        }}
      >
        {Array.from({ length: rows * cols }, (_, i) => {
          const colorIndex = (i + Math.floor(i / cols) * 3) % colors.length;
          return (
            <div
              key={i}
              className="aspect-square rounded-md shadow-sm transition-transform hover:scale-105"
              style={{ backgroundColor: colors[colorIndex] }}
            />
          );
        })}
      </div>
      {timeSpent && (
        <div className="absolute bottom-3 left-3">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-white/80 backdrop-blur-sm text-gray-700 shadow-sm">
            {timeSpent}
          </span>
        </div>
      )}
    </div>
  );
}

// 2. WorkstreamBars - 4 progress bars (different colors/lengths) + 3 red blocker dots
export function WorkstreamBars({
  streams,
  blockers,
  timeSpent
}: {
  streams: Array<{ label: string; progress: number }>;
  blockers: number;
  timeSpent?: string;
}) {
  const colors = ['#3b82f6', '#6366f1', '#8b5cf6', '#14b8a6'];

  return (
    <div className="mt-3 py-8 px-10 rounded-2xl bg-gray-50 relative max-h-[240px] overflow-hidden">
      <div className="space-y-3">
        {streams.map((stream, index) => (
          <div key={index} className="flex items-center gap-3">
            <span className="text-xs text-gray-600 font-medium w-24 text-right flex-shrink-0">
              {stream.label}
            </span>
            <div className="flex-1">
              <div className="h-6 rounded-full bg-white/60 relative overflow-hidden">
                <div
                  className="absolute h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${stream.progress * 100}%`,
                    background: `linear-gradient(90deg, ${colors[index % colors.length]}, ${colors[index % colors.length]}dd)`
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Blocker dots on the right */}
      {blockers > 0 && (
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          {Array.from({ length: blockers }, (_, i) => (
            <div key={i} className="w-3 h-3 rounded-full bg-red-500 shadow-sm" />
          ))}
        </div>
      )}

      {timeSpent && (
        <div className="absolute bottom-3 left-3">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-white/80 backdrop-blur-sm text-gray-700 shadow-sm">
            {timeSpent}
          </span>
        </div>
      )}
    </div>
  );
}

// 3. ScheduleGrid - 8-column × 3-row grid of colored session blocks
export function ScheduleGrid({
  sessions,
  tracks,
  timeSpent
}: {
  sessions: number;
  tracks: number;
  timeSpent?: string;
}) {
  const trackColors = [
    '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899',
    '#f43f5e', '#f59e0b', '#10b981', '#14b8a6'
  ];

  const rows = Math.ceil(sessions / tracks);

  return (
    <div className="mt-3 py-8 px-10 rounded-2xl bg-gray-50 relative max-h-[240px] overflow-hidden">
      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${tracks}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`
        }}
      >
        {Array.from({ length: sessions }, (_, i) => {
          const trackIndex = i % tracks;
          const isFilled = Math.random() > 0.2; // Some cells empty

          return (
            <div
              key={i}
              className="h-8 rounded-md shadow-sm transition-transform hover:scale-105"
              style={{
                backgroundColor: isFilled ? trackColors[trackIndex] : 'transparent',
                border: isFilled ? 'none' : '1px dashed #cbd5e1'
              }}
            />
          );
        })}
      </div>

      {timeSpent && (
        <div className="absolute bottom-3 left-3">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-white/80 backdrop-blur-sm text-gray-700 shadow-sm">
            {timeSpent}
          </span>
        </div>
      )}
    </div>
  );
}

// 4. TravelMap - 3 hotel icons → venue pin connected by curved SVG paths
export function TravelMap({
  attendees,
  hotels,
  transfers,
  timeSpent
}: {
  attendees: number;
  hotels: number;
  transfers: number;
  timeSpent?: string;
}) {
  return (
    <div className="mt-3 py-12 px-10 rounded-2xl bg-gray-50 relative">
      <div className="relative w-full h-32">
        <svg width="100%" height="100%" viewBox="0 0 300 120" className="absolute inset-0">
          <defs>
            <linearGradient id="path-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>

          {/* Curved paths from hotels to venue */}
          <path d="M40 30 Q150 10, 260 60" stroke="url(#path-gradient)" strokeWidth="2" fill="none" opacity="0.6" />
          <path d="M40 60 Q150 50, 260 60" stroke="url(#path-gradient)" strokeWidth="2" fill="none" opacity="0.6" />
          <path d="M40 90 Q150 100, 260 60" stroke="url(#path-gradient)" strokeWidth="2" fill="none" opacity="0.6" />

          {/* Dot clusters along paths (attendees in transit) */}
          {Array.from({ length: 12 }, (_, i) => {
            const x = 80 + i * 15;
            const y = 40 + Math.sin(i) * 20;
            return <circle key={i} cx={x} cy={y} r="2" fill="#6366f1" opacity="0.5" />;
          })}
        </svg>

        {/* Hotel icons */}
        {Array.from({ length: hotels }, (_, i) => (
          <div
            key={`hotel-${i}`}
            className="absolute w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shadow-md"
            style={{ left: '20px', top: `${20 + i * 30}px` }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="4" width="12" height="10" fill="white" opacity="0.9" />
              <path d="M2 4 L8 1 L14 4" fill="white" />
            </svg>
          </div>
        ))}

        {/* Venue pin */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center shadow-lg">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 2C7 2 4 4 4 7C4 11 10 18 10 18C10 18 16 11 16 7C16 4 13 2 10 2Z" fill="white" />
            <circle cx="10" cy="7" r="2" fill="#8b5cf6" />
          </svg>
        </div>
      </div>

      {timeSpent && (
        <div className="absolute bottom-3 left-3">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-white/80 backdrop-blur-sm text-gray-700 shadow-sm">
            {timeSpent}
          </span>
        </div>
      )}
    </div>
  );
}
