"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useSidebar } from "@/contexts/SidebarContext";
import {
  IconHouse,
  IconClock,
  IconStar,
  IconSidebarClosed,
  IconGridFour,
} from "@mirohq/design-system-icons";

const iconSize = { width: 18, height: 18 };

const navItems = [
  { label: "Home", href: "/", icon: IconHouse },
  { label: "Recent", href: "#", icon: IconClock },
  { label: "Starred", href: "#", icon: IconStar },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { collapsed, setCollapsed } = useSidebar();

  return (
    <motion.aside
      className="h-full bg-white/90 backdrop-blur-xl border border-gray-200/60 rounded-xl shadow-lg shadow-black/[0.08] flex flex-col overflow-hidden"
      animate={{ width: collapsed ? 0 : 240, opacity: collapsed ? 0 : 1 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      style={{ pointerEvents: collapsed ? "none" : "auto" }}
    >
      {/* Logo + Collapse toggle */}
      <div className="flex items-center justify-between px-5 py-5">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center shrink-0 text-white">
            <IconGridFour css={{ width: 16, height: 16 }} />
          </div>
          <motion.span
            className="text-sm font-semibold text-gray-900 whitespace-nowrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            Canvas
          </motion.span>
        </Link>
        <button
          onClick={() => setCollapsed(true)}
          className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          title="Collapse sidebar"
        >
          <IconSidebarClosed css={{ width: 16, height: 16 }} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={`flex items-center rounded-lg text-sm transition-colors gap-3 px-3 py-2 ${
                    isActive
                      ? "bg-gray-100 text-gray-900 font-medium"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <span className="shrink-0">
                    <item.icon css={iconSize} />
                  </span>
                  <motion.span
                    className="whitespace-nowrap overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15 }}
                  >
                    {item.label}
                  </motion.span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </motion.aside>
  );
}


