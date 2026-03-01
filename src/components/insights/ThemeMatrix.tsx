'use client'

import React, { useState, useRef } from 'react'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from 'recharts'

const scatterData = [
  { effort: 15, value: 72 },
  { effort: 22, value: 68 },
  { effort: 30, value: 78 },
  { effort: 35, value: 74 },
  { effort: 40, value: 82 },
  { effort: 42, value: 70 },
  { effort: 48, value: 76 },
  { effort: 50, value: 72 },
  { effort: 55, value: 80 },
  { effort: 58, value: 68 },
  { effort: 60, value: 74 },
  { effort: 62, value: 78 },
  { effort: 65, value: 66 },
  { effort: 68, value: 72 },
  { effort: 70, value: 76 },
  { effort: 72, value: 70 },
  { effort: 75, value: 80 },
  { effort: 78, value: 74 },
  { effort: 80, value: 68 },
  { effort: 82, value: 76 },
  { effort: 85, value: 72 },
  { effort: 88, value: 82 },
  { effort: 90, value: 78 },
  { effort: 92, value: 70 },
  { effort: 95, value: 92 },
]

interface HoveredDot {
  cx: number
  cy: number
  value: number
}

function ThemeMatrixPopover({
  cx,
  cy,
  value,
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
        width: 280,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        className="rounded-[8px] px-5 py-6 flex flex-col gap-3"
        style={{ backgroundColor: '#1a1b1e', boxShadow: '0px 8px 32px rgba(5,0,56,0.08)' }}
      >
        <p className="text-[12px] font-semibold text-[#aeb2c0] leading-none">
          Strong Signal • Urgent
        </p>

        <div className="flex flex-col gap-1 pb-1">
          <p
            className="text-[16px] font-semibold text-white leading-[1.5]"
            style={{ fontFamily: 'Roobert, sans-serif' }}
          >
            Enable enterprise-grade security to protect revenue
          </p>
          <p className="text-[14px] text-white leading-[1.4] opacity-80">
            Customer signals indicate urgent demand for SSO integration
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <span
              className="text-[14px] font-semibold text-white"
              style={{ fontFamily: 'Roobert, sans-serif' }}
            >
              Value Score:
            </span>
            <span
              className="text-[14px] font-semibold text-white"
              style={{ fontFamily: 'Roobert, sans-serif' }}
            >
              {value}%
            </span>
          </div>
          <p className="text-[14px] text-white opacity-70">+4.3% vs 4-week avg</p>
          <div className="h-[4px] rounded-full mt-1" style={{ backgroundColor: '#656b81' }}>
            <div
              className="h-full rounded-full"
              style={{ backgroundColor: '#3859FF', width: `${value}%` }}
            />
          </div>
        </div>

        <div className="pt-2">
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

export function ThemeMatrix() {
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

  const renderDot = (props: any) => {
    const { cx, cy, payload } = props
    return (
      <circle
        key={`dot-${cx}-${cy}`}
        cx={cx}
        cy={cy}
        r={9}
        fill="#3859FF"
        opacity={0.8}
        onMouseEnter={() => {
          cancelClose()
          setHoveredDot({ cx, cy, value: payload.value })
        }}
        onMouseLeave={scheduleClose}
        style={{ cursor: 'pointer' }}
      />
    )
  }

  return (
    <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 flex flex-col">
      <div className="mb-4">
        <h2 className="text-[24px] font-serif text-[#222428] mb-1">Theme Matrix</h2>
        <p className="text-sm text-gray-500">Signals move and change as confidence changes</p>
      </div>
      <figure className="flex-1 min-h-[380px] flex flex-col relative">
        {hoveredDot && (
          <ThemeMatrixPopover
            cx={hoveredDot.cx}
            cy={hoveredDot.cy}
            value={hoveredDot.value}
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
          />
        )}
        {/* Chart row: chart + Y-axis labels, bordered on left and bottom */}
        <div className="flex flex-1 border-b border-gray-200">
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis type="number" dataKey="effort" domain={[0, 100]} hide />
                <YAxis type="number" dataKey="value" domain={[60, 100]} hide />
                <Scatter data={scatterData} shape={renderDot} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col w-8 shrink-0 pt-8 pb-2 border-l border-gray-200">
            <span className="text-[12px] text-gray-400 leading-none pl-2">100%</span>
            <div className="flex-1 flex items-center justify-center">
              <span
                className="text-[14px] font-bold -rotate-90 whitespace-nowrap"
                style={{ fontFamily: 'Roobert, sans-serif', color: '#222428' }}
              >
                Value Score
              </span>
            </div>
            <span className="text-[12px] text-gray-400 leading-none pl-2">85%</span>
          </div>
        </div>
        {/* X-axis labels row */}
        <div className="flex justify-between items-center mt-2">
          <span className="text-[12px] text-gray-400">Low</span>
          <span
            className="text-[14px] font-bold"
            style={{ fontFamily: 'Roobert, sans-serif', color: '#222428' }}
          >
            Effort
          </span>
          <span className="text-[12px] text-gray-400">High</span>
        </div>
        <figcaption className="sr-only">
          Theme Matrix scatter plot showing correlation between effort and value score
        </figcaption>
      </figure>
    </section>
  )
}
