interface PageHeaderProps {
  /** Title area — left/bottom-aligned content (title, subtitle, emoji, etc.) */
  children: React.ReactNode;
  /** Action buttons — right-aligned, vertically aligned to bottom of header */
  actions?: React.ReactNode;
  /** Optional top-right meta row (e.g. members, avatars on space pages) */
  meta?: React.ReactNode;
  /** Additional classes on the outer wrapper */
  className?: string;
}

export function PageHeader({ children, actions, meta, className }: PageHeaderProps) {
  return (
    <div className={`relative mt-4 pl-8 pr-4 ${className ?? ""}`}>
      {/* Meta row — top-right */}
      {meta && (
        <div className="absolute top-8 right-0 flex items-center gap-3">
          {meta}
        </div>
      )}

      {/* Main row: title area + actions */}
      <div className="flex items-center justify-between gap-8">
        <div className="min-w-0 flex-1">{children}</div>
        {actions && <div className="flex-shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
