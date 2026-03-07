'use client'

import React, { useState, useRef, useCallback } from 'react'
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
    return Math.round(Math.max(10, Math.min(99, base)))
  })
}

function getInsight(theme: ReturnType<typeof getVolatileThemes>[number]): string {
  const rising = theme.deltaNum > 0
  const tag = theme.tags[0]?.label ?? 'multiple'
  return rising
    ? `${theme.title.split(' ').slice(0, 5).join(' ')}… is gaining momentum — signal volume up across ${tag.toLowerCase()} sources.`
    : `${theme.title.split(' ').slice(0, 5).join(' ')}… is losing urgency — customer mentions are declining week-over-week.`
}

function getQuote(theme: ReturnType<typeof getVolatileThemes>[number]): string {
  const rising = theme.deltaNum > 0
  return rising
    ? `Confidence climbed ${theme.meta.confidenceDelta} this period, now at ${theme.meta.confidence}. New enterprise accounts are flagging this as a blocker.`
    : `Confidence dropped ${theme.meta.confidenceDelta} this period, now at ${theme.meta.confidence}. Worth monitoring before committing roadmap resources.`
}

const BAR_COLORS = ['#067429', '#79E49B', '#ADF0C7']

const DATES = ['12/13', '12/20', '12/27', '1/02', '1/09', '1/16', '1/23']

// ─── SVG constants ────────────────────────────────────────────────────────────

const W = 460
const H = 220
const PL = 6
const PR = 36
const PT = 8
const PB = 20
const CW = W - PL - PR
const CH = H - PT - PB

const Y_MIN = 0
const Y_MAX = 100
const TICKS = [0, 25, 50, 75, 100]

function yp(v: number) { return PT + CH - ((v - Y_MIN) / (Y_MAX - Y_MIN)) * CH }

// ─── Popover ──────────────────────────────────────────────────────────────────

function VolatilePopover({
  cx, cy, theme, onViewAnalysis, onMouseEnter, onMouseLeave,
}: {
  cx: number; cy: number
  theme: ReturnType<typeof getVolatileThemes>[number]
  onViewAnalysis: () => void
  onMouseEnter: () => void
  onMouseLeave: () => void
}) {
  return (
    <div
      className="absolute z-50"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        left: cx,
        top: cy,
        transform: 'translate(-50%, calc(-100% - 16px))',
        width: 320,
        paddingBottom: 24,
        pointerEvents: 'auto',
      }}
    >
      <div
        className="rounded-[8px] p-4 flex flex-col gap-3"
        style={{ backgroundColor: '#1a1b1e', boxShadow: '0px 8px 32px rgba(5,0,56,0.12)' }}
      >
        <div className="flex flex-col gap-1">
          <p className="text-lg font-heading font-medium text-white leading-snug mb-1">
            {getInsight(theme)}
          </p>
        </div>

        <div className="rounded-[8px] px-4 py-3 flex items-center gap-3" style={{ backgroundColor: '#2b2d33' }}>
          <div className="w-0.5 self-stretch bg-white opacity-30 shrink-0" />
          <p className="text-[12px] text-white leading-[1.5] opacity-80">
            {getQuote(theme)}
          </p>
        </div>

        <div>
          <button
            onClick={onViewAnalysis}
            className="px-4 py-1.5 rounded-[6px] bg-white text-[#222428] text-sm font-medium transition-opacity hover:opacity-80"
            style={{ border: '1px solid #e0e2e8' }}
          >
            View analysis
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function VolatileSignals({ onOpenChat }: { onOpenChat?: () => void }) {
  const router = useRouter()
  const themes = getVolatileThemes(3)
  const series = themes.map(t => buildSeries(t.meta.confidence, t.deltaNum))
  const [hovered, setHovered] = useState<number | null>(null)
  const [popover, setPopover] = useState<{ si: number; cx: number; cy: number } | null>(null)
  const [cardHovered, setCardHovered] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleClose = useCallback(() => {
    closeTimer.current = setTimeout(() => { setHovered(null); setPopover(null) }, 300)
  }, [])

  const cancelClose = useCallback(() => {
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null }
  }, [])

  const numDates = DATES.length
  const groupW = CW / numDates
  const barW = Math.floor(groupW * 0.2)
  const barGap = 2
  const groupPad = (groupW - series.length * barW - (series.length - 1) * barGap) / 2
  const baseY = yp(Y_MIN)

  function handleBarEnter(si: number, di: number) {
    setHovered(si)
    if (svgRef.current) {
      const svgEl = svgRef.current
      const rect = svgEl.getBoundingClientRect()
      const scaleX = rect.width / W
      const scaleY = rect.height / H
      // Center x of this bar group
      const svgX = PL + di * groupW + groupPad + si * (barW + barGap) + barW / 2
      // Top of the bar
      const svgY = yp(series[si][di])
      setPopover({ si, cx: svgX * scaleX, cy: svgY * scaleY })
    }
  }

  return (
    <div
      className="bg-white rounded-[24px] border border-gray-100 shadow-sm flex flex-col gap-4 p-8 relative h-full"
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
      <div className="relative">
        {/* Popover */}
        <AnimatePresence>
          {popover && (
            <motion.div
              key={popover.si}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50, pointerEvents: 'none' }}
            >
              <VolatilePopover
                cx={popover.cx}
                cy={popover.cy}
                theme={themes[popover.si]}
                onViewAnalysis={() => router.push(`/insights/themes/${themes[popover.si].id}`)}
                onMouseEnter={cancelClose}
                onMouseLeave={scheduleClose}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: 'visible', display: 'block' }}>

          {/* Y-axis ticks */}
          {TICKS.map(tick => (
            <text key={tick} x={W - PR + 8} y={yp(tick) + 4} fontSize={10} fill="#959aac" textAnchor="start">{tick}</text>
          ))}

          {/* Bars */}
          {series.map((vals, si) =>
            vals.map((v, di) => {
              const x = PL + di * groupW + groupPad + si * (barW + barGap)
              const barH = Math.max(4, baseY - yp(v))
              const top = yp(v)
              const r = Math.min(4, barW / 2, barH / 2)
              const d = `M${x},${top + baseY - top} L${x},${top + r} Q${x},${top} ${x + r},${top} L${x + barW - r},${top} Q${x + barW},${top} ${x + barW},${top + r} L${x + barW},${top + baseY - top} Z`
              const isActive = hovered === null || hovered === si
              return (
                <path
                  key={`${si}-${di}`}
                  d={d}
                  fill={BAR_COLORS[si]}
                  opacity={isActive ? 1 : 0.15}
                  style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
                  onMouseEnter={() => { cancelClose(); handleBarEnter(si, di) }}
                  onMouseLeave={scheduleClose}
                  onClick={() => router.push(`/insights/themes/${themes[si].id}`)}
                />
              )
            })
          )}

          {/* Axis border lines */}
          <line x1={W - PR} y1={PT} x2={W - PR} y2={baseY} stroke="#e9eaef" strokeWidth={1} />
          <line x1={PL} y1={baseY} x2={W - PR} y2={baseY} stroke="#e9eaef" strokeWidth={1} />

          {/* X-axis date labels */}
          {DATES.map((d, i) => (
            <text key={d} x={PL + i * groupW + groupW / 2} y={H - 4} fontSize={10} fill="#959aac" textAnchor="middle">{d}</text>
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-col">
        {themes.map((theme, i) => (
          <button
            key={theme.id}
            className="flex items-center gap-2.5 text-left px-3 py-1 rounded-[10px] transition-colors"
            style={{ backgroundColor: hovered === i ? '#f1f2f5' : 'transparent' }}
            onClick={() => router.push(`/insights/themes/${theme.id}`)}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: BAR_COLORS[i], flexShrink: 0 }} />
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
