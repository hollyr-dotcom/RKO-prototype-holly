'use client'

import React, { ReactNode, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { IconSparksFilled } from '@mirohq/design-system-icons'

interface MetricCardProps {
  label: string
  value: string
  sub: string
  description: ReactNode
  background?: string
  onOpenChat?: () => void
}

export function MetricCard({ label, value, sub, description, background = '#f1fecf', onOpenChat }: MetricCardProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.article
      className="w-full rounded-[16px] cursor-pointer flex flex-col gap-2 p-5 relative shadow-sm"
      style={{ backgroundColor: 'white' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      animate={{ scale: hovered ? 1.02 : 1 }}
      transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
    >
        <div className="flex items-center justify-between">
          <p className="text-[14px] font-heading font-medium text-gray-900 leading-snug mb-1">{label}</p>
          <AnimatePresence>
            {hovered && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors"
                style={{ backgroundColor: 'transparent', border: '1.5px solid #e0e2e8', color: '#222428' }}
                onClick={(e) => { e.stopPropagation(); onOpenChat?.() }}
              >
                <span className="leading-[0]"><IconSparksFilled css={{ width: 14, height: 14 }} /></span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        <div>
          <p className="text-[44px] font-serif text-[#222428] leading-tight">{value}</p>
          <p className="text-sm text-gray-500 mt-1">{sub}</p>
        </div>
        <div className="text-sm text-gray-600 leading-relaxed mt-1">{description}</div>
    </motion.article>
  )
}
