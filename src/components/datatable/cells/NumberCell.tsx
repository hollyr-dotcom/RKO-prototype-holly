import { useState, useEffect, useRef, useCallback } from "react";

interface NumberCellProps {
  value: string;
  rowIndex: number;
  colIndex: number;
  isEditing: boolean;
  onSave: (rowIndex: number, colIndex: number, value: string) => void;
}

function formatNumber(val: string): string {
  if (!val) return "";
  const num = parseFloat(val);
  if (isNaN(num)) return val;
  // Use locale formatting for display
  return num.toLocaleString(undefined, { maximumFractionDigits: 10 });
}

export function NumberCell({
  value,
  rowIndex,
  colIndex,
  isEditing,
  onSave,
}: NumberCellProps) {
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
    // Normalize to a clean numeric string
    const trimmed = cellValue.trim();
    const num = parseFloat(trimmed);
    const saveValue = trimmed === "" ? "" : isNaN(num) ? trimmed : String(num);
    onSave(rowIndex, colIndex, saveValue);
    setIsCellEditing(false);
  }, [rowIndex, colIndex, cellValue, onSave]);

  if (isCellEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={cellValue}
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
          textAlign: "right",
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
        textAlign: "right",
        fontVariantNumeric: "tabular-nums",
      }}
      onClick={() => {
        if (isEditing) setIsCellEditing(true);
      }}
    >
      {formatNumber(value) || (isEditing ? "\u00A0" : "")}
    </div>
  );
}
