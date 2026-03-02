'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, Users } from 'lucide-react'
import { IconSparksFilled } from '@mirohq/design-system-icons'
import InsightsTopBar from '@/components/InsightsTopBar'
import { MetricCard } from '@/components/insights/MetricCard'
import { SentimentChart } from '@/components/insights/SentimentChart'
import { ThemeMatrix } from '@/components/insights/ThemeMatrix'

// ─── AI Panel ─────────────────────────────────────────────────────────────────

const PROMPT_CHIPS = [
  'Give me a more detailed update',
  'Tell me about items in triage',
  'Add triage items to ideas',
]

function AIPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [input, setInput] = useState('')

  if (!open) return null

  return (
    <motion.aside
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 40, opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
      className="fixed top-4 right-4 bottom-4 w-[400px] bg-white rounded-[20px] shadow-[0_0_12px_rgba(34,36,40,0.04),-2px_0_8px_rgba(34,36,40,0.12)] flex flex-col overflow-hidden z-30"
    >
      {/* Header — absolute so body content sits beneath it */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-6 border-b border-[#e0e2e8] bg-white z-10">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: '#3859FF' }}
          >
            <span className="text-white leading-[0] flex items-center justify-center">
              <IconSparksFilled css={{ width: 16, height: 16 }} />
            </span>
          </div>
          <p className="text-[#222428] text-base font-semibold" style={{ fontFamily: 'Roobert, sans-serif' }}>
            Insights Assistant
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center text-[#656b81] hover:text-[#222428] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Body — flex-col justify-end so content sits at the bottom */}
      <div className="flex-1 overflow-y-auto flex flex-col justify-end px-6 pb-0 pt-24">
        <div className="flex flex-col gap-6 px-4">

          {/* Agent avatar pill */}
          <div className="flex items-start">
            <div className="flex items-center gap-1 bg-[#f1f2f5] rounded-full pr-2">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: '#3859FF' }}
              >
                <span className="text-white leading-[0] flex items-center justify-center">
                  <IconSparksFilled css={{ width: 16, height: 16 }} />
                </span>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 6L8 10L12 6" stroke="#222428" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {/* Welcome + description */}
          <div className="flex flex-col gap-2">
            <p className="text-[#222428] text-[28px] font-serif leading-[1.4]">
              Hi, Kajsa
            </p>
            <div className="text-[#656b81] text-[16px] leading-[1.5]">
              <p>
                Since last time: a comprehensive review of &lsquo;Fiesta Insights&rsquo; was conducted to
                identify competitor strategies. An in-depth analysis of user feedback on party
                preferences and emerging trends was also performed. These insights have been
                synthesized to enhance the Invites roadmap, ensuring alignment with user
                expectations and market dynamics.
              </p>
              <p className="mt-4">
                There are two items in triage, ready for review. What&apos;s the plan?
              </p>
            </div>
          </div>

          {/* Prompt chips */}
          <div className="flex flex-col gap-3">
            {PROMPT_CHIPS.map((chip) => (
              <button
                key={chip}
                className="flex items-center gap-1 h-8 pl-3 pr-2 border border-[#e0e2e8] rounded-[8px] bg-white text-[14px] text-[#222428] hover:bg-[#f1f2f5] transition-colors text-left w-fit"
              >
                {/* Article / document icon */}
                <span className="shrink-0 opacity-70 leading-[0] flex items-center justify-center">
                  <IconSparksFilled css={{ width: 16, height: 16 }} />
                </span>
                <span className="pr-1">{chip}</span>
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Input */}
      <div className="px-6 pb-6 pt-6 shrink-0">
        <div className="border border-[#e0e2e8] rounded-[8px] overflow-hidden">
          <div className="px-4 pt-4 pb-6">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="What can I do next?"
              className="w-full text-[14px] text-[#222428] placeholder-[#7d8297] bg-transparent outline-none"
            />
          </div>
          <div className="flex items-center justify-between px-2 py-2">
            {/* Leading icons: +, search, sliders */}
            <div className="flex items-center">
              <button className="w-8 h-8 flex items-center justify-center rounded text-[#656b81] hover:bg-[#f1f2f5] transition-colors">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded text-[#656b81] hover:bg-[#f1f2f5] transition-colors">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="6.5" cy="6.5" r="3.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded text-[#656b81] hover:bg-[#f1f2f5] transition-colors">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2.5 4h11M2.5 8h11M2.5 12h11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  <circle cx="5.5" cy="4" r="1.5" fill="white" stroke="currentColor" strokeWidth="1.3" />
                  <circle cx="10.5" cy="8" r="1.5" fill="white" stroke="currentColor" strokeWidth="1.3" />
                  <circle cx="5.5" cy="12" r="1.5" fill="white" stroke="currentColor" strokeWidth="1.3" />
                </svg>
              </button>
            </div>
            {/* Trailing: up arrow (disabled) */}
            <button className="w-8 h-8 flex items-center justify-center rounded bg-[#e9eaef] text-[#656b81]">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 12V4M4 8l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </motion.aside>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InsightsOverviewPage() {
  const [aiOpen, setAiOpen] = useState(true)

  return (
    <div className="relative h-full w-full flex flex-col" style={{ backgroundColor: '#FBFAF7' }}>
      <InsightsTopBar onPromptClick={() => setAiOpen(true)} />

      <div
        className="flex-1 overflow-y-auto"
        style={{ paddingRight: aiOpen ? 400 : 0, transition: 'padding-right 0.25s ease' }}
      >
        <main className="px-0 py-[60px] mx-[60px]">

          {/* Overview section */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
            className="rounded-xl p-8 pt-[132px] mb-[60px] relative min-h-[440px] shadow-sm"
            style={{ backgroundColor: '#2A2A2D' }}
            aria-labelledby="overview-heading"
          >
            {/* Top-right badges */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1.5 border border-white/20">
                <Users className="w-3.5 h-3.5 text-white/70" />
                <span className="text-xs font-medium text-white">21</span>
              </div>
              <button
                className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-3.5 h-3.5 text-white/70" />
              </button>
              <div className="flex -space-x-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 border-2 border-white flex items-center justify-center">
                  <span className="text-white text-[10px] font-semibold">A</span>
                </div>
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 border-2 border-white flex items-center justify-center">
                  <span className="text-white text-[10px] font-semibold">B</span>
                </div>
              </div>
            </div>

            <div className="absolute bottom-8 left-8">
              <h1 id="overview-heading" className="text-[60px] font-serif text-white mb-3">
                Overview
              </h1>
              <p className="text-[20px] text-white/70 max-w-md leading-relaxed">
                Gain a high-level overview of key insights, emerging trends, and important updates.
              </p>
            </div>
          </motion.section>

          {/* Metric cards */}
          <div className={`grid gap-4 mb-[60px] ${aiOpen ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`}>
            <MetricCard
              label="Feature adoption"
              value="+8.5%"
              sub="20%"
              background="#f1fecf"
              description={
                <>
                  Improved by visual polish fixes shipped this sprint. New suggestion added{' '}
                  <a href="#" className="underline text-[#222428] font-medium hover:text-[#3859ff] transition-colors">
                    Visual Polish Improvements.
                  </a>
                </>
              }
            />
            <MetricCard
              label="Active Users"
              value="+12.1%"
              sub="13,444"
              background="#dce8ff"
              description={
                <>
                  Driven by Canvas performance improvements, Zapier web hooks. New theme added{' '}
                  <a href="#" className="underline text-[#222428] font-medium hover:text-[#3859ff] transition-colors">
                    Canvas Performance
                  </a>
                </>
              }
            />
            <MetricCard
              label="New Users"
              value="+8.3%"
              sub="532"
              background="#ffd8f4"
              description={
                <>
                  Driven by{' '}
                  <a href="#" className="underline text-[#222428] font-medium hover:text-[#3859ff] transition-colors">
                    AI features,
                  </a>{' '}
                  <a href="#" className="underline text-[#222428] font-medium hover:text-[#3859ff] transition-colors">
                    Onboarding flow.
                  </a>{' '}
                  Items moved to &ldquo;Next&rdquo; on Roadmap to continue momentum.
                </>
              }
            />
            <MetricCard
              label="Average Session"
              value="-30 secs"
              sub="15m"
              background="#f8d3af"
              description="Decline led by resolved mobile crash on board entry. Recommended action is to increase monitoring."
            />
          </div>

          {/* Charts row */}
          <div className={`grid gap-4 mb-6 ${aiOpen ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
            <SentimentChart onOpenChat={() => setAiOpen(true)} />
            <ThemeMatrix />
          </div>

        </main>
      </div>

      {/* AI panel */}
      <AIPanel open={aiOpen} onClose={() => setAiOpen(false)} />

    </div>
  )
}
