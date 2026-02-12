import { useState, useEffect, useRef, useCallback } from "react";
import { IconCheckMark } from "@mirohq/design-system-icons";
import {
  type SelectOption,
  OPTION_COLORS,
  getOptionTextColor,
  getRandomOptionColor,
} from "../types";

interface SelectCellProps {
  value: string;
  rowIndex: number;
  colIndex: number;
  isEditing: boolean;
  options: SelectOption[];
  onSave: (rowIndex: number, colIndex: number, value: string) => void;
  onUpdateOptions?: (colIndex: number, options: SelectOption[]) => void;
}

export function SelectCell({
  value,
  rowIndex,
  colIndex,
  isEditing,
  options,
  onSave,
  onUpdateOptions,
}: SelectCellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleSelect = useCallback(
    (optionLabel: string) => {
      onSave(rowIndex, colIndex, value === optionLabel ? "" : optionLabel);
      setIsOpen(false);
      setSearch("");
    },
    [rowIndex, colIndex, value, onSave]
  );

  const handleCreateOption = useCallback(
    (label: string) => {
      const newOption: SelectOption = {
        label,
        color: getRandomOptionColor(),
      };
      onUpdateOptions?.(colIndex, [...options, newOption]);
      onSave(rowIndex, colIndex, label);
      setIsOpen(false);
      setSearch("");
    },
    [colIndex, options, rowIndex, onSave, onUpdateOptions]
  );

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = options.find((o) => o.label === value);
  const showCreateOption =
    search.trim() &&
    !options.some((o) => o.label.toLowerCase() === search.trim().toLowerCase());

  // Display mode
  if (!isOpen) {
    return (
      <div
        style={{
          padding: "5px 8px",
          fontSize: 12,
          minHeight: 28,
          lineHeight: "18px",
          cursor: isEditing ? "pointer" : "default",
          display: "flex",
          alignItems: "center",
        }}
        onClick={() => {
          if (isEditing) setIsOpen(true);
        }}
      >
        {selectedOption ? (
          <span
            style={{
              display: "inline-block",
              padding: "1px 8px",
              borderRadius: 3,
              fontSize: 11,
              fontWeight: 500,
              background: selectedOption.color,
              color: getOptionTextColor(selectedOption.color),
              lineHeight: "18px",
              maxWidth: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {selectedOption.label}
          </span>
        ) : value ? (
          <span style={{ color: "#1f2937" }}>{value}</span>
        ) : isEditing ? (
          "\u00A0"
        ) : null}
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
        }}
      >
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
              e.key === "Enter" &&
              filteredOptions.length === 1 &&
              !showCreateOption
            ) {
              handleSelect(filteredOptions[0].label);
            }
            e.stopPropagation();
          }}
          onClick={(e) => e.stopPropagation()}
          placeholder="Search or create..."
          style={{
            width: "100%",
            border: "none",
            outline: "none",
            background: "transparent",
            fontSize: 12,
            color: "#1f2937",
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
          border: "1px solid #e5e7eb",
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
        {filteredOptions.map((opt) => (
          <button
            key={opt.label}
            onClick={() => handleSelect(opt.label)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              width: "100%",
              padding: "5px 10px",
              border: "none",
              background: value === opt.label ? "#f3f4f6" : "transparent",
              cursor: "pointer",
              textAlign: "left",
              fontSize: 12,
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "#f3f4f6")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background =
                value === opt.label ? "#f3f4f6" : "transparent")
            }
          >
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
            {value === opt.label && (
              <IconCheckMark css={{ width: 12, height: 12, marginLeft: 'auto', flexShrink: 0, color: '#374151' }} />
            )}
          </button>
        ))}
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
              color: "#6b7280",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "#f3f4f6")
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
              color: "#9ca3af",
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
