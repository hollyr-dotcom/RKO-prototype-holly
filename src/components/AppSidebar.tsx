"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useSidebar } from "@/hooks/useSidebar";
import { IconMiroMark, IconSidebarGlobalOpen, IconSidebarGlobalClosed, IconChatTwo, IconBoard, IconCheckBoxLines, IconHouse } from "@mirohq/design-system-icons";

const navItems = [
  { label: "Home", href: "/", icon: HomeIcon },
  { label: "Chats", href: "#", icon: ChatIcon },
  { label: "Tasks", href: "#", icon: TasksIcon },
];

type Space = {
  id: string;
  name: string;
  description: string;
  icon: string;
  canvases: string[];
};

type Canvas = {
  id: string;
  spaceId: string;
  name: string;
};


// Layout math:
// Collapsed = 52px. Nav/header padding = px-1.5 (6px each side).
// Content area = 52 - 12 = 40px. Icon slot = w-10 (40px).
// → Icons are always centered at 26px from sidebar left edge.
// → overflow-hidden on each item clips text at the 40px boundary.

export function AppSidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar, sidebarWidth } = useSidebar();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [expandedSpaceIds, setExpandedSpaceIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    Promise.all([
      fetch("/data/spaces.json").then(res => res.json()),
      fetch("/data/canvases.json").then(res => res.json()),
    ]).then(([spacesData, canvasesData]) => {
      const loadedSpaces = spacesData.spaces || [];
      setSpaces(loadedSpaces);
      setCanvases(canvasesData.canvases || []);

      const pathParts = pathname.split('/');
      if (pathParts[1] === 'space' && pathParts[2]) {
        setExpandedSpaceIds(new Set([pathParts[2]]));
      } else {
        setExpandedSpaceIds(new Set(loadedSpaces.map((s: Space) => s.id)));
      }
    });
  }, [pathname]);

  const toggleSpace = (spaceId: string) => {
    setExpandedSpaceIds(prev => {
      const next = new Set(prev);
      if (next.has(spaceId)) {
        next.delete(spaceId);
      } else {
        next.add(spaceId);
      }
      return next;
    });
  };

  return (
    <aside
      className="h-full bg-white border-r border-gray-200 flex flex-col overflow-hidden flex-shrink-0"
      style={{ width: sidebarWidth, transition: 'width 0.25s cubic-bezier(0.25, 0.1, 0.25, 1)' }}
    >
      {/* Header */}
      <div className="px-1.5 py-4 flex items-center overflow-hidden">
        <div className="w-10 flex items-center justify-center flex-shrink-0 relative group">
          {isCollapsed ? (
            <button
              onClick={toggleSidebar}
              title="Expand sidebar"
              className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center relative"
            >
              <IconMiroMark css={{ width: 16, height: 16, color: 'white' }} />
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <IconSidebarGlobalClosed css={{ width: 16, height: 16, color: 'white' }} />
              </div>
            </button>
          ) : (
            <Link href="/">
              <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center">
                <IconMiroMark css={{ width: 16, height: 16, color: 'white' }} />
              </div>
            </Link>
          )}
        </div>
        <span
          className="text-sm font-semibold text-gray-900 whitespace-nowrap flex-1 ml-2 transition-opacity duration-200"
          style={{ opacity: isCollapsed ? 0 : 1 }}
        >
          Canvas
        </span>
        <button
          onClick={toggleSidebar}
          title="Collapse sidebar"
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 flex-shrink-0 transition-opacity duration-200"
          style={{ opacity: isCollapsed ? 0 : 1 }}
        >
          <IconSidebarGlobalOpen css={{ width: 16, height: 16, transform: 'rotate(0deg)' }} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-1.5">
        <ul className="space-y-0.5 mb-4">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  title={isCollapsed ? item.label : undefined}
                  className={`flex items-center py-2 rounded-lg text-sm transition-colors overflow-hidden ${
                    isActive
                      ? "bg-gray-100 text-gray-900 font-medium"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <div className="w-10 flex items-center justify-center flex-shrink-0">
                    <item.icon active={isActive} />
                  </div>
                  <span
                    className="whitespace-nowrap transition-opacity duration-200"
                    style={{ opacity: isCollapsed ? 0 : 1 }}
                  >
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Spaces section */}
        {spaces.length > 0 && (
          <div
            className="pt-4 border-t border-gray-200 transition-opacity duration-200"
            style={{ opacity: isCollapsed ? 0 : 1, pointerEvents: isCollapsed ? 'none' : 'auto' }}
          >
            <ul className="space-y-0.5">
              {spaces.map((space) => {
                const isExpanded = expandedSpaceIds.has(space.id);
                const spaceCanvases = canvases.filter(c => c.spaceId === space.id);
                const isActiveSpace = pathname.includes(`/space/${space.id}`);

                return (
                  <li key={space.id}>
                    <button
                      onClick={() => toggleSpace(space.id)}
                      className={`w-full flex items-center py-2 px-3 rounded-lg text-sm transition-colors overflow-hidden ${
                        isActiveSpace
                          ? "bg-gray-100 text-gray-900 font-medium"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <span
                        className="flex-1 text-left truncate whitespace-nowrap transition-opacity duration-200"
                        style={{ opacity: isCollapsed ? 0 : 1 }}
                      >
                        {space.name}
                      </span>
                      <svg
                        className={`w-3 h-3 flex-shrink-0 mr-3 transition-all duration-200 ${
                          isExpanded ? 'rotate-90' : ''
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                        style={{ opacity: isCollapsed ? 0 : 1 }}
                      >
                        <path d="M9 5l7 7-7 7" />
                      </svg>
                    </button>

                    {/* Nested canvases */}
                    {isExpanded && spaceCanvases.length > 0 && (
                      <ul className="mt-1 space-y-0.5">
                        {spaceCanvases.map((canvas) => {
                          const canvasPath = `/space/${space.id}/canvas/${canvas.id}`;
                          const isActiveCanvas = pathname === canvasPath;

                          return (
                            <li key={canvas.id}>
                              <Link
                                href={canvasPath}
                                className={`flex items-center py-1.5 rounded-lg text-sm transition-colors overflow-hidden ${
                                  isActiveCanvas
                                    ? "bg-blue-50 text-blue-900 font-medium"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                }`}
                              >
                                <div className="w-10 flex items-center justify-center flex-shrink-0 ml-5">
                                  <IconBoard css={{ width: 14, height: 14 }} />
                                </div>
                                <span className="truncate whitespace-nowrap">{canvas.name}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </nav>
    </aside>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return <IconHouse css={{ width: 18, height: 18, strokeWidth: active ? 2 : 1.5 }} />;
}

function ChatIcon({ active }: { active: boolean }) {
  return <IconChatTwo css={{ width: 18, height: 18, strokeWidth: active ? 2 : 1.5 }} />;
}

function TasksIcon({ active }: { active: boolean }) {
  return <IconCheckBoxLines css={{ width: 18, height: 18, strokeWidth: active ? 2 : 1.5 }} />;
}
