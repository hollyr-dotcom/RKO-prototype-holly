'use client'

import React from 'react'

// Value scores for 3 signals across 7 dates
const DATES = ['12/13', '12/20', '12/27', '1/02', '1/09', '1/16', '1/23']
const SIGNALS = [
  { values: [58, 82, 68, 95, 72, 78, 62], stroke: '#f472b6', fill: '#f9a8d4' },
  { values: [32, 48, 78, 58, 42, 68, 52], stroke: '#a78bfa', fill: '#c4b5fd' },
  { values: [18, 28, 42, 52, 65, 48, 38], stroke: '#818cf8', fill: '#d9dffc' },
]

const W = 480
const H = 200
const PAD_LEFT = 8
const PAD_RIGHT = 40
const PAD_TOP = 8
const PAD_BOTTOM = 24
const CHART_W = W - PAD_LEFT - PAD_RIGHT
const CHART_H = H - PAD_TOP - PAD_BOTTOM
const Y_TICKS = [0, 25, 50, 75, 100]

function xPos(i: number) {
  return PAD_LEFT + (i / (DATES.length - 1)) * CHART_W
}
function yPos(v: number) {
  return PAD_TOP + CHART_H - (v / 100) * CHART_H
}

function makePath(values: number[]) {
  return values.map((v, i) => `${i === 0 ? 'M' : 'L'}${xPos(i).toFixed(1)},${yPos(v).toFixed(1)}`).join(' ')
}

function makeArea(values: number[]) {
  const line = makePath(values)
  const lastX = xPos(values.length - 1).toFixed(1)
  const baseY = (PAD_TOP + CHART_H).toFixed(1)
  return `${line} L${lastX},${baseY} L${xPos(0).toFixed(1)},${baseY} Z`
}

export function VolatileSignals() {
  return (
    <div className="bg-white rounded-[12px] flex flex-col gap-5 p-8" style={{ border: '1px solid #e9eaef' }}>
      {/* Header */}
      <div>
        <h2 className="text-[22px] font-heading font-medium text-gray-900 leading-snug mb-1">Most volatile signals</h2>
        <p className="text-sm text-gray-500">Based on % change in value score</p>
      </div>

      {/* Chart */}
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: 'visible' }}>
        <defs>
          {SIGNALS.map((s, i) => (
            <linearGradient key={i} id={`vg${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.fill} stopOpacity={0.55} />
              <stop offset="100%" stopColor={s.fill} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>

        {/* Y-axis grid lines + labels */}
        {Y_TICKS.map(tick => {
          const y = yPos(tick)
          return (
            <g key={tick}>
              <line x1={PAD_LEFT} x2={W - PAD_RIGHT} y1={y} y2={y} stroke="#e9eaef" strokeWidth={1} />
              <text x={W - PAD_RIGHT + 6} y={y + 4} fontSize={10} fill="#959aac" textAnchor="start">{tick}</text>
            </g>
          )
        })}

        {/* Areas (back to front) */}
        {[...SIGNALS].reverse().map((s, ri) => {
          const i = SIGNALS.length - 1 - ri
          return (
            <path key={i} d={makeArea(s.values)} fill={`url(#vg${i})`} />
          )
        })}

        {/* Lines (back to front) */}
        {[...SIGNALS].reverse().map((s, ri) => {
          const i = SIGNALS.length - 1 - ri
          return (
            <path key={i} d={makePath(s.values)} fill="none" stroke={s.stroke} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          )
        })}

        {/* X-axis date labels */}
        {DATES.map((d, i) => (
          <text key={d} x={xPos(i)} y={H - 4} fontSize={10} fill="#959aac" textAnchor="middle">{d}</text>
        ))}
      </svg>
    </div>
  )
}
