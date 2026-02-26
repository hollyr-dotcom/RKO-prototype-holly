import { useState, useEffect, useRef, useCallback } from "react";

interface TextCellProps {
  value: string;
  rowIndex: number;
  colIndex: number;
  isEditing: boolean;
  onSave: (rowIndex: number, colIndex: number, value: string) => void;
}

export function TextCell({
  value,
  rowIndex,
  colIndex,
  isEditing,
  onSave,
}: TextCellProps) {
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
    onSave(rowIndex, colIndex, cellValue);
    setIsCellEditing(false);
  }, [rowIndex, colIndex, cellValue, onSave]);

  if (isCellEditing) {
    return (
      <input
        ref={inputRef}
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
          color: "var(--color-gray-800)",
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
        padding: "5px 8px",
        fontSize: 12,
        color: value ? "var(--color-gray-800)" : "var(--color-gray-300)",
        minHeight: 28,
        lineHeight: "18px",
        cursor: isEditing ? "text" : "default",
      }}
      onClick={() => {
        if (isEditing) setIsCellEditing(true);
      }}
    >
      {value || (isEditing ? "\u00A0" : "")}
    </div>
  );
}
