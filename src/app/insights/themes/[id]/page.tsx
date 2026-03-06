'use client'

import React, { useState, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Play, Search, SlidersHorizontal, ChevronDown, RotateCcw, ThumbsUp, MoreVertical } from 'lucide-react'
import { IconSparksFilled, IconSmileyChat, IconGlobe, IconExclamationPointCircle, IconChartLine, IconArrowDown, IconChatLinesTwo, IconChatTwo } from '@mirohq/design-system-icons'
import InsightsTopBar from '@/components/InsightsTopBar'
import { THEME_CARDS, THEME_ANALYSIS, type ThemeCard } from '@/data/themes-data'
import { ChatInput } from '@/components/toolbar/ChatInput'

// ─── Tag colour map ────────────────────────────────────────────────────────────

const TAG_COLORS: Record<string, string> = {
  New: '#BADEB1',
  Urgent: '#FFD8F4',
  Customer: '#FFF6B6',
  Market: '#C6DCFF',
  Strengthening: '#F8D3AF',
  Weakening: '#DEDAFF',
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function AudioIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
      <path d="M8 1v14M5 3.5v9M11 3.5v9M2 6v4M14 6v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}
function MobileIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
      <rect x="4" y="1" width="8" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="8" cy="12.5" r="0.75" fill="currentColor" />
    </svg>
  )
}
function GongIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <circle cx="6" cy="6" r="5" stroke="#656b81" strokeWidth="1.1" />
      <circle cx="6" cy="6" r="2" fill="#656b81" />
    </svg>
  )
}
function CalendarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <rect x="1" y="2" width="10" height="9" rx="1" stroke="#656b81" strokeWidth="1.1" />
      <path d="M1 5h10M4 1v2M8 1v2" stroke="#656b81" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  )
}
function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="4" y="4" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2 10V2h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function BookmarkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16">
      <path className="fill-none" d="M4 2h8a1 1 0 011 1v10l-5-3-5 3V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}
function MoreIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16">
      <circle cx="8" cy="4" r="1" className="fill-none" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="8" cy="8" r="1" className="fill-none" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="8" cy="12" r="1" className="fill-none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}
function ThumbsUpIcon() {
  return <ThumbsUp size={14} strokeWidth={1.5} />
}
function GiftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="7" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <path d="M1 7h14v2H1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M8 7V15" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M8 7C8 7 6 5.5 5.5 4.5C5 3.5 5.5 2 7 2C8 2 8 3.5 8 7Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M8 7C8 7 10 5.5 10.5 4.5C11 3.5 10.5 2 9 2C8 2 8 3.5 8 7Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}

function SourceIconComp({ type }: { type: string }) {
  return (
    <div className="w-8 h-8 rounded-[24px] flex items-center justify-center text-[#2B2D33]">
      {type === 'audio' ? <AudioIcon /> : type === 'mobile' ? <MobileIcon /> : <IconChatLinesTwo css={{ width: 20, height: 20 }} />}
    </div>
  )
}

function TagPill({ label }: { label: string }) {
  const bg = TAG_COLORS[label] ?? '#e9eaef'
  return (
    <span className="flex items-center gap-1 py-1.5 px-2.5 rounded-full border text-xs text-[#222428]" style={{ backgroundColor: bg, borderColor: bg }}>
      {label === 'New' && <GiftIcon />}
      {label === 'Customer' && <IconSmileyChat css={{ width: 12, height: 12 }} />}
      {label === 'Market' && <IconGlobe css={{ width: 12, height: 12 }} />}
      {label === 'Urgent' && <IconExclamationPointCircle css={{ width: 12, height: 12 }} />}
      {label === 'Strengthening' && <IconChartLine css={{ width: 12, height: 12 }} />}
      {label === 'Weakening' && <IconArrowDown css={{ width: 12, height: 12 }} />}
      {label}
    </span>
  )
}

// ─── Featured cards ────────────────────────────────────────────────────────────

const CARD_ACCENT: Record<string, string> = {
  audio: '#DEDAFF',
  clips: '#b9b5ff',
  quote: '#ffdc4a',

}

const FEATURED_CARDS = [
  { id: '1', type: 'audio' as const, badge: '1 Clip', title: 'User Interview: Sam Ledezma', description: 'Discussion on "Heavy Board" load times and visual comfort.', date: 'Jul 14', source: 'Gong', person: 'Sam Ledezma', company: 'Figma', accent: '#BADEB1' },
  { id: '2', type: 'audio' as const, badge: '1 Clip', title: 'Call with Siemens Admin', description: 'Ayoub El Assri discusses SCIM provisioning hurdles.', date: 'Jul 14', source: 'Gong', person: 'Ayoub El Assri', company: 'Siemens' },
  { id: '3', type: 'quote' as const, quote: '"The new feature clearly drives revenue when adopted, but most users aren\'t getting there. We\'re investing in big bets while the core experience that drives engagement feels stuck."', duration: '32m 34s', title: 'Call with Spotify', person: 'John Cusick', company: 'Spotify', date: 'Jul 14', source: 'Gong', logo: 'spotify' },
  { id: '4', type: 'quote' as const, quote: '"The Miro Assist summarization has cut our research review time by 60%… We can now cluster insights across thousands of sticky notes in seconds."', duration: '12m 04s', title: 'Call with Apple', person: 'James Watson', company: 'Apple', date: 'Jul 14', source: 'Gong', logo: 'apple' },
  { id: '5', type: 'audio' as const, badge: '1 Clip', title: 'User Interview: Priya Nair', description: 'Frustration with AI suggestions appearing mid-session — breaks focus during live workshops.', date: 'Jul 18', source: 'Gong', person: 'Priya Nair', company: 'Miro', accent: '#BADEB1' },
  { id: '6', type: 'audio' as const, badge: '1 Clip', title: 'Call with Adobe', description: 'Team requests persistent cursor visibility across large boards during collaborative reviews.', date: 'Jul 21', source: 'Gong', person: 'Sofia Reyes', company: 'Adobe', accent: '#BADEB1' },
  { id: '7', type: 'quote' as const, quote: '"We run design sprints with 40+ people on a single board. The lag when everyone is active at once is a dealbreaker — we\'ve nearly lost the account over it."', duration: '28m 12s', title: 'Call with Spotify', person: 'Anna Bergström', company: 'Spotify', date: 'Jul 22', source: 'Gong', logo: 'spotify' },
  { id: '8', type: 'quote' as const, quote: '"We need SSO that actually works with our IdP out of the box. Every workaround costs us an IT sprint and delays our org-wide rollout."', duration: '41m 07s', title: 'Call with Apple', person: 'Derek Chu', company: 'Apple', date: 'Jul 25', source: 'Gong', logo: 'apple' },
  { id: '9', type: 'audio' as const, badge: '1 Clip', title: 'User Interview: Tomás Herrera', description: 'Wants template locking so junior designers can\'t accidentally overwrite research structures.', date: 'Aug 1', source: 'Gong', person: 'Tomás Herrera', company: 'Atlassian' },
  { id: '10', type: 'audio' as const, badge: '1 Clip', title: 'Call with Siemens PM', description: 'Requesting granular export controls — PDF fidelity and selective frame exports are blocking enterprise handoff.', date: 'Aug 3', source: 'Gong', person: 'Klaus Weber', company: 'Siemens' },
  { id: '11', type: 'quote' as const, quote: '"Diagramming in Miro is close but the auto-layout still falls short for complex system maps. One misaligned node and the whole thing breaks."', duration: '19m 48s', title: 'Call with Spotify', person: 'Clara Johansson', company: 'Spotify', date: 'Aug 6', source: 'Gong', logo: 'spotify' },
  { id: '12', type: 'audio' as const, badge: '1 Clip', title: 'User Interview: Kenji Watanabe', description: 'Wants real-time translation in sticky notes for cross-regional workshops — a blocker for APAC teams.', date: 'Aug 8', source: 'Gong', person: 'Kenji Watanabe', company: 'Sony', accent: '#BADEB1' },
]


function SpotifyLogoMark() {
  return (
    <div className="w-6 h-6 rounded-full bg-[#1DB954] flex items-center justify-center shrink-0">
      <svg width="13" height="13" viewBox="0 0 11 11" fill="none">
        <path d="M1.5 3.5C4 2.5 7 2.8 9 4M2 5.5C4 4.7 7 5 8.5 6M2.5 7.5C4 6.9 6.5 7.1 8 8" stroke="white" strokeWidth="1" strokeLinecap="round" />
      </svg>
    </div>
  )
}

function AppleLogoMark() {
  return (
    <div className="w-6 h-6 rounded-full bg-[#222428] flex items-center justify-center shrink-0">
      <svg width="12" height="14" viewBox="0 0 10 12" fill="white">
        <path d="M8.3 6.4c0-1.5 1.2-2.2 1.3-2.3C8.8 2.7 7.4 2.5 6.9 2.5c-1.1 0-2 .7-2.6.7-.6 0-1.5-.6-2.5-.6C.6 2.6 0 3.5 0 4.9c0 2.7 2.3 6.5 3.3 6.5.5 0 1-.6 1.8-.6.8 0 1.1.6 1.9.6C8 11.4 9 8.3 9 8.2c-.1 0-1-.4-1-1.8zM6.3.9C6.7.4 7 0 7-.3c-1 .1-2.2.8-2.9 1.5-.4.5-.8 1.2-.7 1.9.9 0 1.6-.5 2-1.2z" />
      </svg>
    </div>
  )
}

function FeaturedCard({ card, accent: accentOverride, onCopy }: { card: typeof FEATURED_CARDS[0], accent?: string, onCopy?: (card: typeof FEATURED_CARDS[0]) => void }) {
  const accent = accentOverride ?? (('accent' in card && card.accent) ? card.accent as string : CARD_ACCENT[card.type])
  const [hovered, setHovered] = useState(false)
  return (
    <motion.div
      className="w-full h-full rounded-[16px] cursor-pointer"
      style={{ backgroundColor: accent + '66', padding: '2px 2px 6px 2px' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      animate={{ scale: hovered ? 1.02 : 1 }}
      transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
    >
      <div className="bg-white rounded-[16px] flex flex-col gap-3 p-6 h-full relative">
        {/* Copy button — outside overflow-hidden so it's always clickable */}
        <AnimatePresence>
          {hovered && (
            <motion.button
              key="copy-btn"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute top-3 right-3 w-7 h-7 rounded-full border border-[#e0e2e8] bg-white flex items-center justify-center text-[#656b81] hover:text-[#222428] z-10"
              onClick={(e) => { e.stopPropagation(); onCopy?.(card) }}
            >
              <CopyIcon />
            </motion.button>
          )}
        </AnimatePresence>
        <div className="rounded-[12px] overflow-hidden shrink-0" style={{ height: card.type === 'quote' ? 220 : 162 }}>
          {card.type === 'audio' && (
            <div className="h-full to-white flex items-center justify-center" style={{ background: `linear-gradient(to bottom, ${accent}, white)` }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: accent }}>
                <Play className="w-4 h-4 text-[#222428] fill-[#222428] ml-0.5" />
              </div>
            </div>
          )}
          {card.type === 'quote' && (
            <div className="h-full flex flex-col items-center justify-center gap-2 px-5 py-6" style={{ background: `linear-gradient(to bottom, ${accent}, white)` }}>
              <p className="text-[14px] font-semibold text-[#222428] text-center leading-[1.4]">{card.quote}</p>
              {'duration' in card && <p className="text-[12px] text-[#656b81] text-center">{card.duration}</p>}
            </div>
          )}
        </div>

        <div className={`flex flex-col gap-1 flex-1 min-h-0 ${card.type !== 'quote' ? 'justify-end' : ''}`}>
          {card.type !== 'quote' && (
            <>
              {card.type === 'audio' && (
                <span className="h-5 px-2 bg-[#222428] text-white text-[10px] font-medium rounded-[24px] flex items-center w-fit mb-0.5">
                  {card.badge}
                </span>
              )}
              <p className="text-lg font-heading font-medium text-gray-900 leading-snug">{card.title}</p>
              {'description' in card && card.description && <p className="text-[12px] text-[#656b81] leading-[1.4]">{card.description}</p>}
            </>
          )}
          {card.type === 'quote' && (
            <div className="flex flex-col gap-0.5">
              <p className="text-lg font-heading font-medium text-gray-900 leading-snug">{card.title}</p>
              <p className="text-[12px] text-[#656b81]">{'person' in card ? card.person : ''}</p>
            </div>
          )}
        </div>

        <AnimatePresence>
          {hovered && (
            <motion.div
              className="flex items-center gap-1.5 overflow-x-auto shrink-0 no-scrollbar"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15, ease: [0.2, 0, 0, 1] }}
            >
              <span className="flex items-center gap-1 py-1.5 px-2.5 rounded-full border text-xs text-[#222428] shrink-0 whitespace-nowrap" style={{ backgroundColor: '#e9eaef', borderColor: '#e9eaef' }}>
                <GongIcon />Gong
              </span>
              {'company' in card && card.company && (
                <span className="flex items-center gap-1 py-1.5 px-2.5 rounded-full border text-xs text-[#222428] shrink-0 whitespace-nowrap" style={{ backgroundColor: '#e9eaef', borderColor: '#e9eaef' }}>
                  {card.company as string}
                </span>
              )}
              {'person' in card && card.person && (
                <span className="flex items-center gap-1 py-1.5 px-2.5 rounded-full border text-xs text-[#222428] shrink-0 whitespace-nowrap" style={{ backgroundColor: '#e9eaef', borderColor: '#e9eaef' }}>
                  {card.person}
                </span>
              )}
              <span className="flex items-center gap-1 py-1.5 px-2.5 rounded-full border text-xs text-[#222428] shrink-0 whitespace-nowrap" style={{ backgroundColor: '#e9eaef', borderColor: '#e9eaef' }}>
                <CalendarIcon />{card.date}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// ─── Detail signals table ──────────────────────────────────────────────────────

const DETAIL_SIGNALS = [
  { id: '1', sourceIcon: 'audio', title: 'Canvas lag with 40+ concurrent users', description: 'Three enterprise accounts flagged as Q3 retention blocker.', person: { name: 'Zac Brown', initials: 'ZB', bg: '#FFF6B6' }, revenue: '$2.1M', company: { name: 'Google', letter: 'G', bg: '#4285F4' }, feedback: { survey: 110, call: 62, message: 18, appStore: 30 } },
  { id: '2', sourceIcon: 'globe', title: 'AI suggestions interrupt live workshops', description: 'Mid-session interruptions break workshop flow and focus.', person: { name: 'Sarah B', initials: 'SB', bg: '#FFD8F4' }, revenue: '$850K', company: { name: 'Blizzard', letter: 'B', bg: '#00AEFF' }, feedback: { survey: 42, call: 28, message: 14, appStore: 9 } },
  { id: '3', sourceIcon: 'mobile', title: 'Cursors invisible to collaborators on 4K boards', description: 'Collaboration breaks down when cursor presence disappears.', person: { name: 'Mika B', initials: 'MB', bg: '#BADEB1' }, revenue: '$620K', company: { name: 'Apple', letter: 'A', bg: '#555' }, feedback: { survey: 30, call: 15, message: 22, appStore: 18 } },
  { id: '4', sourceIcon: 'globe', title: 'SAML / SSO breaks with Okta and Azure AD', description: 'Six-figure deals stalled at procurement over SSO failures.', person: { name: 'Zac Brown', initials: 'ZB', bg: '#FFF6B6' }, revenue: '$1.4M', company: { name: 'Adobe', letter: 'A', bg: '#E0001B' }, feedback: { survey: 74, call: 55, message: 8, appStore: 12 } },
  { id: '5', sourceIcon: 'audio', title: 'PDF exports lose fonts on large frames', description: 'Enterprise handoff workflows blocked by export fidelity.', person: { name: 'Sarah B', initials: 'SB', bg: '#FFD8F4' }, revenue: '$540K', company: { name: 'Google', letter: 'G', bg: '#4285F4' }, feedback: { survey: 28, call: 19, message: 11, appStore: 6 } },
  { id: '6', sourceIcon: 'mobile', title: 'SCIM provisioning fails silently on first sync', description: 'IT teams report silent failures blocking org-wide rollouts.', person: { name: 'Mika B', initials: 'MB', bg: '#BADEB1' }, revenue: '$1.1M', company: { name: 'Apple', letter: 'A', bg: '#555' }, feedback: { survey: 58, call: 40, message: 20, appStore: 15 } },
  { id: '7', sourceIcon: 'globe', title: 'Boards with 500+ objects take 8+ seconds to load', description: 'Heavy boards cause session abandonment in enterprise accounts.', person: { name: 'Zac Brown', initials: 'ZB', bg: '#FFF6B6' }, revenue: '$760K', company: { name: 'Blizzard', letter: 'B', bg: '#00AEFF' }, feedback: { survey: 38, call: 24, message: 16, appStore: 10 } },
  { id: '8', sourceIcon: 'audio', title: 'Auto-layout breaks on complex system maps', description: 'Architecture diagrams with 50+ nodes fail to auto-arrange.', person: { name: 'Sarah B', initials: 'SB', bg: '#FFD8F4' }, revenue: '$720K', company: { name: 'Adobe', letter: 'A', bg: '#E0001B' }, feedback: { survey: 36, call: 22, message: 19, appStore: 13 } },
]

// ─── Signal chips (used in AI panel) ─────────────────────────────────────────

const SIGNAL_CHIPS = [
  'Map this signal to an opportunity',
  'Show related signals',
  'Draft a roadmap recommendation',
]

// ─── AI Panel ─────────────────────────────────────────────────────────────────

function AIPanel({ open, onClose, theme, showAnalysis, onDismissAnalysis, selectedSignal, onClearSignal, copiedCard, onClearCopied }: {
  open: boolean
  onClose: () => void
  theme: ThemeCard
  showAnalysis?: boolean
  onDismissAnalysis?: () => void
  selectedSignal: typeof DETAIL_SIGNALS[0] | null
  onClearSignal: () => void
  copiedCard?: typeof FEATURED_CARDS[0] | null
  onClearCopied?: () => void
}) {
  const [signalTab, setSignalTab] = useState<'summary' | 'feedback' | 'details' | 'updates'>('summary')
  const [hoveredFeedback, setHoveredFeedback] = useState<number | null>(null)
  const analysisData = THEME_ANALYSIS['analysis-' + theme.id]

  // Reset tab when signal changes
  const prevSignalId = React.useRef<string | null>(null)
  if (selectedSignal?.id !== prevSignalId.current) {
    prevSignalId.current = selectedSignal?.id ?? null
    if (signalTab !== 'summary') setSignalTab('summary')
  }

  if (!open) return null

  const showBack = !!selectedSignal || !!showAnalysis || !!copiedCard
  const handleBack = selectedSignal ? onClearSignal : copiedCard ? onClearCopied : onDismissAnalysis

  let signalMentions = 0, signalCustomers = 0, signalWow = ''
  let feedbackTotal = 0, feedbackGradient = ''
  let feedbackItems: { color: string; label: string; value: number }[] = []
  if (selectedSignal) {
    const revenueNum = parseFloat(selectedSignal.revenue.replace(/[^0-9.]/g, ''))
    const isMillions = selectedSignal.revenue.includes('M')
    const revenueK = isMillions ? revenueNum * 1000 : revenueNum
    signalMentions = Math.round(revenueK * 0.14 + 40)
    signalCustomers = Math.round(revenueK * 0.008 + 5)
    signalWow = `+${Math.round(revenueK * 0.012 + 8)}%`

    const fb = selectedSignal.feedback
    feedbackTotal = fb.survey + fb.call + fb.message + fb.appStore
    feedbackItems = [
      { color: '#b5a9ff', label: 'Survey', value: fb.survey },
      { color: '#ffabec', label: 'Call', value: fb.call },
      { color: '#ffbd83', label: 'Message', value: fb.message },
      { color: '#c2eb7f', label: 'App Store', value: fb.appStore },
    ]
    const gap = 0.4
    const s = (fb.survey / feedbackTotal) * 100
    const c = (fb.call / feedbackTotal) * 100
    const m = (fb.message / feedbackTotal) * 100
    const s2 = s + gap, c2 = s2 + c, c3 = c2 + gap, m2 = c3 + m, m3 = m2 + gap
    feedbackGradient = `conic-gradient(#b5a9ff 0% ${s.toFixed(1)}%, white ${s.toFixed(1)}% ${s2.toFixed(1)}%, #ffabec ${s2.toFixed(1)}% ${c2.toFixed(1)}%, white ${c2.toFixed(1)}% ${c3.toFixed(1)}%, #ffbd83 ${c3.toFixed(1)}% ${m2.toFixed(1)}%, white ${m2.toFixed(1)}% ${m3.toFixed(1)}%, #c2eb7f ${m3.toFixed(1)}% 100%)`
  }

  const SIGNAL_TABS = ['Summary', 'Feedback', 'Details', 'Updates'] as const

  return (
    <motion.aside
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 40, opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
      className="fixed top-4 right-4 bottom-4 w-[472px] bg-white rounded-[20px] shadow-[0_0_12px_rgba(34,36,40,0.04),-2px_0_8px_rgba(34,36,40,0.12)] flex flex-col overflow-hidden z-30"
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-6 bg-white z-10">
        <div className="flex items-center gap-3">
          {showBack ? (
            <button onClick={handleBack} className="flex items-center gap-2 text-[#656b81] hover:text-[#222428] transition-colors">
              <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                <path d="M7 1L1 7L7 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-sm font-medium">Back</span>
            </button>
          ) : (
            <p className="text-[#222428] text-[18px] font-heading font-medium" style={{ fontFamily: 'Roobert, sans-serif' }}>Insights Assistant</p>
          )}
        </div>
        <button onClick={onClose} className="w-6 h-6 flex items-center justify-center text-[#656b81] hover:text-[#222428] transition-colors">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Body — animated between views */}
      <AnimatePresence mode="wait">
        {copiedCard ? (
          <motion.div
            key={`copied-${copiedCard.id}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
            className="flex-1 overflow-y-auto px-6 pb-6 pt-24 flex flex-col gap-5"
          >
            {/* User bubble */}
            <div className="flex justify-end">
              <div className="max-w-[80%] bg-[#f1f2f5] rounded-[12px] px-4 py-3">
                <p className="text-[14px] text-[#222428]">Copied from Featured</p>
              </div>
            </div>

            {/* AI response with mini card */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: '#E7E7E5' }}>
                <span className="text-[#222428] leading-[0] flex items-center justify-center">
                  <IconSparksFilled css={{ width: 14, height: 14 }} />
                </span>
              </div>
              <div className="flex-1 flex flex-col gap-3">
                <p className="text-[14px] text-[#222428] leading-[1.6]">Here&apos;s the card you copied. What would you like to do with it?</p>

                {/* Mini card preview */}
                {(() => {
                  const cardAccent = TAG_COLORS[theme.tags[0]?.label] ?? CARD_ACCENT.audio
                  return (
                <div className="rounded-[14px] relative" style={{ backgroundColor: cardAccent, padding: '2px 2px 6px 2px' }}>
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                    <button className="w-6 h-6 flex items-center justify-center rounded-full text-[#aeb2c0] hover:text-[#656b81] transition-colors">
                      <MoreVertical size={14} strokeWidth={1.5} />
                    </button>
                    {copiedCard.type === 'audio' && (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: cardAccent }}>
                        <Play className="w-3 h-3 text-[#222428] fill-[#222428] ml-0.5" />
                      </div>
                    )}
                  </div>
                  <div className="rounded-[12px] bg-white px-4 pt-4 pb-4 flex flex-col gap-2.5">
                    {/* Type badge */}
                    <span className="h-5 px-2 rounded-full text-[10px] font-medium flex items-center w-fit text-white" style={{ backgroundColor: '#222428' }}>
                      {copiedCard.type === 'audio' ? (('badge' in copiedCard && copiedCard.badge) ? copiedCard.badge as string : 'Audio') : 'Quote'}
                    </span>
                    {/* Title */}
                    <p className="text-[14px] font-medium text-[#222428] leading-snug">{copiedCard.title}</p>
                    {/* Description or quote */}
                    {'description' in copiedCard && copiedCard.description && (
                      <p className="text-[12px] text-[#656b81] leading-[1.4]">{copiedCard.description as string}</p>
                    )}
                    {copiedCard.type === 'quote' && 'quote' in copiedCard && (
                      <p className="text-[12px] text-[#656b81] leading-[1.4] italic">&ldquo;{copiedCard.quote as string}&rdquo;</p>
                    )}
                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="flex items-center gap-1 py-1 px-2 rounded-full border text-[11px] text-[#222428] whitespace-nowrap" style={{ backgroundColor: '#e9eaef', borderColor: '#e9eaef' }}>
                        <GongIcon />{'source' in copiedCard ? copiedCard.source as string : 'Gong'}
                      </span>
                      {'person' in copiedCard && copiedCard.person && (
                        <span className="flex items-center gap-1 py-1 px-2 rounded-full border text-[11px] text-[#222428] whitespace-nowrap" style={{ backgroundColor: '#e9eaef', borderColor: '#e9eaef' }}>
                          {copiedCard.person as string}
                        </span>
                      )}
                      {'company' in copiedCard && copiedCard.company && (
                        <span className="flex items-center gap-1 py-1 px-2 rounded-full border text-[11px] text-[#222428] whitespace-nowrap" style={{ backgroundColor: '#e9eaef', borderColor: '#e9eaef' }}>
                          {copiedCard.company as string}
                        </span>
                      )}
                      <span className="flex items-center gap-1 py-1 px-2 rounded-full border text-[11px] text-[#222428] whitespace-nowrap" style={{ backgroundColor: '#e9eaef', borderColor: '#e9eaef' }}>
                        <CalendarIcon />{copiedCard.date}
                      </span>
                      {'duration' in copiedCard && copiedCard.duration && (
                        <span className="flex items-center gap-1 py-1 px-2 rounded-full border text-[11px] text-[#222428] whitespace-nowrap" style={{ backgroundColor: '#e9eaef', borderColor: '#e9eaef' }}>
                          {copiedCard.duration as string}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                  )
                })()}

                <a
                  href="https://replit.com/t/miro/repls/TEMPLATE-Miro-AI-First-canvas"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="self-start h-8 px-4 rounded-[18px] text-sm text-[#222428] border border-[#e0e2e8] bg-white hover:bg-[#222428] hover:text-white hover:border-[#222428] transition-colors inline-flex items-center"
                >
                  Open in Board
                </a>

              </div>
            </div>
          </motion.div>
        ) : selectedSignal ? (
          <motion.div
            key={`signal-${selectedSignal.id}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
            className="flex-1 overflow-y-auto px-6 pb-6 pt-24 flex flex-col gap-5"
          >
            <h2 className="text-[24px] font-serif text-[#222428] leading-[1.35]">{selectedSignal.title}</h2>

            {/* Tabs */}
            <div className="flex items-center gap-0.5 flex-wrap">
              {SIGNAL_TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSignalTab(tab.toLowerCase() as typeof signalTab)}
                  className={`h-8 px-3 rounded-[24px] text-[14px] font-semibold transition-colors ${
                    signalTab === tab.toLowerCase() ? 'bg-[#E7E7E5] text-[#222428]' : 'text-[#656b81] hover:bg-[#FBFAF7]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {signalTab === 'summary' && (
              <>
                <p className="text-[16px] text-[#656b81] leading-[1.6]">
                  {selectedSignal.description} With an estimated {selectedSignal.revenue} ARR impact, it represents a meaningful opportunity to address unmet needs and improve retention.
                </p>
                <div className="flex flex-col gap-2">
                  <h3 className="text-[20px] font-serif text-[#222428]">Confidence drivers</h3>
                  <div className="grid grid-cols-2">
                    {[
                      { value: signalMentions, label: 'Total Mentions' },
                      { value: signalCustomers, label: 'Unique Customers' },
                      { value: selectedSignal.revenue, label: 'Est. ARR Impact' },
                      { value: signalWow, label: 'Frequency (WoW)' },
                    ].map((stat) => (
                      <div key={stat.label} className="py-3">
                        <p className="text-[32px] font-serif text-[#222428] leading-[1.2]">{stat.value}</p>
                        <p className="text-[14px] text-[#656b81] mt-1">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-[#e0e2e8]" />

                <div className="flex flex-col gap-4">
                  <h3 className="text-[20px] font-serif text-[#222428]">Total feedback</h3>
                  <div className="flex items-center gap-6">
                    <div className="relative w-[140px] h-[140px] shrink-0">
                      <div className="w-full h-full rounded-full" style={{ background: feedbackGradient }} />
                      <div className="absolute inset-[22%] bg-white rounded-full flex items-center justify-center">
                        <span className="text-[24px] font-serif text-[#222428]">{feedbackTotal}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                      {feedbackItems.map((item) => (
                        <div key={item.label} className="flex items-center gap-2">
                          <div className="w-1 rounded-full self-stretch shrink-0" style={{ backgroundColor: item.color }} />
                          <div>
                            <p className="text-[12px] text-[#656b81]">{item.label}</p>
                            <p className="text-[18px] text-[#222428] leading-[1.2]">{item.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {signalTab === 'feedback' && (
              <div className="flex flex-col gap-3">
                {[
                  { type: 'Request' as const, tagColor: '#BADEB1', text: `Users are reporting that ${selectedSignal.title.toLowerCase()} is creating friction in their workflow.`, author: selectedSignal.person.name, date: 'Added 1 month ago', stars: null },
                  { type: 'Problem' as const, tagColor: '#FFD8F4', text: `"The overall experience feels slow and unresponsive when this issue occurs. Each attempt is followed by a noticeable delay."`, author: 'Marco Rossi, PM', date: 'Added 1 month ago', stars: 2 },
                  { type: 'Praise' as const, tagColor: '#DEDAFF', text: `When it works well, the experience is seamless. Users appreciate the reliability when things are functioning as expected.`, author: 'Priya Nair, Designer', date: 'Added 2 months ago', stars: null },
                ].map((item, i) => (
                  <motion.div layout key={i} className="rounded-[16px]" style={{ backgroundColor: item.tagColor, padding: '2px 2px 6px 2px' }}
                    onMouseEnter={() => setHoveredFeedback(i)}
                    onMouseLeave={() => setHoveredFeedback(null)}
                  >
                  <div className="rounded-[16px] bg-white p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center h-6 px-2 rounded-full text-xs text-[#222428]" style={{ backgroundColor: item.tagColor }}>{item.type}</span>
                      <button className="w-6 h-6 flex items-center justify-center text-[#aeb2c0] hover:text-[#656b81] transition-colors">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                          <circle cx="8" cy="3" r="1.2" /><circle cx="8" cy="8" r="1.2" /><circle cx="8" cy="13" r="1.2" />
                        </svg>
                      </button>
                    </div>
                    {item.stars !== null && (
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }, (_, si) => (
                          <svg key={si} width="14" height="14" viewBox="0 0 16 16" fill={si < item.stars! ? '#222428' : '#e0e2e8'}>
                            <path d="M8 1l1.8 3.6L14 5.3l-3 2.9.7 4.1L8 10.4l-3.7 1.9.7-4.1-3-2.9 4.2-.7L8 1z" />
                          </svg>
                        ))}
                      </div>
                    )}
                    <p className="text-[13px] leading-[1.6] text-[#222428]">{item.text}</p>
                    <AnimatePresence mode="wait">
                      {hoveredFeedback === i ? (
                        <motion.div
                          key="chips"
                          className="flex items-center gap-1.5 overflow-x-auto shrink-0 no-scrollbar"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          transition={{ duration: 0.15, ease: [0.2, 0, 0, 1] }}
                        >
                          <span className="flex items-center gap-1 py-1.5 px-2.5 rounded-full border text-xs text-[#222428] shrink-0 whitespace-nowrap" style={{ backgroundColor: '#e9eaef', borderColor: '#e9eaef' }}>
                            <GongIcon />Gong
                          </span>
                          <span className="flex items-center gap-1 py-1.5 px-2.5 rounded-full border text-xs text-[#222428] shrink-0 whitespace-nowrap" style={{ backgroundColor: '#e9eaef', borderColor: '#e9eaef' }}>
                            {item.author.split(',')[0]}
                          </span>
                          <span className="flex items-center gap-1 py-1.5 px-2.5 rounded-full border text-xs text-[#222428] shrink-0 whitespace-nowrap" style={{ backgroundColor: '#e9eaef', borderColor: '#e9eaef' }}>
                            <CalendarIcon />{item.date.replace('Added ', '')}
                          </span>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="text"
                          className="flex flex-col gap-0.5"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.1 }}
                        >
                          <span className="text-[12px] font-medium text-[#222428]">{item.author}</span>
                          <span className="text-[11px] text-[#aeb2c0]">{item.date}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  </motion.div>
                ))}
              </div>
            )}

            {signalTab === 'details' && (
              <div>
                {[
                  { label: 'Source', value: selectedSignal.sourceIcon === 'audio' ? 'Audio / Gong' : selectedSignal.sourceIcon === 'globe' ? 'Web / Market' : 'Mobile / App Store' },
                  { label: 'Person', value: selectedSignal.person.name },
                  { label: 'Est. ARR impact', value: selectedSignal.revenue + ' ARR' },
                  { label: 'Company', value: selectedSignal.company.name },
                  { label: 'Total mentions', value: String(signalMentions) },
                  { label: 'Unique customers', value: String(signalCustomers) },
                  { label: 'Frequency (WoW)', value: signalWow },
                ].map((row) => (
                  <div key={row.label} className="grid gap-6 py-3.5 border-b border-[#f1f2f5] last:border-0 items-start" style={{ gridTemplateColumns: '140px 1fr' }}>
                    <span className="text-sm text-[#656b81]">{row.label}</span>
                    <span className="text-sm text-[#222428]">{row.value}</span>
                  </div>
                ))}
              </div>
            )}

            {signalTab === 'updates' && (
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: '#E7E7E5' }}>
                    <span className="text-[#222428] leading-[0] flex items-center justify-center">
                      <IconSparksFilled css={{ width: 14, height: 14 }} />
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-[#222428]">Signal added</span>
                      <span className="text-[12px] text-[#aeb2c0]">Jul 14</span>
                    </div>
                    <p className="text-[13px] text-[#656b81] leading-[1.5]">This signal was captured and added to the opportunity.</p>
                  </div>
                </div>
              </div>
            )}

          </motion.div>
        ) : showAnalysis ? (
          <motion.div
            key="analysis"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
            className="flex-1 overflow-y-auto flex flex-col px-6 pb-0 pt-24"
          >
            <div className="flex flex-col gap-6 px-4 pb-4">
              <motion.div className="flex justify-end" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}>
                <div className="max-w-[80%] bg-[#f1f2f5] rounded-[12px] px-4 py-3">
                  <p className="text-[14px] text-[#222428]">View analysis</p>
                </div>
              </motion.div>
              <motion.div className="flex items-start gap-3" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.2, ease: [0.2, 0, 0, 1] }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: '#E7E7E5' }}>
                  <span className="text-[#222428] leading-[0] flex items-center justify-center">
                    <IconSparksFilled css={{ width: 14, height: 14 }} />
                  </span>
                </div>
                <div className="flex-1 flex flex-col gap-3">
                  {(analysisData?.response ?? '').split('\n\n').map((para, i) => (
                    <motion.p key={i} className="text-[14px] text-[#222428] leading-[1.6]" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.35 + i * 0.08, ease: [0.2, 0, 0, 1] }}>
                      {para.split(/\*\*(.*?)\*\*/g).map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)}
                    </motion.p>
                  ))}
                  {analysisData?.prompts && (
                    <motion.div className="flex flex-col gap-2 mt-2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.8, ease: [0.2, 0, 0, 1] }}>
                      <div className="-mx-4 rounded-[24px] overflow-hidden py-1.5" style={{ backgroundColor: '#FBFAF7' }}>
                        {analysisData.prompts.map((chip) => (
                          <button key={chip} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors">
                            <span className="text-gray-400 flex-shrink-0"><IconSparksFilled css={{ width: 16, height: 16 }} /></span>
                            <span className="text-gray-900">{chip}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="default"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
            className="flex-1 overflow-y-auto flex flex-col px-6 pb-0 pt-24 justify-end"
          >
            <div className="flex flex-col gap-6 px-4">
              <div className="flex flex-col gap-2">
                <p className="text-[#222428] text-[28px] font-serif leading-[1.4]">Opportunity deep-dive</p>
                <div className="text-[#656b81] text-[16px] leading-[1.5]">
                  <p>
                    This theme has a confidence score of {theme.meta.confidence} and {theme.meta.confidenceDelta} movement this week.
                    {' '}{theme.meta.likes} team members have upvoted it, signalling strong internal alignment.
                  </p>
                  <p className="mt-4">
                    I can help you map signals to this theme, draft a recommendation for the roadmap, or pull in related customer quotes.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <div className="-mx-4 rounded-[24px] overflow-hidden py-1.5" style={{ backgroundColor: '#FBFAF7' }}>
                  {['Summarise signals for this opportunity', 'Draft a roadmap recommendation', 'Show related customer quotes'].map((chip) => (
                    <button key={chip} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors">
                      <span className="text-gray-400 flex-shrink-0"><IconSparksFilled css={{ width: 16, height: 16 }} /></span>
                      <span className="text-gray-900">{chip}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prompt chips — always visible above input */}
      {copiedCard && (
        <div className="px-6 pb-2 pt-4 shrink-0">
          <div className="rounded-[24px] overflow-hidden py-1.5" style={{ backgroundColor: '#FBFAF7' }}>
            {['Add to opportunity summary', 'Find related signals', 'Draft a follow-up'].map((chip) => (
              <button key={chip} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors">
                <span className="text-gray-400 flex-shrink-0 leading-[0]"><IconSparksFilled css={{ width: 16, height: 16 }} /></span>
                <span className="text-gray-900">{chip}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {selectedSignal && !showAnalysis && (
        <div className="px-6 pb-2 pt-4 shrink-0">
          <div className="rounded-[24px] overflow-hidden py-1.5" style={{ backgroundColor: '#FBFAF7' }}>
            {SIGNAL_CHIPS.map((chip) => (
              <button key={chip} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors">
                <span className="text-gray-400 flex-shrink-0 leading-[0]"><IconSparksFilled css={{ width: 16, height: 16 }} /></span>
                <span className="text-gray-900">{chip}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-6 pb-6 shrink-0">
        <ChatInput onSubmit={() => {}} />
      </div>
    </motion.aside>
  )
}

// ─── Confidence stat helper ────────────────────────────────────────────────────

function deriveStats(card: ThemeCard) {
  const conf = parseInt(card.meta.confidence) || 80
  const src = card.meta.sources
  const mentions = src * 28 + Math.round(conf * 0.7)
  const customers = Math.max(src * 3 + 4, 6)
  const arrMatch = card.meta.arr.match(/\$([\d.]+)\s*Million/)
  const arrImpact = arrMatch ? `$${Math.round(parseFloat(arrMatch[1]) * 100)}K` : '$100K'
  return { mentions, customers, arrImpact, freq: card.meta.confidenceDelta }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ThemeDetailPage() {
  const params = useParams()
  const [aiOpen, setAiOpen] = useState(true)
  const [selectedSignal, setSelectedSignal] = useState<typeof DETAIL_SIGNALS[0] | null>(null)
  const [copiedCard, setCopiedCard] = useState<typeof FEATURED_CARDS[0] | null>(null)
  const [showToast, setShowToast] = useState(false)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [direction, setDirection] = useState(1)
  const [activeTab, setActiveTab] = useState<'signals' | 'details' | 'comments' | 'updates'>('signals')
  const [showAnalysis, setShowAnalysis] = useState(false)

  const selectSignal = (row: typeof DETAIL_SIGNALS[0]) => { setSelectedSignal(row); setAiOpen(true) }

  const theme = THEME_CARDS.find((c) => c.id === String(params.id))

  const cardsPerPage = aiOpen ? 2 : 3
  const totalPages = Math.ceil(FEATURED_CARDS.length / cardsPerPage)
  const pages = Array.from({ length: totalPages }, (_, i) =>
    FEATURED_CARDS.slice(i * cardsPerPage, (i + 1) * cardsPerPage)
  )
  const safePage = Math.min(currentPage, totalPages - 1)

  const goNext = () => {
    setDirection(1)
    setCurrentPage((prev) => (prev + 1) % totalPages)
  }
  const goToPage = (page: number) => {
    setDirection(page >= currentPage ? 1 : -1)
    setCurrentPage(page)
  }

  if (!theme) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-[#656b81]">Opportunity not found.</p>
      </div>
    )
  }

  const stats = deriveStats(theme)
  const signalCount = 12
  const heroColor = TAG_COLORS[theme.tags[0]?.label] ?? CARD_ACCENT.audio

  return (
    <div className="relative h-full w-full flex flex-col" style={{ backgroundColor: '#FBFAF7' }}>
      <InsightsTopBar />

      <div
        className="flex-1 overflow-y-auto"
        style={{ maxWidth: aiOpen ? 'calc(100% - 488px)' : '100%', transition: 'max-width 0.25s ease' }}
      >
        <main className="px-0 py-[60px] mx-[60px]">

          {/* Breadcrumb */}
          <div className="flex items-center gap-1 mb-6 h-7">
            <Link
              href="/insights/themes"
              className="text-[14px] font-medium text-[#656b81] hover:text-[#222428] transition-colors whitespace-nowrap"
              style={{ fontFamily: 'Roobert, sans-serif' }}
            >
              Opportunities
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#aeb2c0] shrink-0" />
            <span
              className="text-[14px] font-medium text-[#222428] truncate"
              style={{ fontFamily: 'Roobert, sans-serif' }}
            >
              Opportunity detail
            </span>
          </div>

          {/* ── Hero ── */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.2, 0, 0, 1] }}
            className="rounded-[24px] p-8 pt-[132px] mb-[60px] relative min-h-[440px] shadow-sm"
            style={{ backgroundColor: (TAG_COLORS[theme.tags[0]?.label] ?? '#ffffff') + '66' }}
          >
            {/* Top-right badges */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5 border border-[#e0e2e8] text-[#222428]">
                <ThumbsUpIcon />
                <span className="text-xs font-medium">{theme.meta.likes}</span>
              </div>
              <button className="w-8 h-8 rounded-full border border-[#e0e2e8] flex items-center justify-center hover:bg-white/30 transition-colors text-[#656b81]">
                <BookmarkIcon />
              </button>
              <button className="w-8 h-8 rounded-full border border-[#e0e2e8] flex items-center justify-center hover:bg-white/30 transition-colors text-[#656b81]">
                <MoreIcon />
              </button>
            </div>

            {/* Bottom-left content */}
            <div className="absolute bottom-8 left-8 right-8">
              {/* Tags */}
              <div className="flex items-center gap-1.5 flex-wrap mb-4">
                {theme.tags.map((tag) => <TagPill key={tag.label} label={tag.label} />)}
              </div>

              {/* Title */}
              <h1 className="text-[48px] font-serif text-[#222428] leading-[1.2] mb-3">
                {theme.title}
              </h1>

              {/* Description */}
              <p className="text-[16px] text-[#222428]/70 leading-[1.6] mb-6 max-w-2xl">
                {theme.description}
              </p>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button className="h-9 px-4 rounded-[24px] text-sm font-medium bg-[#222428] text-white hover:bg-[#222428]/90 transition-colors">
                  {theme.primaryAction.label}
                </button>
              </div>
            </div>
          </motion.section>

          {/* ── Confidence drivers ── */}
          <section className="mb-[60px]">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[22px] font-heading font-medium text-[#222428] leading-snug">Confidence drivers</h2>
            </div>
            <div className="grid grid-cols-4 divide-x divide-[#e0e2e8]">
              {[
                { value: stats.mentions, label: 'Total Mentions' },
                { value: stats.customers, label: 'Unique Customers' },
                { value: stats.arrImpact, label: 'Est. ARR Impact' },
                { value: stats.freq, label: 'Frequency (WoW)' },
              ].map((stat) => (
                <div key={stat.label} className="pl-6 first:pl-0">
                  <p className="text-[40px] font-serif text-[#222428] leading-tight">{stat.value}</p>
                  <p className="text-[14px] text-[#656b81] mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Featured ── */}
          <section className="mb-[60px]">
            <div className="flex items-center gap-2 mb-5">
              <h2 className="text-[22px] font-heading font-medium text-[#222428] leading-snug">Featured</h2>
              <span className="text-[14px] text-[#656b81]">{signalCount} signals</span>
              <span className="flex items-center gap-1 py-1 px-2.5 rounded-full text-xs text-[#222428]" style={{ backgroundColor: '#BADEB1' }}>
                7 new
              </span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[#aeb2c0]">
                <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M8 5.5v.5M8 7.5v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0 overflow-visible relative">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={currentPage}
                    custom={direction}
                    variants={{
                      enter: (d: number) => ({ x: d > 0 ? '100%' : '-100%' }),
                      center: { x: 0 },
                      exit: (d: number) => ({ x: d > 0 ? '-100%' : '100%' }),
                    }}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.35, ease: [0.2, 0, 0, 1] }}
                    className={`grid ${aiOpen ? 'grid-cols-2' : 'grid-cols-3'} gap-[22px] pb-1`}
                  >
                    {pages[safePage].map((card) => (
                      <FeaturedCard key={card.id} card={card} accent={heroColor} onCopy={(c) => {
                        setCopiedCard(c); setSelectedSignal(null); setShowAnalysis(false); setAiOpen(true)
                        setShowToast(true)
                        if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
                        toastTimerRef.current = setTimeout(() => setShowToast(false), 4000)
                      }} />
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>
              <button onClick={goNext} className="w-8 h-8 rounded-full border border-[#e0e2e8] bg-white flex items-center justify-center shrink-0 hover:bg-[#f1f2f5] transition-colors" aria-label="Next">
                <ChevronRight className="w-4 h-4 text-[#656b81]" />
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 mt-4">
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} onClick={() => goToPage(i)} aria-label={`Go to page ${i + 1}`}
                  className={`rounded-full transition-all ${i === safePage ? 'w-2 h-2 bg-[#222428]' : 'w-1.5 h-1.5 bg-[#d0d2d8] opacity-60'}`}
                />
              ))}
            </div>
          </section>

          {/* ── Tabs + Signals ── */}
          <section>
            {/* Tab bar */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-1">
                {([
                  { id: 'signals' as const, label: 'Signals', count: undefined as number | undefined },
                  { id: 'details' as const, label: 'Details', count: undefined as number | undefined },
                  { id: 'comments' as const, label: 'Comments', count: 5 },
                  { id: 'updates' as const, label: 'Updates', count: 4 },
                ]).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 h-8 px-3 rounded-[24px] text-[14px] transition-colors ${
                      activeTab === tab.id ? 'bg-[#222428] text-white' : 'text-[#656b81] hover:bg-white'
                    }`}
                  >
                    {tab.label}
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-[#e9eaef] text-[#656b81]'}`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button className="w-8 h-8 flex items-center justify-center rounded-[24px] hover:bg-[#f1f2f5] transition-colors text-[#656b81]">
                  <Search className="w-4 h-4" />
                </button>
                <button className="flex items-center gap-1.5 h-8 px-3 rounded-[24px] border border-[#e0e2e8] text-sm text-[#222428] hover:bg-[#f1f2f5] transition-colors">
                  Latest <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <button className="w-8 h-8 flex items-center justify-center rounded-[24px] hover:bg-[#f1f2f5] transition-colors text-[#656b81]">
                  <SlidersHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Signals table */}
            {activeTab === 'signals' && (
              <div className="overflow-x-auto">
                <div>
                  {/* Header */}
                  <div
                    className="grid gap-4 px-5 py-3 border-b border-[#e0e2e8] text-xs font-semibold text-[#656b81] uppercase tracking-wide"
                    style={{ gridTemplateColumns: '24px 56px 260px 200px 140px 110px 130px' }}
                  >
                    <span />
                    <span>Source</span>
                    <span>Title</span>
                    <span>Description</span>
                    <span>Person</span>
                    <span>Est. revenue</span>
                    <span>Company</span>
                  </div>

                  {DETAIL_SIGNALS.map((row, i) => (
                    <motion.div
                      key={row.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: i * 0.04 }}
                      onClick={() => selectSignal(row)}
                      className={`grid gap-4 px-5 py-3.5 items-center border-b border-[#e0e2e8] last:border-0 hover:bg-[#E7E7E5] transition-colors cursor-pointer ${selectedSignal?.id === row.id ? 'bg-[#E7E7E5]' : ''}`}
                      style={{ gridTemplateColumns: '24px 56px 260px 200px 140px 110px 130px' }}
                    >
                      <span className="text-xs text-[#aeb2c0]">{row.id}</span>
                      <SourceIconComp type={row.sourceIcon} />
                      <p className="text-sm font-semibold text-[#222428]">{row.title}</p>
                      <p className="text-sm text-[#656b81]">{row.description}</p>
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold text-[#222428] shrink-0" style={{ backgroundColor: row.person.bg }}>
                          {row.person.initials}
                        </div>
                        <span className="text-sm text-[#656b81]">{row.person.name}</span>
                      </div>
                      <p className="text-sm text-[#656b81]">{row.revenue}</p>
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: row.company.bg }}>
                          {row.company.letter}
                        </div>
                        <span className="text-sm text-[#656b81]">{row.company.name}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'details' && (
              <div>
                {[
                  { label: 'Title', value: theme.title, type: 'text' },
                  { label: 'Description', value: theme.description, type: 'text' },
                  { label: 'Strategy', value: 'Maps to O1: Win R&D ($82M)', type: 'text' },
                  { label: 'Usage', value: 'SSO enablement can 4x engagement', type: 'text' },
                  { label: 'Market', value: 'Asana shipped this Q4 2025', type: 'text' },
                  { label: 'Assignee', value: 'Kajsa Bell', type: 'person' },
                  { label: 'Impact score', value: stats.mentions, badge: '+32', type: 'score' },
                  { label: 'Est. revenue', value: stats.arrImpact + ' ARR', type: 'revenue' },
                  { label: 'Companies', value: '', type: 'companies' },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="grid gap-6 py-3.5 border-b border-[#f1f2f5] last:border-0 items-start"
                    style={{ gridTemplateColumns: '160px 1fr' }}
                  >
                    <span className="text-sm text-[#656b81]">{row.label}</span>
                    {row.type === 'text' && (
                      <span className="text-sm text-[#222428]">{row.value}</span>
                    )}
                    {row.type === 'person' && (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-[#FFF6B6] flex items-center justify-center text-[10px] font-semibold text-[#222428] shrink-0">K</div>
                        <span className="text-sm text-[#222428]">{row.value}</span>
                      </div>
                    )}
                    {row.type === 'score' && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[#222428] font-medium">{row.value}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#BADEB1] text-[#222428] font-medium">{row.badge}</span>
                      </div>
                    )}
                    {row.type === 'revenue' && (
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-[#BADEB1] flex items-center justify-center text-[10px] font-bold text-[#222428]">$</span>
                        <span className="text-sm text-[#222428]">{row.value}</span>
                      </div>
                    )}
                    {row.type === 'companies' && (
                      <div className="flex items-center gap-1.5">
                        {[
                          { letter: 'G', bg: '#4285F4' },
                          { letter: 'B', bg: '#00AEFF' },
                          { letter: 'A', bg: '#555' },
                          { letter: 'A', bg: '#E0001B' },
                        ].map((c, i) => (
                          <div key={i} className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: c.bg }}>
                            {c.letter}
                          </div>
                        ))}
                        <span className="text-xs text-[#656b81] ml-1">+{Math.max(stats.customers - 4, 2)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'updates' && (
              <div>
                {[
                  { action: 'changed the value score from 85% to 99%.', date: 'May 21, 2026' },
                  { action: 'prioritised this theme as a recommendation', date: 'May 15, 2026' },
                  { action: 'added three new Featured video calls to watch', date: 'May 21, 2026' },
                  { action: 'changed the value score from 50% to 85%.', date: null },
                  { action: `Created theme based out of ${stats.mentions} feedback items and ${stats.mentions * 3} mentions`, date: null },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 py-4 border-b border-[#f1f2f5] last:border-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#E7E7E5' }}>
                      <span className="text-[#222428] leading-[0] flex items-center justify-center">
                        <IconSparksFilled css={{ width: 14, height: 14 }} />
                      </span>
                    </div>
                    <p className="flex-1 text-sm text-[#222428]">
                      <span className="font-semibold">Miro Insights</span>{' '}
                      {item.action}
                      {item.date && <span className="text-[#656b81]"> • {item.date}</span>}
                    </p>
                    <button className="w-8 h-8 flex items-center justify-center rounded-[24px] text-[#aeb2c0] hover:text-[#656b81] hover:bg-[#f1f2f5] transition-colors shrink-0">
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'comments' && (
              <div>
                {[
                  { name: 'Kajsa Bell', avatar: 'https://i.pravatar.cc/40?img=47', date: 'May 21, 2026', comment: "This is exactly what we've been hearing from enterprise accounts. The SSO friction is causing delays at procurement — we need to prioritise this for Q3." },
                  { name: 'Marco Rossi', avatar: 'https://i.pravatar.cc/40?img=11', date: 'May 20, 2026', comment: "Agreed. I'd add that the SCIM provisioning issue compounds this — IT teams are having to manually re-sync after every Okta update. Adds to the same confidence problem." },
                  { name: 'Priya Nair', avatar: 'https://i.pravatar.cc/40?img=45', date: 'May 18, 2026', comment: 'Can we link this to the Canvas Performance theme? A few of the Gong calls mention both issues in the same breath — customers see them as one "reliability" problem.' },
                  { name: 'James Watson', avatar: 'https://i.pravatar.cc/40?img=12', date: 'May 15, 2026', comment: 'Moved this to "Next" in the roadmap sync yesterday. Waiting on confirmation from the Security team that the Okta fix can ship before the enterprise summit.' },
                  { name: 'Anna Bergström', avatar: 'https://i.pravatar.cc/40?img=48', date: 'May 14, 2026', comment: "The +18% WoW frequency jump is significant. If we don't address this before the next renewal cycle we risk churn on at least 3 named accounts." },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 py-4 border-b border-[#f1f2f5] last:border-0">
                    <img
                      src={item.avatar}
                      alt={item.name}
                      className="w-8 h-8 rounded-full object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-sm font-semibold text-[#222428]">{item.name}</span>
                        <span className="text-xs text-[#aeb2c0]">{item.date}</span>
                      </div>
                      <p className="text-sm text-[#222428] leading-[1.6]">{item.comment}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </main>
      </div>

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

      <AIPanel
        open={aiOpen}
        onClose={() => { setAiOpen(false); setShowAnalysis(false); setSelectedSignal(null); setCopiedCard(null) }}
        theme={theme}
        showAnalysis={showAnalysis}
        onDismissAnalysis={() => setShowAnalysis(false)}
        selectedSignal={selectedSignal}
        onClearSignal={() => setSelectedSignal(null)}
        copiedCard={copiedCard}
        onClearCopied={() => setCopiedCard(null)}
      />

      {/* Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-3 rounded-[14px] shadow-lg z-50"
            style={{ backgroundColor: '#222428' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="2" width="10" height="10" rx="1.5" stroke="white" strokeWidth="1.3" />
              <path d="M4 12v2M12 4h2" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <span className="text-white text-[13px] font-medium">Copied to Assistant</span>
            <button
              onClick={() => { setShowToast(false); if (toastTimerRef.current) clearTimeout(toastTimerRef.current) }}
              className="ml-1 text-white/50 hover:text-white transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
