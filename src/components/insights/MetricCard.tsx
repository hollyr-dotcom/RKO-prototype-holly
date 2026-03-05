'use client'

import React, { ReactNode, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface MetricCardProps {
  label: string
  value: string
  sub: string
  description: ReactNode
  background?: string
}

export function MetricCard({ label, value, sub, description, background = '#f1fecf' }: MetricCardProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.article
      className="w-full rounded-[16px] cursor-pointer shadow-sm"
      style={{ backgroundColor: background, padding: '2px 2px 6px 2px' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      animate={{ scale: hovered ? 1.02 : 1 }}
      transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
    >
      <div className="rounded-[16px] flex flex-col gap-2 p-5 h-full relative" style={{ backgroundColor: 'white' }}>
        <div className="flex items-center justify-between">
          <p className="text-[14px] font-heading font-medium text-gray-900 leading-snug mb-1">{label}</p>
          <AnimatePresence>
            {hovered && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-center justify-center w-6 h-6 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors -mt-1 -mr-1 shrink-0"
              >
                <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                  <rect x="4" y="4" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M2 10V2h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        <div>
          <p className="text-[44px] font-serif text-[#222428] leading-tight">{value}</p>
          <p className="text-sm text-gray-500 mt-1">{sub}</p>
        </div>
        <div className="text-sm text-gray-600 leading-relaxed mt-1">{description}</div>
      </div>
    </motion.article>
  )
}
