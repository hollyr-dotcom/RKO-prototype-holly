"use client";

import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Reorder, useDragControls, motion, AnimatePresence } from "framer-motion";
import { useSidebar } from "@/hooks/useSidebar";
import { IconDotsThreeVertical, IconTrash } from "@mirohq/design-system-icons";

export type NavListItem = {
  id: string;
  label: string;
  href: string;
  icon?: ReactNode; // pre-rendered icon (initial letter box, emoji, etc.)
};

export type NavMenuAction = {
  label: string;
  icon?: ReactNode;
  onClick: (id: string) => void;
  danger?: boolean;
};

type NavListProps = {
  items: NavListItem[];
  isActive: (item: NavListItem) => boolean;
  onReorder: (reorderedIds: string[]) => void;
  onRename?: (id: string, newName: string) => void;
  onDelete?: (id: string) => void;
  menuActions?: NavMenuAction[];
  emptyMessage?: string;
  /** Override text color for items (both active and inactive) */
  itemColor?: string;
};

export function NavList({
  items,
  isActive,
  onReorder,
  onRename,
  onDelete,
  menuActions,
  emptyMessage = "Nothing here yet",
  itemColor,
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
          onDelete={onDelete}
          menuActions={menuActions}
          itemColor={itemColor}
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
  onDelete,
  menuActions,
  itemColor,
  onDragEnd,
}: {
  item: NavListItem;
  isActive: boolean;
  navPalette: NavPalette;
  itemColor?: string;
  onRename?: (id: string, newName: string) => void;
  onDelete?: (id: string) => void;
  menuActions?: NavMenuAction[];
  onDragEnd: () => void;
}) {
  const dragControls = useDragControls();
  const isDragging = useRef(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(item.label);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);

  // Close menu on click outside
  const handleMenuClickOutside = useCallback((e: MouseEvent) => {
    if (
      menuRef.current &&
      !menuRef.current.contains(e.target as Node) &&
      menuTriggerRef.current &&
      !menuTriggerRef.current.contains(e.target as Node)
    ) {
      setMenuOpen(false);
    }
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.addEventListener("mousedown", handleMenuClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleMenuClickOutside);
  }, [menuOpen, handleMenuClickOutside]);

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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setMenuOpen(false); }}
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
          color: itemColor ?? (isActive ? navPalette.textPrimary : navPalette.textSecondary),
          fontWeight: isActive ? 500 : 400,
          backgroundColor: isActive || isHovered ? navPalette.hoverBg : "transparent",
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
          <span className="truncate flex-1" onDoubleClick={handleDoubleClick}>
            {item.label}
          </span>
        )}

        {/* Three-dot overflow — visible on hover */}
        {!!(menuActions?.length || onDelete) && (isHovered || menuOpen) && !isEditing && (
          <span className="relative flex-shrink-0 ml-auto">
            <button
              ref={menuTriggerRef}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMenuOpen((prev) => !prev);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className="flex items-center justify-center w-5 h-5 rounded hover:bg-black/10 transition-colors"
              style={{ color: navPalette.textSecondary }}
            >
              <IconDotsThreeVertical css={{ width: 16, height: 16 }} />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  ref={menuRef}
                  className="absolute right-0 top-full mt-1 z-[600] min-w-[160px] rounded-lg overflow-hidden bg-white border border-gray-200 shadow-elevated"
                  initial={{ opacity: 0, y: -4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.15, ease: [0.2, 0, 0, 1] } }}
                  exit={{ opacity: 0, y: -4, scale: 0.97, transition: { duration: 0.1, ease: [0.3, 0, 1, 1] } }}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <div className="py-1">
                    {menuActions && menuActions.length > 0 ? (
                      menuActions.map((action, i) => (
                        <button
                          key={i}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setMenuOpen(false);
                            action.onClick(item.id);
                          }}
                          className="w-full flex items-center gap-2 text-left cursor-pointer border-none bg-transparent"
                          style={{ padding: "7px 12px", fontSize: 13, color: action.danger ? "#dc2626" : "#374151" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = action.danger ? "#fef2f2" : "#f3f4f6")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          {action.icon && (
                            <span className="flex items-center justify-center w-3.5 h-3.5 flex-shrink-0">
                              {action.icon}
                            </span>
                          )}
                          {action.label}
                        </button>
                      ))
                    ) : onDelete ? (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setMenuOpen(false);
                          onDelete(item.id);
                        }}
                        className="w-full flex items-center gap-2 text-left cursor-pointer border-none bg-transparent"
                        style={{ padding: "7px 12px", fontSize: 13, color: "#dc2626" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#fef2f2")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <IconTrash css={{ width: 14, height: 14, flexShrink: 0 }} />
                        Delete board
                      </button>
                    ) : null}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </span>
        )}
      </Link>
    </Reorder.Item>
  );
}
