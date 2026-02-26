import { useState, useEffect, useRef, useCallback } from "react";
import { IconCheckMark } from "@mirohq/design-system-icons";
import {
  type SelectOption,
  OPTION_COLORS,
  getOptionTextColor,
  getRandomOptionColor,
} from "../types";

interface MultiSelectCellProps {
  value: string; // JSON array string
  rowIndex: number;
  colIndex: number;
  isEditing: boolean;
  options: SelectOption[];
  onSave: (rowIndex: number, colIndex: number, value: string) => void;
  onUpdateOptions?: (colIndex: number, options: SelectOption[]) => void;
}

function parseMultiValue(val: string): string[] {
  if (!val) return [];
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Fallback: treat as single value
    return val ? [val] : [];
  }
}

export function MultiSelectCell({
  value,
  rowIndex,
  colIndex,
  isEditing,
  options,
  onSave,
  onUpdateOptions,
}: MultiSelectCellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedValues = parseMultiValue(value);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  const handleToggle = useCallback(
    (optionLabel: string) => {
      const newValues = selectedValues.includes(optionLabel)
        ? selectedValues.filter((v) => v !== optionLabel)
        : [...selectedValues, optionLabel];
      onSave(
        rowIndex,
        colIndex,
        newValues.length > 0 ? JSON.stringify(newValues) : ""
      );
    },
    [selectedValues, rowIndex, colIndex, onSave]
  );

  const handleCreateOption = useCallback(
    (label: string) => {
      const newOption: SelectOption = {
        label,
        color: getRandomOptionColor(),
      };
      onUpdateOptions?.(colIndex, [...options, newOption]);
      const newValues = [...selectedValues, label];
      onSave(rowIndex, colIndex, JSON.stringify(newValues));
      setSearch("");
    },
    [colIndex, options, selectedValues, rowIndex, onSave, onUpdateOptions]
  );

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const showCreateOption =
    search.trim() &&
    !options.some((o) => o.label.toLowerCase() === search.trim().toLowerCase());

  // Display mode
  if (!isOpen) {
    return (
      <div
        style={{
          padding: "4px 8px",
          fontSize: 12,
          minHeight: 28,
          lineHeight: "18px",
          cursor: isEditing ? "pointer" : "default",
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 3,
        }}
        onClick={() => {
          if (isEditing) setIsOpen(true);
        }}
      >
        {selectedValues.length > 0
          ? selectedValues.map((v) => {
              const opt = options.find((o) => o.label === v);
              return (
                <span
                  key={v}
                  style={{
                    display: "inline-block",
                    padding: "1px 8px",
                    borderRadius: 3,
                    fontSize: 11,
                    fontWeight: 500,
                    background: opt?.color ?? OPTION_COLORS[0].bg,
                    color: getOptionTextColor(
                      opt?.color ?? OPTION_COLORS[0].bg
                    ),
                    lineHeight: "18px",
                    maxWidth: "100%",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {v}
                </span>
              );
            })
          : isEditing
            ? "\u00A0"
            : null}
      </div>
    );
  }

  // Dropdown mode
  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <div
        style={{
          padding: "3px 8px",
          minHeight: 28,
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 3,
        }}
      >
        {selectedValues.map((v) => {
          const opt = options.find((o) => o.label === v);
          return (
            <span
              key={v}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 2,
                padding: "1px 6px",
                borderRadius: 3,
                fontSize: 11,
                fontWeight: 500,
                background: opt?.color ?? OPTION_COLORS[0].bg,
                color: getOptionTextColor(opt?.color ?? OPTION_COLORS[0].bg),
                lineHeight: "18px",
                cursor: "pointer",
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleToggle(v);
              }}
            >
              {v}
              <span style={{ fontSize: 10, opacity: 0.7 }}>&times;</span>
            </span>
          );
        })}
        <input
          ref={inputRef}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setIsOpen(false);
              setSearch("");
            }
            if (e.key === "Enter" && showCreateOption) {
              handleCreateOption(search.trim());
            }
            if (
              e.key === "Backspace" &&
              !search &&
              selectedValues.length > 0
            ) {
              // Remove last selected value
              handleToggle(selectedValues[selectedValues.length - 1]);
            }
            e.stopPropagation();
          }}
          onClick={(e) => e.stopPropagation()}
          placeholder={
            selectedValues.length > 0 ? "" : "Search or create..."
          }
          style={{
            flex: 1,
            minWidth: 60,
            border: "none",
            outline: "none",
            background: "transparent",
            fontSize: 12,
            color: "var(--color-gray-800)",
            padding: "2px 0",
            margin: 0,
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          background: "#ffffff",
          border: "1px solid var(--color-gray-200)",
          borderRadius: 6,
          boxShadow:
            "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
          zIndex: 50,
          maxHeight: 200,
          overflowY: "auto",
          padding: "4px 0",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {filteredOptions.map((opt) => {
          const isSelected = selectedValues.includes(opt.label);
          return (
            <button
              key={opt.label}
              onClick={() => handleToggle(opt.label)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                width: "100%",
                padding: "5px 10px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                textAlign: "left",
                fontSize: 12,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--color-gray-100)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 3,
                  border: isSelected
                    ? "none"
                    : "1.5px solid var(--color-gray-300)",
                  background: isSelected ? "#3b82f6" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {isSelected && (
                  <IconCheckMark css={{ width: 10, height: 10, color: '#ffffff' }} />
                )}
              </span>
              <span
                style={{
                  display: "inline-block",
                  padding: "1px 8px",
                  borderRadius: 3,
                  fontSize: 11,
                  fontWeight: 500,
                  background: opt.color,
                  color: getOptionTextColor(opt.color),
                  lineHeight: "18px",
                }}
              >
                {opt.label}
              </span>
            </button>
          );
        })}
        {showCreateOption && (
          <button
            onClick={() => handleCreateOption(search.trim())}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              width: "100%",
              padding: "5px 10px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              textAlign: "left",
              fontSize: 12,
              color: "var(--color-gray-500)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--color-gray-100)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <span>Create</span>
            <span
              style={{
                padding: "1px 8px",
                borderRadius: 3,
                fontSize: 11,
                fontWeight: 500,
                background: OPTION_COLORS[0].bg,
                color: OPTION_COLORS[0].text,
                lineHeight: "18px",
              }}
            >
              {search.trim()}
            </span>
          </button>
        )}
        {filteredOptions.length === 0 && !showCreateOption && (
          <div
            style={{
              padding: "8px 10px",
              fontSize: 12,
              color: "var(--color-gray-400)",
              textAlign: "center",
            }}
          >
            No options
          </div>
        )}
      </div>
    </div>
  );
}
