'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { label: 'Overview', href: '/insights/overview' },
  { label: 'Themes', href: '/insights/themes' },
  { label: 'Signals', href: '/insights/signals' },
];

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

        {/* Nav items */}
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
        </div>
      </div>
    </aside>
  );
}
