import React, { ReactNode } from 'react'

interface MetricCardProps {
  label: string
  value: string
  sub: string
  description: ReactNode
  background?: string
}

export function MetricCard({ label, value, sub, description, background = '#f1fecf' }: MetricCardProps) {
  return (
    <article
      className="rounded-[24px] border border-transparent shadow-sm p-5 flex flex-col gap-2 hover:shadow-md transition-shadow duration-200 cursor-pointer"
      style={{ backgroundColor: background }}
    >
      <p className="text-[14px] font-bold" style={{ fontFamily: 'Roobert, sans-serif', color: '#222428' }}>{label}</p>
      <div>
        <p className="text-[44px] font-serif text-[#222428] leading-tight">{value}</p>
        <p className="text-sm text-gray-500 mt-1">{sub}</p>
      </div>
      <div className="text-[12px] text-gray-600 leading-relaxed mt-1">{description}</div>
    </article>
  )
}
