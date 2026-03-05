'use client'

import React, { ReactNode, useState } from 'react'
import { motion } from 'framer-motion'

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
      <div className="rounded-[16px] flex flex-col gap-2 p-5 h-full" style={{ backgroundColor: 'white' }}>
        <p className="text-[14px] font-heading font-medium text-gray-900 leading-snug mb-1">{label}</p>
        <div>
          <p className="text-[44px] font-serif text-[#222428] leading-tight">{value}</p>
          <p className="text-sm text-gray-500 mt-1">{sub}</p>
        </div>
        <div className="text-sm text-gray-600 leading-relaxed mt-1">{description}</div>
      </div>
    </motion.article>
  )
}
