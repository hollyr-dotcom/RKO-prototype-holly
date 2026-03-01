'use client'

import React, { useState, useRef } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { HelpCircle } from 'lucide-react'

const data = [
  { day: 'M', value: 64 },
  { day: 'T', value: 58 },
  { day: 'W', value: 65 },
  { day: 'TH', value: 88 },
  { day: 'F', value: 52 },
  { day: 'S', value: 68 },
  { day: 'S', value: 72 },
]

interface HoveredDot {
  cx: number
  cy: number
}

function SentimentPopover({
  cx,
  cy,
  onMouseEnter,
  onMouseLeave,
}: HoveredDot & { onMouseEnter: () => void; onMouseLeave: () => void }) {
  return (
    <div
      className="absolute z-50"
      style={{
        left: cx,
        top: cy,
        transform: 'translate(-50%, calc(-100% - 16px))',
        width: 374,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        className="rounded-[8px] p-4 flex flex-col gap-3"
        style={{
          backgroundColor: '#1a1b1e',
          boxShadow: '0px 8px 32px rgba(5,0,56,0.12)',
        }}
      >
        <p className="text-[12px] font-semibold text-[#aeb2c0]">Insight</p>

        <div className="flex flex-col gap-1">
          <p
            className="text-[16px] font-semibold text-white leading-[1.5]"
            style={{ fontFamily: 'Roobert, sans-serif' }}
          >
            Increase likely due to Zapier integration
          </p>
          <p className="text-[14px] text-white leading-[1.4] opacity-80">
            Miro Insights suggests further investing in integrations to maintain a positive sentiment.
          </p>
        </div>

        <div
          className="rounded-[8px] px-4 py-3 flex items-center gap-3"
          style={{ backgroundColor: '#2b2d33' }}
        >
          <div className="w-0.5 self-stretch bg-white opacity-30 shrink-0" />
          <p className="text-[12px] text-white leading-[1.5]">
            &ldquo;...Zapier integration made set up truly intuitive and...&rdquo;
          </p>
        </div>

        <div className="flex justify-end">
          <button
            className="px-4 py-1.5 rounded-[6px] text-white text-sm font-medium"
            style={{ backgroundColor: '#3859FF' }}
          >
            View details
          </button>
        </div>
      </div>

      {/* Caret pointing down */}
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          bottom: -9,
          width: 0,
          height: 0,
          borderLeft: '12px solid transparent',
          borderRight: '12px solid transparent',
          borderTop: '9px solid #1a1b1e',
        }}
      />
    </div>
  )
}

export function SentimentChart() {
  const [hoveredDot, setHoveredDot] = useState<HoveredDot | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setHoveredDot(null), 80)
  }

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }

  const renderActiveDot = (props: any) => {
    const { cx, cy } = props
    return (
      <circle
        key={`dot-${cx}-${cy}`}
        cx={cx}
        cy={cy}
        r={7}
        fill="#3859FF"
        stroke="white"
        strokeWidth={2}
        onMouseEnter={() => { cancelClose(); setHoveredDot({ cx, cy }) }}
        onMouseLeave={scheduleClose}
        style={{ cursor: 'pointer' }}
      />
    )
  }

  return (
    <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 flex flex-col">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-[24px] font-serif text-[#222428]">Customer sentiment</h2>
          <HelpCircle className="w-5 h-5 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500">
          Sentiment dipped on Friday, driven by mobile performance issues.
        </p>
      </div>
      <figure className="flex-1 min-h-[380px] relative">
        {hoveredDot && (
          <SentimentPopover
            cx={hoveredDot.cx}
            cy={hoveredDot.cy}
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
          />
        )}
        <ResponsiveContainer width="100%" height={380}>
          <AreaChart
            data={data}
            margin={{ top: 16, right: 0, left: 16, bottom: 0 }}
            onMouseLeave={scheduleClose}
          >
            <defs>
              <linearGradient id="sentimentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3859FF" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#3859FF" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              axisLine={{ stroke: '#e5e7eb', strokeWidth: 1 }}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#9ca3af', fontFamily: 'inherit' }}
              dy={10}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              axisLine={{ stroke: '#e5e7eb', strokeWidth: 1 }}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#9ca3af', fontFamily: 'inherit' }}
              orientation="right"
              dx={22}
              width={50}
            />
            <Tooltip
              content={() => null}
              cursor={{ stroke: '#c7d2fe', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#3859FF"
              strokeWidth={2}
              fill="url(#sentimentGradient)"
              dot={{ fill: '#3859FF', strokeWidth: 0, r: 5, fillOpacity: 1 }}
              activeDot={renderActiveDot}
            />
          </AreaChart>
        </ResponsiveContainer>
        <figcaption className="sr-only">
          Customer sentiment line chart showing weekly trends from Monday to Sunday
        </figcaption>
      </figure>
    </section>
  )
}
