import { useState, useRef, useEffect } from "react";
import type { ColumnType, ColumnConfig } from "./types";
import { COLUMN_TYPE_INFO } from "./types";
import { ColumnTypeIcon } from "./ColumnTypeIcons";
import { ColumnTypePicker } from "./ColumnTypePicker";
import { IconChevronUpDown, IconTrash } from "@mirohq/design-system-icons";

interface ColumnHeaderMenuProps {
  column: ColumnConfig;
  colIndex: number;
  onChangeType: (colIndex: number, type: ColumnType) => void;
  onDeleteColumn: (colIndex: number) => void;
  onClose: () => void;
  style?: React.CSSProperties;
}

export function ColumnHeaderMenu({
  column,
  colIndex,
  onChangeType,
  onDeleteColumn,
  onClose,
  style,
}: ColumnHeaderMenuProps) {
  const [showTypePicker, setShowTypePicker] = useState(false);
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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  if (showTypePicker) {
    return (
      <ColumnTypePicker
        onSelect={(type) => {
          onChangeType(colIndex, type);
          onClose();
        }}
        onClose={onClose}
        style={style}
      />
    );
  }

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
        width: 200,
        padding: "6px 0",
        ...style,
      }}
    >
      {/* Current type display */}
      <div
        style={{
          padding: "6px 12px",
          fontSize: 11,
          color: "#9ca3af",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <ColumnTypeIcon type={column.type} size={14} />
        <span>{COLUMN_TYPE_INFO[column.type].label}</span>
      </div>

      <div
        style={{
          height: 1,
          background: "#f3f4f6",
          margin: "4px 0",
        }}
      />

      {/* Change type */}
      <button
        onClick={() => setShowTypePicker(true)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: "100%",
          padding: "7px 12px",
          border: "none",
          background: "transparent",
          cursor: "pointer",
          textAlign: "left",
          fontSize: 13,
          color: "#374151",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
        onMouseLeave={(e) =>
          (e.currentTarget.style.background = "transparent")
        }
      >
        <IconChevronUpDown css={{ width: 14, height: 14, flexShrink: 0, color: '#6b7280' }} />
        Change type
      </button>

      <div
        style={{
          height: 1,
          background: "#f3f4f6",
          margin: "4px 0",
        }}
      />

      {/* Delete column */}
      <button
        onClick={() => {
          onDeleteColumn(colIndex);
          onClose();
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: "100%",
          padding: "7px 12px",
          border: "none",
          background: "transparent",
          cursor: "pointer",
          textAlign: "left",
          fontSize: 13,
          color: "#dc2626",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#fef2f2")}
        onMouseLeave={(e) =>
          (e.currentTarget.style.background = "transparent")
        }
      >
        <IconTrash css={{ width: 14, height: 14, flexShrink: 0 }} />
        Delete column
      </button>
    </div>
  );
}
