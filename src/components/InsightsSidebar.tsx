'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
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
type Canvas = { id: string; name: string };

const NAV_ITEMS = [
  { label: 'Overview', href: '/insights/overview' },
  { label: 'Insights', href: '/insights/themes' },
  { label: 'Signals', href: '/insights/signals' },
];

const STATIC_SECTIONS: { label: string; items: { icon: IconComponent; label: string }[] }[] = [
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
      { icon: IconSparksFilled, label: 'Opportunity Clustering' },
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

function StaticBoardSection({ label, items }: { label: string; items: { icon: IconComponent; label: string }[] }) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center h-8 pl-3 pr-0 pt-2 text-sm w-full font-semibold text-gray-500">
        <span className="flex-1 text-left">{label}</span>
      </div>
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
    </div>
  );
}

export function InsightsSidebar() {
  const pathname = usePathname();
  const [canvases, setCanvases] = useState<Canvas[]>([]);

  useEffect(() => {
    fetch('/api/spaces/space-insights')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.canvases) setCanvases(data.canvases); })
      .catch(() => {});
  }, []);

  return (
    <aside
      className="h-full flex-shrink-0 overflow-hidden rounded-l-[2rem] shadow-surface-nav"
      style={{ backgroundColor: '#FFFFFF', width: 240 }}
    >
      <div className="h-full flex flex-col">
        <div className="px-6" style={{ paddingTop: 36 }}>
          <div className="flex items-center pb-5">
            <h2 className="flex-1 text-md font-semibold text-gray-900 truncate">Insights</h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pt-2">
          {/* Nav items */}
          <div className="flex flex-col gap-0.5">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`w-full flex items-center rounded-[16px] text-sm transition-colors duration-200 px-4 ${isActive ? '' : 'text-gray-600'}`}
                  style={{
                    height: 40,
                    ...(isActive ? { backgroundColor: '#E7E7E5', color: '#222428', fontWeight: 500 } : undefined),
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = '#E7E7E5'; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = ''; }}
                >
                  <span className="truncate text-left">{item.label}</span>
                </Link>
              );
            })}
          </div>

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

          <div className="flex flex-col gap-2 mt-1">
            {/* Static sections */}
            {STATIC_SECTIONS.map((section) => (
              <StaticBoardSection key={section.label} label={section.label} items={section.items} />
            ))}

            {/* Dynamic saved boards from "Open in Canvas" */}
            {canvases.length > 0 && (
              <div className="flex flex-col">
                <div className="flex items-center h-8 pl-3 pr-0 pt-2 text-sm w-full font-semibold text-gray-500">
                  <span className="flex-1 text-left">Saved</span>
                </div>
                <div className="pt-[6px] flex flex-col gap-0.5">
                  {canvases.map((canvas) => {
                    const href = `/space/space-insights/canvas/${canvas.id}`;
                    const isActive = pathname === href;
                    return (
                      <Link
                        key={canvas.id}
                        href={href}
                        className="flex items-center gap-3 h-9 px-3 rounded-lg text-sm transition-colors duration-200"
                        style={{
                          color: isActive ? 'rgb(56,56,56)' : 'rgb(107,107,107)',
                          fontWeight: isActive ? 500 : 400,
                          backgroundColor: isActive ? 'var(--color-gray-200)' : 'transparent',
                        }}
                        onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = '#f3f4f6'; }}
                        onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        <span className="w-5 h-5 flex items-center justify-center flex-shrink-0 text-gray-400">
                          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" style={{ width: 20, height: 20 }}>
                            <path fill="currentColor" fillRule="evenodd" d="M18 14h-7v-2h7v2ZM13 3h6a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-2.584l1.25 3H15.5l-1.25-3h-4.5L8.5 22H6.333l1.25-3H5a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h6V1h2v2ZM5 5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H5Z" clipRule="evenodd" />
                          </svg>
                        </span>
                        <span className="truncate flex-1">{canvas.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
