import { IconChevronRight } from "@mirohq/design-system-icons";

interface RelatesToCellProps {
  value: string;
  relatedTableId?: string;
}

export function RelatesToCell({ value }: RelatesToCellProps) {
  // Parse value as JSON array of related items
  let items: string[] = [];
  if (value) {
    try {
      const parsed = JSON.parse(value);
      items = Array.isArray(parsed) ? parsed : [value];
    } catch {
      items = value ? [value] : [];
    }
  }

  return (
    <div
      style={{
        padding: "4px 8px",
        fontSize: 12,
        minHeight: 28,
        lineHeight: "18px",
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 3,
      }}
    >
      {items.length > 0 ? (
        items.map((item, i) => (
          <span
            key={i}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              padding: "1px 8px",
              borderRadius: 3,
              fontSize: 11,
              fontWeight: 500,
              background: "var(--color-gray-100)",
              color: "var(--color-gray-700)",
              lineHeight: "18px",
            }}
          >
            <IconChevronRight css={{ width: 10, height: 10, flexShrink: 0, opacity: 0.5 }} />
            {item}
          </span>
        ))
      ) : (
        <span style={{ color: "var(--color-gray-300)", fontStyle: "italic", fontSize: 11 }}>
          Relates to
        </span>
      )}
    </div>
  );
}
