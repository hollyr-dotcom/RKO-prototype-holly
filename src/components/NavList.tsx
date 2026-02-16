"use client";

import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Reorder, useDragControls } from "framer-motion";
import { useSidebar } from "@/hooks/useSidebar";

export type NavListItem = {
  id: string;
  label: string;
  href: string;
  icon?: ReactNode; // pre-rendered icon (initial letter box, emoji, etc.)
};

type NavListProps = {
  items: NavListItem[];
  isActive: (item: NavListItem) => boolean;
  onReorder: (reorderedIds: string[]) => void;
  onRename?: (id: string, newName: string) => void;
  emptyMessage?: string;
};

export function NavList({
  items,
  isActive,
  onReorder,
  onRename,
  emptyMessage = "Nothing here yet",
}: NavListProps) {
  const { navPalette } = useSidebar();

  // Local ordered state — kept in sync with incoming items
  const [orderedItems, setOrderedItems] = useState<NavListItem[]>(items);

  useEffect(() => {
    setOrderedItems(items);
  }, [items]);

  if (orderedItems.length === 0) {
    return (
      <p className="px-3 text-sm" style={{ color: navPalette.iconMuted }}>
        {emptyMessage}
      </p>
    );
  }

  return (
    <Reorder.Group
      axis="y"
      values={orderedItems}
      onReorder={(newOrder) => {
        setOrderedItems(newOrder);
      }}
      className="flex flex-col gap-0.5"
      as="div"
    >
      {orderedItems.map((item) => (
        <NavListRow
          key={item.id}
          item={item}
          isActive={isActive(item)}
          navPalette={navPalette}
          onRename={onRename}
          onDragEnd={() => {
            // Fire reorder callback with the current ordered IDs
            onReorder(orderedItems.map((i) => i.id));
          }}
        />
      ))}
    </Reorder.Group>
  );
}

type NavPalette = ReturnType<typeof useSidebar>["navPalette"];

function NavListRow({
  item,
  isActive,
  navPalette,
  onRename,
  onDragEnd,
}: {
  item: NavListItem;
  isActive: boolean;
  navPalette: NavPalette;
  onRename?: (id: string, newName: string) => void;
  onDragEnd: () => void;
}) {
  const dragControls = useDragControls();
  const isDragging = useRef(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(item.label);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync edit value when label changes externally
  useEffect(() => {
    if (!isEditing) {
      setEditValue(item.label);
    }
  }, [item.label, isEditing]);

  // Focus and select all text when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== item.label && onRename) {
      onRename(item.id, trimmed);
    } else {
      setEditValue(item.label);
    }
    setIsEditing(false);
  }, [editValue, item.id, item.label, onRename]);

  const handleCancel = useCallback(() => {
    setEditValue(item.label);
    setIsEditing(false);
  }, [item.label]);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!onRename) return;
      e.preventDefault();
      e.stopPropagation();
      setIsEditing(true);
    },
    [onRename]
  );

  return (
    <Reorder.Item
      value={item}
      dragListener={!isEditing}
      dragControls={dragControls}
      onDragStart={() => {
        isDragging.current = true;
      }}
      onDragEnd={() => {
        requestAnimationFrame(() => {
          isDragging.current = false;
        });
        onDragEnd();
      }}
      as="div"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      whileDrag={{
        scale: 1.02,
        boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
        borderRadius: "8px",
        zIndex: 50,
      }}
      style={{ position: "relative" }}
    >
      <Link
        href={item.href}
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        onClick={(e) => {
          if (isDragging.current || isEditing) e.preventDefault();
        }}
        className="flex items-center gap-3 h-9 px-3 rounded-lg text-sm transition-colors duration-200"
        style={{
          color: isActive ? navPalette.textPrimary : navPalette.textSecondary,
          fontWeight: isActive ? 500 : 400,
          backgroundColor: isActive ? navPalette.hoverBg : "transparent",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = navPalette.hoverBg;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = isActive
            ? navPalette.hoverBg
            : "transparent";
        }}
      >
        {item.icon && (
          <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">
            {item.icon}
          </span>
        )}
        {isEditing ? (
          <input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSave();
              }
              if (e.key === "Escape") {
                e.preventDefault();
                handleCancel();
              }
              e.stopPropagation();
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="truncate bg-transparent outline-none border-none p-0 m-0 w-full"
            style={{
              color: "inherit",
              font: "inherit",
              lineHeight: "inherit",
            }}
          />
        ) : (
          <span className="truncate" onDoubleClick={handleDoubleClick}>
            {item.label}
          </span>
        )}
      </Link>
    </Reorder.Item>
  );
}
