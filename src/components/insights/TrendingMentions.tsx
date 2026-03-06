'use client'

import React from 'react'

const ITEMS = [
  { label: 'Zapier Webhooks', mentions: 75, change: '+8.5% past 7 days' },
  { label: 'Canvas navigation', mentions: 50, change: '+8.5% past 7 days' },
  { label: 'Performance issues', mentions: 40, change: '+8.5% past 7 days' },
  { label: 'Jira sync', mentions: 35, change: '+8.5% past 7 days' },
  { label: 'Onboarding', mentions: 15, change: '+8.5% past 7 days' },
]

const MAX = 100

export function TrendingMentions() {
  return (
    <div
      className="bg-white rounded-[12px] flex flex-col gap-5 p-8"
      style={{ border: '1px solid #e9eaef' }}
    >
      {/* Header */}
      <div>
        <h2 className="text-[22px] font-heading font-medium text-gray-900 leading-snug mb-1">Trending Mentions</h2>
        <p className="text-sm text-gray-500">Based on feedback from the past 7 days</p>
      </div>

      {/* Bars */}
      <div className="flex flex-col gap-3 flex-1">
        {ITEMS.map((item) => {
          const barPct = (item.mentions / MAX) * 100
          return (
            <div key={item.label} className="flex items-center gap-3" style={{ height: 44 }}>
              {/* Bar + label */}
              <div className="relative flex-1 flex items-center" style={{ height: 44 }}>
                <div className="absolute inset-0 rounded-[8px]" style={{ backgroundColor: '#f5f6fa' }} />
                <div
                  className="absolute left-0 top-0 bottom-0 rounded-[8px]"
                  style={{ width: `${barPct}%`, backgroundColor: '#d9dffc' }}
                />
                <span
                  className="relative z-10 text-[14px] font-semibold text-[#222428] leading-[1.5] ml-[21px]"
                  style={{ fontFamily: 'Roobert, sans-serif' }}
                >
                  {item.label}
                </span>
              </div>
              {/* Count + change — fixed width, outside bar */}
              <div className="flex flex-col items-end shrink-0 w-[120px]">
                <span className="text-[13px] font-semibold text-[#222428] leading-[1.4]">
                  {item.mentions} mentions
                </span>
                <span className="text-[11px] text-[#656b81] leading-[1.4] whitespace-nowrap">
                  {item.change}
                </span>
              </div>
            </div>
          )
        })}

        {/* X-axis ticks */}
        <div className="flex justify-between text-[12px] text-[#959aac] mt-1 px-0">
          {[0, 25, 50, 75, 100].map((n) => (
            <span key={n}>{n}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
