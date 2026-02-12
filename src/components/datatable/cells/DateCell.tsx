import { useState, useEffect, useRef, useCallback } from "react";
import { IconCalendarBlank } from "@mirohq/design-system-icons";

interface DateCellProps {
  value: string;
  rowIndex: number;
  colIndex: number;
  isEditing: boolean;
  onSave: (rowIndex: number, colIndex: number, value: string) => void;
}

function formatDate(val: string): string {
  if (!val) return "";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return val;
  }
}

/** Convert a date string to YYYY-MM-DD for the input[type=date] */
function toInputDate(val: string): string {
  if (!val) return "";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

export function DateCell({
  value,
  rowIndex,
  colIndex,
  isEditing,
  onSave,
}: DateCellProps) {
  const [isCellEditing, setIsCellEditing] = useState(false);
  const [cellValue, setCellValue] = useState(toInputDate(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isCellEditing) setCellValue(toInputDate(value));
  }, [value, isCellEditing]);

  useEffect(() => {
    if (isCellEditing && inputRef.current) {
      inputRef.current.focus();
      // Open the date picker
      inputRef.current.showPicker?.();
    }
  }, [isCellEditing]);

  const handleSave = useCallback(() => {
    onSave(rowIndex, colIndex, cellValue);
    setIsCellEditing(false);
  }, [rowIndex, colIndex, cellValue, onSave]);

  if (isCellEditing) {
    return (
      <input
        ref={inputRef}
        type="date"
        value={cellValue}
        onChange={(e) => {
          setCellValue(e.target.value);
          // Auto-save on date selection
          onSave(rowIndex, colIndex, e.target.value);
          setIsCellEditing(false);
        }}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setCellValue(toInputDate(value));
            setIsCellEditing(false);
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
          cursor: "pointer",
        }}
      />
    );
  }

  return (
    <div
      style={{
        padding: "5px 8px",
        fontSize: 12,
        color: value ? "#1f2937" : "#d1d5db",
        minHeight: 28,
        lineHeight: "18px",
        cursor: isEditing ? "text" : "default",
        display: "flex",
        alignItems: "center",
        gap: 4,
      }}
      onClick={() => {
        if (isEditing) setIsCellEditing(true);
      }}
    >
      {value && (
        <IconCalendarBlank css={{ width: 12, height: 12, flexShrink: 0, opacity: 0.5 }} />
      )}
      {formatDate(value) || (isEditing ? "\u00A0" : "")}
    </div>
  );
}
