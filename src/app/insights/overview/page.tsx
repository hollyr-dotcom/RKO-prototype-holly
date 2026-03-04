'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, Users } from 'lucide-react'
import { IconSparksFilled, IconChatTwo } from '@mirohq/design-system-icons'
import InsightsTopBar from '@/components/InsightsTopBar'
import { MetricCard } from '@/components/insights/MetricCard'
import { SentimentChart } from '@/components/insights/SentimentChart'
import { ThemeMatrix } from '@/components/insights/ThemeMatrix'
import { ChatInput } from '@/components/toolbar/ChatInput'

// ─── AI Panel ─────────────────────────────────────────────────────────────────

const PROMPT_CHIPS = [
  'Give me a more detailed update',
  'Tell me about items in triage',
  'Add triage items to ideas',
]

function AIPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
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
          <div className="-mx-4 rounded-[24px] overflow-hidden py-1.5" style={{ backgroundColor: '#FBFAF7' }}>
            {PROMPT_CHIPS.map((chip) => (
              <button
                key={chip}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors"
              >
                <span className="text-gray-400 flex-shrink-0 leading-[0]">
                  <IconSparksFilled css={{ width: 16, height: 16 }} />
                </span>
                <span className="text-gray-900">{chip}</span>
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Input */}
      <div className="px-6 pb-6 pt-4 shrink-0">
        <ChatInput onSubmit={() => {}} />
      </div>
    </motion.aside>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InsightsOverviewPage() {
  const [aiOpen, setAiOpen] = useState(false)

  return (
    <div className="relative h-full w-full flex flex-col" style={{ backgroundColor: '#FBFAF7' }}>
      <InsightsTopBar />

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
            className="rounded-xl p-8 pt-[132px] mb-[60px] relative min-h-[390px] shadow-sm"
            style={{ backgroundColor: '#2A2A2D' }}
            aria-labelledby="overview-heading"
          >

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

      {/* Floating input bar */}
      {!aiOpen && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20" style={{ width: 560 }}>
          <div
            className="bg-white rounded-full"
            style={{ padding: 6, boxShadow: '0px 6px 16px 0px rgba(34,36,40,0.12), 0px 0px 8px 0px rgba(34,36,40,0.06)' }}
          >
            <ChatInput onSubmit={() => setAiOpen(true)} onOpenChat={() => setAiOpen(true)} onFocusChange={(focused) => { if (focused) setAiOpen(true) }} />
          </div>
        </div>
      )}

      {/* AI panel */}
      <AIPanel open={aiOpen} onClose={() => setAiOpen(false)} />

    </div>
  )
}
