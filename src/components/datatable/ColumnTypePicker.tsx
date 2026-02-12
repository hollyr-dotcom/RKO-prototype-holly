import { useRef, useEffect } from "react";
import type { ColumnType } from "./types";
import { COLUMN_TYPE_INFO } from "./types";
import { ColumnTypeIcon } from "./ColumnTypeIcons";

const COLUMN_TYPE_ORDER: ColumnType[] = [
  "text",
  "number",
  "select",
  "multiSelect",
  "date",
  "person",
  "link",
  "formula",
  "relatesTo",
  "rollup",
];

interface ColumnTypePickerProps {
  onSelect: (type: ColumnType) => void;
  onClose: () => void;
  /** Position the popover relative to a parent */
  style?: React.CSSProperties;
}

export function ColumnTypePicker({
  onSelect,
  onClose,
  style,
}: ColumnTypePickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  // Close on escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        position: "absolute",
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        boxShadow:
          "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
        zIndex: 100,
        width: 220,
        padding: "6px 0",
        ...style,
      }}
    >
      <div
        style={{
          padding: "6px 12px 4px",
          fontSize: 11,
          fontWeight: 600,
          color: "#9ca3af",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        Column type
      </div>
      {COLUMN_TYPE_ORDER.map((type) => {
        const info = COLUMN_TYPE_INFO[type];
        return (
          <button
            key={type}
            onClick={() => onSelect(type)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              width: "100%",
              padding: "7px 12px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              textAlign: "left",
              fontSize: 13,
              color: "#374151",
              lineHeight: "20px",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "#f3f4f6")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <span style={{ color: "#6b7280", display: "flex" }}>
              <ColumnTypeIcon type={type} size={16} />
            </span>
            <span>{info.label}</span>
          </button>
        );
      })}
    </div>
  );
}
