'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { THEME_CARDS } from '@/data/themes-data'
import { IconSparksFilled } from '@mirohq/design-system-icons'

// ─── Data ─────────────────────────────────────────────────────────────────────

function getVolatileThemes(count = 3) {
  return [...THEME_CARDS]
    .map(t => ({ ...t, deltaNum: parseInt(t.meta.confidenceDelta.replace('%', '')) }))
    .sort((a, b) => Math.abs(b.deltaNum) - Math.abs(a.deltaNum))
    .slice(0, count)
}

function buildSeries(confidenceStr: string, deltaNum: number): number[] {
  const end = parseInt(confidenceStr.replace('%', ''))
  const start = Math.max(0, Math.min(100, end - deltaNum))
  return Array.from({ length: 7 }, (_, i) => {
    const t = i / 6
    const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
    const base = start + (end - start) * ease
    const wobble = i === 0 || i === 6 ? 0 : Math.sin(i * 0.7 + deltaNum * 0.1) * 0.8
    return Math.round(Math.max(10, Math.min(99, base + wobble)))
  })
}

const COLORS = [
  { stroke: '#3859FF', fill: '#3859FF' },
  { stroke: '#3859FF', fill: '#3859FF' },
  { stroke: '#3859FF', fill: '#3859FF' },
]

const DATES = ['12/13', '12/20', '12/27', '1/02', '1/09', '1/16', '1/23']

// ─── SVG helpers ──────────────────────────────────────────────────────────────

const W = 460
const H = 190
const PL = 6
const PR = 36
const PT = 8
const PB = 22
const CW = W - PL - PR
const CH = H - PT - PB

function xp(i: number) { return PL + (i / 6) * CW }

function niceRange(series: number[][]): { yMin: number; yMax: number; ticks: number[] } {
  const all = series.flat()
  const rawMin = Math.min(...all)
  const rawMax = Math.max(...all)
  const range = rawMax - rawMin
  const pad = Math.max(1, Math.round(range * 0.1))
  const rawStep = Math.max(1, Math.round((range + pad * 2) / 2))
  const yMin = Math.max(0, Math.floor((rawMin - pad) / rawStep) * rawStep)
  const yMax = Math.min(100, Math.ceil((rawMax + pad) / rawStep) * rawStep)
  const ticks: number[] = []
  for (let t = yMin; t <= yMax; t += rawStep) ticks.push(t)
  return { yMin, yMax, ticks }
}

function makeYp(yMin: number, yMax: number) {
  return (v: number) => PT + CH - ((v - yMin) / (yMax - yMin)) * CH
}

function linePath(values: number[], yp: (v: number) => number) {
  const pts = values.map((v, i) => ({ x: xp(i), y: yp(v) }))
  if (pts.length < 2) return ''
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(pts.length - 1, i + 2)]
    const cp1x = p1.x + (p2.x - p0.x) / 2
    const cp1y = p1.y + (p2.y - p0.y) / 2
    const cp2x = p2.x - (p3.x - p1.x) / 2
    const cp2y = p2.y - (p3.y - p1.y) / 2
    d += ` C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`
  }
  return d
}
function areaPath(values: number[], yp: (v: number) => number, yMin: number) {
  const line = linePath(values, yp)
  const base = yp(yMin).toFixed(1)
  return `${line} L${xp(6).toFixed(1)},${base} L${xp(0).toFixed(1)},${base} Z`
}

// ─── Analysis text per theme ───────────────────────────────────────────────────

function buildAnalysis(themes: ReturnType<typeof getVolatileThemes>): string {
  const top = themes[0]
  const rising = themes.filter(t => t.deltaNum > 0)
  const falling = themes.filter(t => t.deltaNum < 0)

  const risingStr = rising.map(t => `**${t.title.split(' ').slice(0, 4).join(' ')}…** (${t.meta.confidenceDelta})`).join(' and ')
  const fallingStr = falling.map(t => `**${t.title.split(' ').slice(0, 4).join(' ')}…** (${t.meta.confidenceDelta})`).join(' and ')

  let analysis = `**${top.title.split(' ').slice(0, 5).join(' ')}…** is the fastest-moving theme this period at **${top.meta.confidenceDelta}**, now at ${top.meta.confidence} confidence.`

  if (risingStr) analysis += `\n\nRising themes — ${risingStr} — are gaining consistent signal across multiple sources. These are good candidates to move forward in the roadmap.`
  if (fallingStr) analysis += `\n\nFalling themes — ${fallingStr} — may be stabilising or losing customer urgency. Worth monitoring before committing roadmap resources.`

  return analysis
}

// ─── Component ────────────────────────────────────────────────────────────────

export function VolatileSignals({ onOpenChat }: { onOpenChat?: () => void }) {
  const router = useRouter()
  const themes = getVolatileThemes(3)
  const series = themes.map(t => buildSeries(t.meta.confidence, t.deltaNum))
  const { yMin, yMax, ticks } = niceRange(series)
  const yp = makeYp(yMin, yMax)
  const [hovered, setHovered] = useState<number | null>(null)
  const [cardHovered, setCardHovered] = useState(false)

  return (
    <div
      className="bg-white rounded-[12px] flex flex-col gap-4 p-8 relative"
      style={{ boxShadow: '0px 4px 20px rgba(34,36,40,0.08)' }}
      onMouseEnter={() => setCardHovered(true)}
      onMouseLeave={() => setCardHovered(false)}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-[22px] font-heading font-medium text-gray-900 leading-snug mb-1">
            Most volatile opportunities
          </h2>
          <p className="text-sm text-gray-500">Based on % change in confidence score</p>
        </div>

        {/* Sparkle button — shows on hover, opens AI chat */}
        <AnimatePresence>
          {cardHovered && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => onOpenChat?.()}
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors text-[#222428]"
              style={{ border: '1.5px solid #e0e2e8' }}
            >
              <span className="leading-[0]"><IconSparksFilled css={{ width: 14, height: 14 }} /></span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Chart */}
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: 'visible', display: 'block' }}>
        <defs>
          {COLORS.map((c, i) => (
            <linearGradient key={i} id={`vsgrad${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c.fill} stopOpacity={hovered === null || hovered === i ? 0.15 : 0.04} />
              <stop offset="100%" stopColor={c.fill} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>

        {ticks.map(tick => (
          <text key={tick} x={W - PR + 6} y={yp(tick) + 4} fontSize={10} fill="#959aac" textAnchor="start">{tick}</text>
        ))}

        {[...series].reverse().map((vals, ri) => {
          const i = series.length - 1 - ri
          return <path key={i} d={areaPath(vals, yp, yMin)} fill={`url(#vsgrad${i})`} />
        })}

        {series.map((vals, i) => (
          <path
            key={i}
            d={linePath(vals, yp)}
            fill="none"
            stroke={COLORS[i].stroke}
            strokeWidth={hovered === i ? 2.5 : 1.5}
            strokeOpacity={hovered === null || hovered === i ? 1 : 0.25}
            strokeLinejoin="round"
            strokeLinecap="round"
            style={{ transition: 'stroke-opacity 0.15s, stroke-width 0.15s' }}
          />
        ))}

        {series.map((vals, i) => (
          <path
            key={`hit-${i}`}
            d={linePath(vals, yp)}
            fill="none"
            stroke="transparent"
            strokeWidth={16}
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => router.push(`/insights/themes/${themes[i].id}`)}
          />
        ))}

        {DATES.map((d, i) => (
          <text key={d} x={xp(i)} y={H - 4} fontSize={10} fill="#959aac" textAnchor="middle">{d}</text>
        ))}
      </svg>

      {/* Legend */}
      <div className="flex flex-col gap-1">
        {themes.map((theme, i) => (
          <button
            key={theme.id}
            className="flex items-center gap-2.5 text-left px-3 py-2 rounded-[10px] transition-colors"
            style={{ backgroundColor: hovered === i ? '#f1f2f5' : 'transparent' }}
            onClick={() => router.push(`/insights/themes/${theme.id}`)}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <span
              className="text-[13px] leading-snug truncate flex-1 transition-colors"
              style={{ color: hovered === i ? '#222428' : '#656b81' }}
            >
              {theme.title}
            </span>
          </button>
        ))}
      </div>

    </div>
  )
}
