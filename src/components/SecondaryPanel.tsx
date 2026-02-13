"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { IconChevronDown, IconPlus, IconViewSideLeft } from "@mirohq/design-system-icons";
import { useSidebar } from "@/hooks/useSidebar";
import { SECONDARY_WIDTH } from "@/providers/SidebarProvider";

type Canvas = {
  id: string;
  spaceId: string;
  name: string;
  emoji?: string;
};

type Space = {
  id: string;
  name: string;
  description: string;
};

// Static capabilities/pages for a space
const defaultCapabilities = [
  { id: "overview", label: "Overview" },
  { id: "agenda", label: "Agenda" },
  { id: "attendees", label: "Attendees" },
  { id: "expenses", label: "Expenses" },
];

// Expandable capability groups
const expandableCapabilities = [
  {
    id: "venue",
    label: "Venue & Logistic",
    // children: [
    //   { id: "floorplan", label: "Floorplan" },
    //   { id: "registration", label: "Registration" },
    // ],
  },
];

const trailingCapabilities = [
  { id: "speaker-program", label: "Speaker Program" },
];

// Motion: stagger container + items (spring.snappy: stiffness 400, damping 30)
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, x: -8 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring" as const, stiffness: 400, damping: 30 },
  },
};

export function SecondaryPanel() {
  const pathname = usePathname();
  const params = useParams<{ spaceId: string; canvasId?: string }>();
  const { toggleSidebar } = useSidebar();

  const [space, setSpace] = useState<Space | null>(null);
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Derive which capability is active from the route.
  // On a canvas route, no capability is selected. On the space root, default to "overview".
  const isOnCanvas = pathname.includes("/canvas/");
  const [selectedCapability, setSelectedCapability] = useState<string | null>("overview");

  // Clear capability selection when navigating to a canvas, restore when back on space root
  useEffect(() => {
    if (isOnCanvas) {
      setSelectedCapability(null);
    } else {
      setSelectedCapability((prev) => prev ?? "overview");
    }
  }, [isOnCanvas]);

  // Fetch space data
  useEffect(() => {
    if (!params.spaceId) return;
    let cancelled = false;

    fetch(`/api/spaces/${params.spaceId}`)
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (!cancelled && data) {
          setSpace(data);
          setCanvases(data.canvases || []);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [params.spaceId]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const spaceName = space?.name || "Space";

  return (
    <aside
      className="h-full flex-shrink-0 overflow-hidden bg-white rounded-l-3xl shadow-[0px_0px_8px_0px_rgba(34,36,40,0.06),0px_12px_32px_0px_rgba(34,36,40,0.1)]"
      style={{ width: SECONDARY_WIDTH }}
    >
      <div className="h-full flex flex-col">
        {/* Space header */}
        <div className="flex items-center px-6 pt-6 pb-5">
          <h2 className="flex-1 text-md font-semibold text-gray-900 truncate">
            {spaceName}
          </h2>
          {/* <button
            onClick={toggleSidebar}
            title="Collapse sidebar"
            className="flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-lg hover:bg-gray-200/60 transition-colors duration-200"
          >
            <IconViewSideLeft css={{ width: 20, height: 20 }} />
          </button> */}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 pt-2">
          {/* Capabilities list */}
          <motion.div
            className="flex flex-col gap-0.5"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {defaultCapabilities.map((cap) => (
              <motion.div key={cap.id} variants={staggerItem}>
                <CapabilityItem
                  label={cap.label}
                  isSelected={selectedCapability === cap.id}
                  onClick={() => setSelectedCapability(cap.id)}
                  href={cap.id === "overview" ? `/space/${params.spaceId}` : undefined}
                />
              </motion.div>
            ))}

            {/* Expandable groups */}
            {/* {expandableCapabilities.map((group) => {
              const isExpanded = expandedGroups.has(group.id);
              return (
                <motion.div key={group.id} variants={staggerItem}>
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="w-full flex items-center gap-2 h-8 px-4 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors duration-200"
                  >
                    <IconChevronDown
                      css={{
                        width: 16,
                        height: 16,
                        transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)",
                        transition: "transform 0.2s ease",
                      }}
                    />
                    <span className="flex-1 text-left truncate">{group.label}</span>
                  </button>
                  {isExpanded &&
                    group.children.map((child) => (
                      <CapabilityItem
                        key={child.id}
                        label={child.label}
                        isSelected={selectedCapability === child.id}
                        onClick={() => setSelectedCapability(child.id)}
                        indented
                      />
                    ))}
                </motion.div>
              );
            })} */}

            {trailingCapabilities.map((cap) => (
              <motion.div key={cap.id} variants={staggerItem}>
                <CapabilityItem
                  label={cap.label}
                  isSelected={selectedCapability === cap.id}
                  onClick={() => setSelectedCapability(cap.id)}
                />
              </motion.div>
            ))}
          </motion.div>

          {/* Divider */}
          <div className="my-8  border-gray-200" />

          {/* Boards section */}
          <div className="flex items-center h-8 px-3">
            <span className="flex-1 text-xs font-medium text-gray-400 uppercase tracking-wider">
              Boards
            </span>
            <button
              className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-200/60 transition-colors duration-200"
              title="Add board"
            >
              <IconPlus css={{ width: 16, height: 16 }} />
            </button>
          </div>

          {/* Board items — only render stagger when data is loaded */}
          {canvases.length > 0 ? (
            <motion.div
              className="flex flex-col gap-0.5"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {canvases.map((canvas) => {
                const canvasPath = `/space/${params.spaceId}/canvas/${canvas.id}`;
                const isActive = pathname === canvasPath;

                return (
                  <motion.div key={canvas.id} variants={staggerItem}>
                    <Link
                      href={canvasPath}
                      className={`flex items-center gap-3 h-8 px-3 rounded-lg text-sm transition-colors duration-200 hover:bg-gray-100 ${
                        isActive
                          ? "bg-gray-100 text-gray-900 font-medium"
                          : "text-gray-600"
                      }`}
                    >
                      <span className="w-5 h-5 text-base leading-5 text-center flex-shrink-0">
                        {canvas.emoji || "📋"}
                      </span>
                      <span className="truncate">{canvas.name}</span>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <p className="px-3 text-sm text-gray-400">No boards yet</p>
          )}
        </div>
      </div>
    </aside>
  );
}

function CapabilityItem({
  label,
  isSelected,
  onClick,
  indented = false,
  href,
}: {
  label: string;
  isSelected: boolean;
  onClick: () => void;
  indented?: boolean;
  href?: string;
}) {
  const className = `w-full flex items-center h-8 rounded-lg text-sm transition-colors duration-200 ${
    indented ? "pl-12 pr-3" : "px-4"
  } ${
    isSelected
      ? "bg-gray-100 text-gray-900 font-medium"
      : "text-gray-600 hover:bg-gray-100"
  }`;

  if (href) {
    return (
      <Link href={href} onClick={onClick} className={className}>
        <span className="truncate text-left">{label}</span>
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={className}>
      <span className="truncate text-left">{label}</span>
    </button>
  );
}
