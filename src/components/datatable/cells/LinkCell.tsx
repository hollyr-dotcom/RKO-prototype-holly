import { useState, useEffect, useRef, useCallback } from "react";
import { IconLink } from "@mirohq/design-system-icons";

interface LinkCellProps {
  value: string;
  rowIndex: number;
  colIndex: number;
  isEditing: boolean;
  onSave: (rowIndex: number, colIndex: number, value: string) => void;
}

function isValidUrl(str: string): boolean {
  if (!str) return false;
  try {
    new URL(str.startsWith("http") ? str : `https://${str}`);
    return true;
  } catch {
    return false;
  }
}

function getDisplayUrl(str: string): string {
  if (!str) return "";
  try {
    const url = new URL(str.startsWith("http") ? str : `https://${str}`);
    return url.hostname + (url.pathname !== "/" ? url.pathname : "");
  } catch {
    return str;
  }
}

function getFullUrl(str: string): string {
  if (!str) return "";
  return str.startsWith("http") ? str : `https://${str}`;
}

export function LinkCell({
  value,
  rowIndex,
  colIndex,
  isEditing,
  onSave,
}: LinkCellProps) {
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
        type="url"
        value={cellValue}
        placeholder="https://"
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

  const hasLink = value && isValidUrl(value);

  return (
    <div
      style={{
        padding: "5px 8px",
        fontSize: 12,
        color: hasLink ? "#337ea9" : value ? "var(--color-gray-800)" : "var(--color-gray-300)",
        minHeight: 28,
        lineHeight: "18px",
        cursor: isEditing ? "text" : hasLink ? "pointer" : "default",
        display: "flex",
        alignItems: "center",
        gap: 4,
        overflow: "hidden",
      }}
      onClick={(e) => {
        if (isEditing) {
          setIsCellEditing(true);
        } else if (hasLink) {
          e.stopPropagation();
          window.open(getFullUrl(value), "_blank", "noopener");
        }
      }}
    >
      {hasLink && (
        <IconLink css={{ width: 12, height: 12, flexShrink: 0 }} />
      )}
      <span
        style={{
          textDecoration: hasLink ? "underline" : "none",
          textUnderlineOffset: 2,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {hasLink ? getDisplayUrl(value) : value || (isEditing ? "\u00A0" : "")}
      </span>
    </div>
  );
}
