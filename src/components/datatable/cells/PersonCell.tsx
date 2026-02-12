import { useState, useEffect, useRef, useCallback } from "react";

interface PersonCellProps {
  value: string;
  rowIndex: number;
  colIndex: number;
  isEditing: boolean;
  onSave: (rowIndex: number, colIndex: number, value: string) => void;
}

// Simple color generation from string
function stringToColor(str: string): string {
  if (!str) return "#9ca3af";
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 55%)`;
}

function getInitials(name: string): string {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "";
  return (
    (parts[0][0]?.toUpperCase() ?? "") +
    (parts[parts.length - 1][0]?.toUpperCase() ?? "")
  );
}

export function PersonCell({
  value,
  rowIndex,
  colIndex,
  isEditing,
  onSave,
}: PersonCellProps) {
  const [isCellEditing, setIsCellEditing] = useState(false);
  const [cellValue, setCellValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isCellEditing) setCellValue(value);
  }, [value, isCellEditing]);

  useEffect(() => {
    if (isCellEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isCellEditing]);

  const handleSave = useCallback(() => {
    onSave(rowIndex, colIndex, cellValue.trim());
    setIsCellEditing(false);
  }, [rowIndex, colIndex, cellValue, onSave]);

  if (isCellEditing) {
    return (
      <input
        ref={inputRef}
        value={cellValue}
        placeholder="Name..."
        onChange={(e) => setCellValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
          if (e.key === "Escape") {
            setCellValue(value);
            setIsCellEditing(false);
          }
          if (e.key === "Tab") {
            e.preventDefault();
            handleSave();
          }
          e.stopPropagation();
        }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          border: "none",
          outline: "none",
          background: "transparent",
          fontSize: 12,
          color: "#1f2937",
          padding: "5px 8px",
          margin: 0,
          boxSizing: "border-box",
        }}
      />
    );
  }

  return (
    <div
      style={{
        padding: "4px 8px",
        fontSize: 12,
        color: value ? "#1f2937" : "#d1d5db",
        minHeight: 28,
        lineHeight: "18px",
        cursor: isEditing ? "pointer" : "default",
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
      onClick={() => {
        if (isEditing) setIsCellEditing(true);
      }}
    >
      {value ? (
        <>
          <span
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: stringToColor(value),
              color: "#ffffff",
              fontSize: 9,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              lineHeight: 1,
            }}
          >
            {getInitials(value)}
          </span>
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {value}
          </span>
        </>
      ) : isEditing ? (
        "\u00A0"
      ) : null}
    </div>
  );
}
