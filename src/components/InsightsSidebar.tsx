'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  IconSmileyChat,
  IconChartLine,
  IconSparksFilled,
  IconThumbsUp,
  IconGlobe,
  IconRocket,
  IconChatLinesTwo,
} from '@mirohq/design-system-icons';

type IconComponent = React.ComponentType<{ css?: { width: number; height: number } }>;

const NAV_ITEMS = [
  { label: 'Overview', href: '/insights/overview' },
  { label: 'Themes', href: '/insights/themes' },
  { label: 'Signals', href: '/insights/signals' },
];

const BOARD_SECTIONS: { label: string; items: { icon: IconComponent; label: string }[] }[] = [
  {
    label: 'Research',
    items: [
      { icon: IconSmileyChat, label: 'Interview Synthesis' },
      { icon: IconChartLine, label: 'Survey Analysis — Q1' },
    ],
  },
  {
    label: 'Analysis',
    items: [
      { icon: IconSparksFilled, label: 'Theme Clustering' },
      { icon: IconThumbsUp, label: 'Sentiment Trends' },
      { icon: IconGlobe, label: 'Competitor Signals' },
    ],
  },
  {
    label: 'Outcomes',
    items: [
      { icon: IconRocket, label: 'Roadmap Recommendations' },
      { icon: IconChatLinesTwo, label: 'Stakeholder Readout' },
    ],
  },
];

function BoardSection({ label, items }: { label: string; items: { icon: IconComponent; label: string }[] }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="flex flex-col">
      <div
        className="group flex items-center h-8 pl-3 pr-0 pt-2 text-sm w-full cursor-pointer font-semibold text-gray-500"
        onClick={() => setExpanded((p) => !p)}
      >
        <span className="flex-1 text-left">{label}</span>
        <svg
          width="16" height="16" viewBox="0 0 16 16" fill="none"
          className={`flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200 ${expanded ? '' : '-rotate-90'}`}
        >
          <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {expanded && (
        <div className="pt-[6px]">
          <div className="flex flex-col gap-0.5">
            {items.map((item) => (
              <a
                key={item.label}
                href="#"
                className="flex items-center gap-3 h-9 px-3 rounded-lg text-sm transition-colors duration-200 text-gray-700 hover:bg-gray-100"
              >
                <span className="w-5 h-5 flex items-center justify-center flex-shrink-0 text-gray-400">
                  <item.icon css={{ width: 16, height: 16 }} />
                </span>
                <span className="truncate flex-1">{item.label}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function InsightsSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="h-full flex-shrink-0 overflow-hidden rounded-l-[2rem] shadow-surface-nav"
      style={{ backgroundColor: '#FFFFFF', width: 240 }}
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="px-6" style={{ paddingTop: 36 }}>
          <div className="flex items-center pb-5">
            <h2 className="flex-1 text-md font-semibold text-gray-900 truncate">
              Insights
            </h2>
          </div>
        </div>

        {/* Nav items + boards */}
        <div className="flex-1 overflow-y-auto px-4 pt-2">
          <div className="flex flex-col gap-0.5">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`w-full flex items-center rounded-[16px] text-sm transition-colors duration-200 px-4 ${isActive ? '' : 'text-gray-600 hover:text-gray-900'}`}
                  style={{
                    height: 40,
                    ...(isActive
                      ? { backgroundColor: '#E7E7E5', color: '#222428', fontWeight: 500 }
                      : undefined),
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = '#E7E7E5';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = '';
                  }}
                >
                  <span className="truncate text-left">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Divider */}
          <div className="my-6 border-b border-black/[0.08]" />

          {/* Boards header */}
          <div className="flex items-center h-8 pl-3 pr-0">
            <span className="flex-1 text-sm font-bold text-gray-900">Boards</span>
            <button
              className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-200/60 transition-colors duration-200 -mr-1"
              title="Add board"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                <path fill="currentColor" d="M13 4v7h7v2h-7v7h-2v-7H4v-2h7V4h2Z" />
              </svg>
            </button>
          </div>

          {/* Board sections */}
          <div className="flex flex-col gap-2 mt-1">
            {BOARD_SECTIONS.map((section) => (
              <BoardSection key={section.label} label={section.label} items={section.items} />
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
