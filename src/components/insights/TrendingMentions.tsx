'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { IconSparksFilled } from '@mirohq/design-system-icons'
import { THEME_CARDS } from '@/data/themes-data'

const STOP_WORDS = new Set([
  'is', 'are', 'was', 'were', 'a', 'an', 'in', 'at', 'to', 'for', 'of', 'and',
  'tops', 'cited', 'lacking', 'reduces', 'affecting', 'closing', 'exceeds',
  'unlocks', 'enabling', 'signals', 'causes', 'drives', 'demand',
])

function shortTitle(title: string): string {
  const words = title.split(' ')
  const result: string[] = []
  for (const word of words) {
    const clean = word.toLowerCase().replace(/[^a-z]/g, '')
    if (result.length >= 2 && STOP_WORDS.has(clean)) break
    result.push(word)
    if (result.length >= 4) break
  }
  return result.join(' ')
}

const ITEMS = [...THEME_CARDS]
  .sort((a, b) => b.meta.likes - a.meta.likes)
  .slice(0, 5)
  .map(card => ({
    id: card.id,
    label: shortTitle(card.title),
    mentions: card.meta.likes * 5,
    change: `${card.meta.confidenceDelta} past 7 days`,
  }))

const MAX = Math.max(...ITEMS.map(i => i.mentions))

const TAG_COLORS: Record<string, string> = {
  Urgent: '#FFD8F4',
  Weakening: '#DEDAFF',
  Strengthening: '#F8D3AF',
  New: '#BADEB1',
  Customer: '#FFF6B6',
  Market: '#C6DCFF',
}

function getBarColor(id: string): string {
  const card = THEME_CARDS.find(c => c.id === id)
  if (!card) return '#B9C5FF'
  const labels = card.tags.map(t => t.label)
  for (const priority of ['Urgent', 'Weakening', 'Strengthening', 'New', 'Customer', 'Market']) {
    if (labels.includes(priority)) return TAG_COLORS[priority]
  }
  return TAG_COLORS[labels[0]] ?? '#B9C5FF'
}

export function TrendingMentions({ onOpenChat }: { onOpenChat?: () => void }) {
  const router = useRouter()
  const [cardHovered, setCardHovered] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  return (
    <div
      className="bg-white rounded-[24px] border border-gray-100 shadow-sm flex flex-col gap-5 p-8"
      onMouseEnter={() => setCardHovered(true)}
      onMouseLeave={() => setCardHovered(false)}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-[22px] font-heading font-medium text-gray-900 leading-snug mb-1">Trending Mentions</h2>
          <p className="text-sm text-gray-500">Based on feedback from the past 7 days</p>
        </div>
        <AnimatePresence>
          {cardHovered && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={onOpenChat}
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors"
              style={{
                backgroundColor: 'transparent',
                border: '1.5px solid #e0e2e8',
                color: '#222428',
              }}
            >
              <span className="leading-[0]"><IconSparksFilled css={{ width: 14, height: 14 }} /></span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Bars */}
      <div className="flex flex-col gap-2 flex-1">
        {ITEMS.map((item) => {
          const barPct = (item.mentions / MAX) * 100
          return (
            <div
              key={item.id}
              className="relative flex-1 cursor-pointer group self-stretch flex items-center"
              onClick={() => router.push(`/insights/themes/${item.id}`)}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div
                className="absolute left-0 top-0 bottom-0 rounded-[8px] transition-opacity group-hover:opacity-70"
                style={{ width: `${barPct}%`, backgroundColor: getBarColor(item.id) }}
              />
              <span className="relative z-10 text-[14px] font-semibold text-[#222428] leading-[1.5] ml-[21px] font-heading flex-1">
                {item.label}
              </span>
              <div className="relative z-10 pr-3 self-stretch flex items-center">
                <div className="flex flex-col items-end">
                  <span className="text-[13px] font-normal leading-none transition-colors group-hover:text-[#222428] text-[#656b81] w-[100px] text-right">
                    {item.mentions} mentions
                  </span>
                  <motion.span
                    className="text-[11px] text-[#656b81] whitespace-nowrap overflow-hidden"
                    animate={{
                      opacity: hoveredId === item.id ? 1 : 0,
                      height: hoveredId === item.id ? 14 : 0,
                      marginTop: hoveredId === item.id ? 4 : 0,
                    }}
                    transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
                  >
                    {item.change}
                  </motion.span>
                </div>
              </div>
            </div>
          )
        })}

        {/* X-axis ticks */}
        <div className="flex justify-between text-[12px] text-[#959aac] mt-6">
          {[0, 25, 50, 75, 100].map((n) => (
            <span key={n}>{n}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
