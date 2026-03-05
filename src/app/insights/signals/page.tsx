'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Users, Search, SlidersHorizontal, ChevronDown, ChevronRight, Play } from 'lucide-react'
import { IconSparksFilled, IconSmileyChat, IconGlobe, IconRectanglesThreeOverlap } from '@mirohq/design-system-icons'
import InsightsTopBar from '@/components/InsightsTopBar'
import { ChatInput } from '@/components/toolbar/ChatInput'

// ─── Data ─────────────────────────────────────────────────────────────────────

const FEATURED_CARDS = [
  {
    id: '1',
    type: 'audio' as const,
    badge: 'Audio',
    title: 'User Interview: Sam Ledezma',
    description: 'Discussion on "Heavy Board" load times and visual comfort.',
    date: 'Jul 14',
    source: 'Gong',
  },
  {
    id: '2',
    type: 'clips' as const,
    badge: '2 Clips',
    title: 'Call with Siemens Admin',
    participants: 'Henry Park, Sarah Parker, +3 more',
    description: 'Ayoub El Assri discusses SCIM provisioning hurdles.',
    date: 'Jul 14',
    source: 'Gong',
  },
  {
    id: '3',
    type: 'quote' as const,
    quote: '"The new feature clearly drives revenue when adopted, but most users aren\'t getting there. We\'re investing in big bets while the core experience that drives engagement feels stuck."',
    duration: '32m 34s',
    title: 'Call with Spotify',
    person: 'John Cusick',
    date: 'Jul 14',
    source: 'Gong',
    logo: 'spotify',
  },
  {
    id: '4',
    type: 'quote' as const,
    quote: '"The Miro Assist summarization has cut our research review time by 60%… We can now cluster insights across thousands of sticky notes in seconds."',
    duration: '12m 04s',
    title: 'Call with Apple',
    person: 'James Watson',
    date: 'Jul 14',
    source: 'Gong',
    logo: 'apple',
  },
  {
    id: '5',
    type: 'audio' as const,
    badge: 'Audio',
    title: 'User Interview: Priya Nair',
    description: 'Frustration with AI suggestions appearing mid-session — breaks focus during live workshops.',
    date: 'Jul 18',
    source: 'Gong',
  },
  {
    id: '6',
    type: 'clips' as const,
    badge: '4 Clips',
    title: 'Call with Adobe',
    participants: 'Marco Rossi, Leah Kim, +2 more',
    description: 'Team requests persistent cursor visibility across large boards during collaborative reviews.',
    date: 'Jul 21',
    source: 'Gong',
  },
  {
    id: '7',
    type: 'quote' as const,
    quote: '"We run design sprints with 40+ people on a single board. The lag when everyone is active at once is a dealbreaker — we\'ve nearly lost the account over it."',
    duration: '28m 12s',
    title: 'Call with Spotify',
    person: 'Anna Bergström',
    date: 'Jul 22',
    source: 'Gong',
    logo: 'spotify',
  },
  {
    id: '8',
    type: 'quote' as const,
    quote: '"We need SSO that actually works with our IdP out of the box. Every workaround costs us an IT sprint and delays our org-wide rollout."',
    duration: '41m 07s',
    title: 'Call with Apple',
    person: 'Derek Chu',
    date: 'Jul 25',
    source: 'Gong',
    logo: 'apple',
  },
  {
    id: '9',
    type: 'audio' as const,
    badge: 'Audio',
    title: 'User Interview: Tomás Herrera',
    description: 'Wants template locking so junior designers can\'t accidentally overwrite research structures.',
    date: 'Aug 1',
    source: 'Gong',
  },
  {
    id: '10',
    type: 'clips' as const,
    badge: '3 Clips',
    title: 'Call with Siemens PM',
    participants: 'Rachel Moore, Ben Okafor, +1 more',
    description: 'Requesting granular export controls — PDF fidelity and selective frame exports are blocking enterprise handoff.',
    date: 'Aug 3',
    source: 'Gong',
  },
  {
    id: '11',
    type: 'quote' as const,
    quote: '"Diagramming in Miro is close but the auto-layout still falls short for complex system maps. One misaligned node and the whole thing breaks."',
    duration: '19m 48s',
    title: 'Call with Spotify',
    person: 'Clara Johansson',
    date: 'Aug 6',
    source: 'Gong',
    logo: 'spotify',
  },
  {
    id: '12',
    type: 'audio' as const,
    badge: 'Audio',
    title: 'User Interview: Kenji Watanabe',
    description: 'Wants real-time translation in sticky notes for cross-regional workshops — a blocker for APAC teams.',
    date: 'Aug 8',
    source: 'Gong',
  },
]


type SignalTag = { label: string }
const SIGNAL_ROWS = [
  { id: '1',  sourceIcon: 'audio',  title: 'Canvas lag when 40+ users are active on a single board',          theme: 'Canvas Performance',        tags: [{ label: 'Customer' }, { label: 'Urgent' }] as SignalTag[],                               revenue: '$2.1M',  companies: ['apple', 'spotify'], impact: 94 },
  { id: '2',  sourceIcon: 'globe',  title: 'AI suggestions interrupt focus during live workshops',             theme: 'AI UX Controls',            tags: [{ label: 'Customer' }, { label: 'Market' }, { label: 'New' }] as SignalTag[],           revenue: '$850K',  companies: ['spotify'],          impact: 72 },
  { id: '3',  sourceIcon: 'mobile', title: 'Cursors invisible to collaborators on large 4K boards',           theme: 'Collaboration Visibility',  tags: [{ label: 'Customer' }, { label: 'Market' }] as SignalTag[],                             revenue: '$620K',  companies: ['apple', 'spotify'], impact: 68 },
  { id: '4',  sourceIcon: 'audio',  title: 'SAML / SSO breaks with Okta and Azure AD out of the box',        theme: 'Enterprise Security',       tags: [{ label: 'Customer' }, { label: 'Urgent' }, { label: 'Strengthening' }] as SignalTag[], revenue: '$1.4M',  companies: ['apple'],            impact: 91 },
  { id: '5',  sourceIcon: 'globe',  title: 'Templates overwritten by junior team members accidentally',       theme: 'Permission Controls',       tags: [{ label: 'Customer' }, { label: 'Market' }] as SignalTag[],                             revenue: '$390K',  companies: ['spotify'],          impact: 55 },
  { id: '6',  sourceIcon: 'mobile', title: 'PDF exports lose fonts and break layout on large frames',         theme: 'Export Fidelity',           tags: [{ label: 'Customer' }] as SignalTag[],                                                   revenue: '$540K',  companies: ['apple', 'spotify'], impact: 63 },
  { id: '7',  sourceIcon: 'audio',  title: 'Auto-layout breaks on complex multi-level system maps',           theme: 'Diagramming Engine',        tags: [{ label: 'Market' }, { label: 'Strengthening' }, { label: 'Customer' }] as SignalTag[], revenue: '$720K',  companies: ['spotify'],          impact: 78 },
  { id: '8',  sourceIcon: 'globe',  title: 'No real-time translation support for APAC workshop teams',        theme: 'Localisation & i18n',       tags: [{ label: 'Market' }, { label: 'New' }] as SignalTag[],                                   revenue: '$480K',  companies: ['apple'],            impact: 61 },
  { id: '9',  sourceIcon: 'mobile', title: 'SCIM provisioning fails silently on first-time sync',             theme: 'Enterprise Security',       tags: [{ label: 'Customer' }, { label: 'Urgent' }] as SignalTag[],                             revenue: '$1.1M',  companies: ['apple', 'spotify'], impact: 88 },
  { id: '10', sourceIcon: 'audio',  title: 'Boards with 500+ objects take 8+ seconds to fully load',         theme: 'Canvas Performance',        tags: [{ label: 'Customer' }, { label: 'Strengthening' }, { label: 'Urgent' }] as SignalTag[], revenue: '$760K',  companies: ['spotify', 'apple'], impact: 85 },
  { id: '11', sourceIcon: 'globe',  title: 'Miro Assist clusters stickies into incorrect or vague themes',   theme: 'AI Accuracy',               tags: [{ label: 'Customer' }, { label: 'New' }] as SignalTag[],                                 revenue: '$330K',  companies: ['spotify'],          impact: 49 },
  { id: '12', sourceIcon: 'mobile', title: 'Enterprise onboarding missing bulk admin controls for orgs',     theme: 'Onboarding & Admin',        tags: [{ label: 'Market' }, { label: 'New' }] as SignalTag[],                                   revenue: '$290K',  companies: ['apple', 'spotify'], impact: 44 },
  { id: '13', sourceIcon: 'audio',  title: 'Share link permissions confuse guests unfamiliar with Miro',     theme: 'Sharing & Access',          tags: [{ label: 'Customer' }, { label: 'Weakening' }, { label: 'Market' }] as SignalTag[],     revenue: '$450K',  companies: ['apple'],            impact: 58 },
  { id: '14', sourceIcon: 'mobile', title: 'Mobile app missing sticky note editing and frame navigation',    theme: 'Mobile Parity',             tags: [{ label: 'Market' }] as SignalTag[],                                                     revenue: '$380K',  companies: ['spotify'],          impact: 52 },
]

const TAG_COLORS: Record<string, string> = {
  New: '#DBFAAD',
  Customer: '#FFED7B',
  Market: '#A0C4FB',
  Urgent: '#FFABEC',
  Strengthening: '#FFBD83',
  Weakening: '#B5A9FF',
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function AudioIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 1v14M5 3.5v9M11 3.5v9M2 6v4M14 6v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function MobileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
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

function SpotifyLogo() {
  return (
    <div className="w-5 h-5 rounded-full bg-[#1DB954] flex items-center justify-center shrink-0">
      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
        <path d="M1.5 3.5C4 2.5 7 2.8 9 4M2 5.5C4 4.7 7 5 8.5 6M2.5 7.5C4 6.9 6.5 7.1 8 8" stroke="white" strokeWidth="1" strokeLinecap="round" />
      </svg>
    </div>
  )
}

function SpotifyLogoMark() {
  return (
    <div className="w-6 h-6 rounded-full bg-[#1DB954] flex items-center justify-center shrink-0">
      <svg width="13" height="13" viewBox="0 0 11 11" fill="none">
        <path d="M1.5 3.5C4 2.5 7 2.8 9 4M2 5.5C4 4.7 7 5 8.5 6M2.5 7.5C4 6.9 6.5 7.1 8 8" stroke="white" strokeWidth="1" strokeLinecap="round" />
      </svg>
    </div>
  )
}

function AppleLogo() {
  return (
    <div className="w-5 h-5 rounded-full bg-[#222428] flex items-center justify-center shrink-0">
      <svg width="10" height="12" viewBox="0 0 10 12" fill="white">
        <path d="M8.3 6.4c0-1.5 1.2-2.2 1.3-2.3C8.8 2.7 7.4 2.5 6.9 2.5c-1.1 0-2 .7-2.6.7-.6 0-1.5-.6-2.5-.6C.6 2.6 0 3.5 0 4.9c0 2.7 2.3 6.5 3.3 6.5.5 0 1-.6 1.8-.6.8 0 1.1.6 1.9.6C8 11.4 9 8.3 9 8.2c-.1 0-1-.4-1-1.8zM6.3.9C6.7.4 7 0 7-.3c-1 .1-2.2.8-2.9 1.5-.4.5-.8 1.2-.7 1.9.9 0 1.6-.5 2-1.2z" />
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

function SourceIconComp({ type }: { type: string }) {
  if (type === 'audio') return (
    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[#656b81]"><AudioIcon /></div>
  )
  if (type === 'mobile') return (
    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[#656b81]"><MobileIcon /></div>
  )
  return (
    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[#656b81]">
      <IconGlobe css={{ width: 16, height: 16 }} />
    </div>
  )
}

function TagPill({ label }: { label: string }) {
  return (
    <span
      className="flex items-center gap-1 h-6 px-2 rounded-full text-xs text-[#222428] whitespace-nowrap"
      style={{ backgroundColor: TAG_COLORS[label] ?? '#e9eaef' }}
    >
      {label === 'Customer' && <IconSmileyChat css={{ width: 12, height: 12 }} />}
      {label === 'Market' && <IconGlobe css={{ width: 12, height: 12 }} />}
      {label}
    </span>
  )
}

// ─── Featured section ─────────────────────────────────────────────────────────

const CARD_ACCENT: Record<string, string> = {
  audio: '#f17de5',
  clips: '#b9b5ff',
  quote: '#ffdc4a',
}

function FeaturedCard({ card }: { card: typeof FEATURED_CARDS[0] }) {
  const accent = CARD_ACCENT[card.type]
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      className="w-full h-full rounded-[16px] cursor-pointer"
      style={{ backgroundColor: accent, padding: '2px 2px 6px 2px' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      animate={{ scale: hovered ? 1.02 : 1 }}
      transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
    >
      <div className="bg-white rounded-[16px] flex flex-col gap-3 p-3 h-full">

        {/* Top media area */}
        <div className="relative rounded-[12px] overflow-hidden shrink-0" style={{ height: card.type === 'quote' ? 220 : 162 }}>
          {card.type === 'audio' && (
            <div className="h-full bg-gradient-to-b from-[rgba(241,125,229,0.2)] to-white flex items-center justify-center">
              <div className="w-9 h-9 rounded-full bg-[rgba(241,125,229,0.25)] flex items-center justify-center">
                <Play className="w-4 h-4 text-[#222428] fill-[#222428] ml-0.5" />
              </div>
            </div>
          )}
          {card.type === 'clips' && (
            <div className="h-full bg-gradient-to-b from-[rgba(181,169,255,0.3)] to-white flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-[rgba(181,169,255,0.3)] flex items-center justify-center">
                <Play className="w-4 h-4 text-[#222428] fill-[#222428] ml-0.5" />
              </div>
            </div>
          )}
          {card.type === 'quote' && (
            <div className="h-full bg-gradient-to-b from-[#fff7ca] to-white flex flex-col items-center justify-center gap-2 px-5 py-6">
              <p className="text-[14px] font-semibold text-[#222428] text-center leading-[1.4]">
                {card.quote}
              </p>
              {'duration' in card && (
                <p className="text-[12px] text-[#656b81] text-center">{card.duration}</p>
              )}
            </div>
          )}
          {/* Copy icon */}
          <button className="absolute top-2 right-2 w-6 h-6 rounded-[6px] bg-white/80 flex items-center justify-center text-[#656b81] hover:bg-white transition-colors">
            <CopyIcon />
          </button>
        </div>

        {/* Content */}
        <div className={`flex flex-col gap-1.5 flex-1 min-h-0 ${card.type !== 'quote' ? 'justify-end' : ''}`}>
          {card.type !== 'quote' && (
            <>
              {(card.type === 'audio' || card.type === 'clips') && (
                <span className="h-5 px-2 bg-[#3859FF] text-white text-[10px] font-medium rounded-[4px] flex items-center w-fit">
                  {card.badge}
                </span>
              )}
              <p className="text-[14px] font-semibold text-[#222428] leading-[1.4]">{card.title}</p>
              {'participants' in card && card.participants && (
                <p className="text-[12px] text-[#656b81]">{card.participants}</p>
              )}
              {'description' in card && card.description && (
                <p className="text-[12px] text-[#656b81] leading-[1.4]">{card.description}</p>
              )}
            </>
          )}
          {card.type === 'quote' && (
            <div className="flex items-center gap-2">
              <div className="w-[39px] h-[39px] rounded-[12px] bg-white border border-[#e9eaef] shadow-[0px_4px_8px_0px_rgba(0,0,0,0.05)] flex items-center justify-center shrink-0">
                {card.logo === 'spotify' ? <SpotifyLogoMark /> : <AppleLogoMark />}
              </div>
              <div>
                <p className="text-[14px] font-semibold text-[#222428] leading-[1.4]">{card.title}</p>
                <p className="text-[12px] text-[#9ca0ad]">{'person' in card ? card.person : ''}</p>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-[#e0e2e8] shrink-0 -mx-1" />

        {/* Tag row */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="flex items-center justify-center w-[28px] h-[28px] border border-[#c7c7d1] rounded-[4px] text-[#656b81] shrink-0">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 2h10M1 5h10M1 8h7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
            </svg>
          </span>
          <span className="flex items-center gap-1 h-[28px] px-2 bg-[#f2f2f2] rounded-[4px] text-[12px] text-[#050038] shrink-0">
            <CalendarIcon />
            {card.date}
          </span>
          <span className="flex items-center gap-1 h-[28px] px-2 border border-[#e0e2e8] rounded-[4px] text-[12px] text-[#222428] shrink-0">
            <GongIcon />
            {card.source}
          </span>
        </div>

      </div>
    </motion.div>
  )
}

// ─── Signal detail panel ──────────────────────────────────────────────────────

const SIGNAL_CHIPS = [
  'Map this signal to a theme',
  'Show related signals',
  'Draft a roadmap recommendation',
]

function SignalDetailPanel({ signal, onClose }: { signal: typeof SIGNAL_ROWS[0]; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'summary' | 'feedback' | 'details' | 'updates'>('summary')

  const revenueNum = parseFloat(signal.revenue.replace(/[^0-9.]/g, ''))
  const isMillions = signal.revenue.includes('M')
  const revenueK = isMillions ? revenueNum * 1000 : revenueNum
  const mentions = Math.round(revenueK * 0.14 + 40)
  const customers = Math.round(revenueK * 0.008 + 5)
  const wowPct = `+${Math.round(revenueK * 0.012 + 8)}%`

  const TABS = ['Summary', 'Feedback', 'Details', 'Updates'] as const

  return (
    <motion.aside
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 40, opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
      className="fixed top-4 right-4 bottom-4 w-[472px] bg-white rounded-[20px] shadow-[0_2px_10px_rgba(5,0,56,0.08)] flex flex-col overflow-hidden z-30"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 shrink-0">
        <span className="text-[16px] font-semibold text-[#222428]" style={{ fontFamily: 'Roobert, sans-serif' }}>Signal</span>
        <div className="flex items-center gap-1">
          <button className="w-8 h-8 flex items-center justify-center rounded text-[#656b81] hover:bg-[#f1f2f5] transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M6 2H2a1 1 0 00-1 1v9a1 1 0 001 1h9a1 1 0 001-1V8M8 1h5v5M13 1L6 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded text-[#656b81] hover:bg-[#f1f2f5] transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-8 py-8 flex flex-col gap-5">

        {/* Title */}
        <h2 className="text-[24px] font-serif text-[#222428] leading-[1.35]">{signal.title}</h2>

        {/* Tabs */}
        <div className="flex items-center gap-0.5 flex-wrap">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase() as typeof activeTab)}
              className={`h-8 px-3 rounded-lg text-[14px] font-semibold transition-colors ${
                activeTab === tab.toLowerCase() ? 'bg-[#E7E7E5] text-[#222428]' : 'text-[#656b81] hover:bg-[#FBFAF7]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Summary tab */}
        {activeTab === 'summary' && (
          <>
            <p className="text-[16px] text-[#656b81] leading-[1.6]">
              {signal.tags.some(t => t.label === 'Urgent')
                ? `This signal is gaining urgency across enterprise accounts. `
                : signal.tags.some(t => t.label === 'Strengthening')
                ? `This signal is strengthening week over week. `
                : signal.tags.some(t => t.label === 'New')
                ? `This is a newly surfaced signal with early momentum. `
                : `This signal has been consistently raised across customer touchpoints. `
              }
              {`Multiple customers have flagged "${signal.title.toLowerCase()}" as a friction point tied to ${signal.theme}. With an estimated ${signal.revenue} ARR impact, it represents a meaningful opportunity to address unmet needs and improve retention.`}
            </p>

            {/* Confidence drivers */}
            <div className="flex flex-col gap-2">
              <h3 className="text-[20px] font-serif text-[#222428]">Confidence drivers</h3>
              <div className="grid grid-cols-2">
                {[
                  { value: mentions, label: 'Total Mentions' },
                  { value: customers, label: 'Unique Customers' },
                  { value: signal.revenue, label: 'Est. ARR Impact' },
                  { value: wowPct, label: 'Frequency (WoW)' },
                ].map((stat) => (
                  <div key={stat.label} className="py-3">
                    <p className="text-[32px] font-serif text-[#222428] leading-[1.2]">{stat.value}</p>
                    <p className="text-[14px] text-[#656b81] mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="h-px bg-[#e0e2e8]" />

            {/* Total feedback */}
            <div className="flex flex-col gap-4">
              <h3 className="text-[20px] font-serif text-[#222428]">Total feedback</h3>
              <div className="flex items-center gap-8">
                <div className="relative w-[195px] h-[195px] shrink-0">
                  <div
                    className="w-full h-full rounded-full"
                    style={{ background: 'conic-gradient(#b5a9ff 0% 47.2%, white 47.2% 47.6%, #c2eb7f 47.6% 60.3%, white 60.3% 60.7%, #ffabec 60.7% 86.6%, white 86.6% 87.0%, #ffbd83 87.0% 100%)' }}
                  />
                  <div className="absolute inset-[22%] bg-white rounded-full flex items-center justify-center">
                    <span className="text-[32px] font-serif text-[#222428]">190</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-8">
                  {[
                    { color: '#b5a9ff', label: 'Survey', value: 90 },
                    { color: '#ffabec', label: 'Call', value: 50 },
                    { color: '#ffbd83', label: 'Message', value: 25 },
                    { color: '#c2eb7f', label: 'App Store', value: 25 },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      <div className="w-1 rounded-full self-stretch shrink-0" style={{ backgroundColor: item.color }} />
                      <div>
                        <p className="text-[12px] text-[#656b81]">{item.label}</p>
                        <p className="text-[20px] text-[#222428] leading-[1.2]">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Feedback tab */}
        {activeTab === 'feedback' && (
          <div className="flex flex-col gap-3">
            {[
              {
                type: 'Request' as const,
                tagColor: '#c2eb7f',
                platforms: ['mobile', 'apple'],
                text: `Users are reporting that ${signal.title.toLowerCase()} is creating friction in their workflow. This is making it difficult to complete key tasks efficiently, and engagement may decline as a result.`,
                author: 'Kajsa Bell, CPO',
                date: 'Added 1 month ago',
                stars: null,
              },
              {
                type: 'Problem' as const,
                tagColor: '#ffabec',
                platforms: ['mobile', 'apple'],
                text: `"The overall experience feels slow and unresponsive when this issue occurs. Each attempt is followed by a noticeable delay, creating the impression that the system is overprocessing before responding."`,
                author: 'Marco Rossi, PM',
                date: 'Added 1 month ago',
                stars: 2,
              },
              {
                type: 'Praise' as const,
                tagColor: '#b5a9ff',
                platforms: ['mobile'],
                text: `When it works well, the experience is seamless. Users appreciate the speed and reliability when ${signal.theme.toLowerCase()} is functioning as expected.`,
                author: 'Priya Nair, Designer',
                date: 'Added 2 months ago',
                stars: null,
              },
            ].map((item, i) => (
              <div key={i} className="rounded-[12px] border border-[#e0e2e8] bg-white p-4 flex flex-col gap-3">
                {/* Top row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center h-6 px-2 rounded-full text-xs text-[#222428] whitespace-nowrap" style={{ backgroundColor: item.tagColor }}>
                      {item.type}
                    </span>
                  </div>
                  <button className="text-[#aeb2c0] hover:text-[#656b81] transition-colors">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <circle cx="8" cy="3" r="1.2" /><circle cx="8" cy="8" r="1.2" /><circle cx="8" cy="13" r="1.2" />
                    </svg>
                  </button>
                </div>

                {/* Stars */}
                {item.stars !== null && (
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }, (_, si) => (
                      <svg key={si} width="14" height="14" viewBox="0 0 16 16" fill={si < item.stars! ? '#222428' : '#e0e2e8'}>
                        <path d="M8 1l1.8 3.6L14 5.3l-3 2.9.7 4.1L8 10.4l-3.7 1.9.7-4.1-3-2.9 4.2-.7L8 1z" />
                      </svg>
                    ))}
                  </div>
                )}

                {/* Text */}
                <p className={`text-[13px] leading-[1.6] ${item.type === 'Problem' ? 'text-[#222428] font-medium' : 'text-[#222428]'}`}>
                  {item.text}
                </p>

                {/* Footer */}
                <div className="flex flex-col gap-0.5">
                  <span className="text-[12px] font-medium text-[#222428]">{item.author}</span>
                  <span className="text-[11px] text-[#aeb2c0]">{item.date}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Details tab */}
        {activeTab === 'details' && (
          <div>
            {[
              { label: 'Theme', value: signal.theme, type: 'text' },
              { label: 'Source', value: signal.sourceIcon === 'audio' ? 'Audio / Gong' : signal.sourceIcon === 'globe' ? 'Web / Market' : 'Mobile / App Store', type: 'text' },
              { label: 'Tags', value: signal.tags.map(t => t.label).join(', '), type: 'text' },
              { label: 'Est. ARR impact', value: signal.revenue + ' ARR', type: 'revenue' },
              { label: 'Companies', value: '', type: 'companies' },
              { label: 'Total mentions', value: String(mentions), type: 'score' },
              { label: 'Unique customers', value: String(customers), type: 'text' },
              { label: 'Frequency (WoW)', value: wowPct, type: 'text' },
            ].map((row) => (
              <div
                key={row.label}
                className="grid gap-6 py-3.5 border-b border-[#f1f2f5] last:border-0 items-start"
                style={{ gridTemplateColumns: '140px 1fr' }}
              >
                <span className="text-sm text-[#656b81]">{row.label}</span>
                {row.type === 'text' && (
                  <span className="text-sm text-[#222428]">{row.value}</span>
                )}
                {row.type === 'revenue' && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-[#DBFAAD] flex items-center justify-center text-[10px] font-bold text-[#222428]">$</span>
                    <span className="text-sm text-[#222428]">{row.value}</span>
                  </div>
                )}
                {row.type === 'score' && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#222428] font-medium">{row.value}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#DBFAAD] text-[#222428] font-medium">{wowPct}</span>
                  </div>
                )}
                {row.type === 'companies' && (
                  <div className="flex items-center gap-1.5">
                    {signal.companies.map((c, i) => (
                      c === 'apple'
                        ? <div key={i} className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: '#222428' }}>A</div>
                        : <div key={i} className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: '#1DB954' }}>S</div>
                    ))}
                    <span className="text-xs text-[#656b81] ml-1">+2</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Updates tab */}
        {activeTab === 'updates' && (
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
                <p className="text-[13px] text-[#656b81] leading-[1.5]">
                  This signal was captured and added to the {signal.theme} theme.
                </p>
              </div>
            </div>
          </div>
        )}


      </div>

      {/* Prompt chips + input */}
      <div className="px-6 pb-6 pt-4 shrink-0 flex flex-col gap-3">
        <div className="-mx-0 rounded-[24px] overflow-hidden py-1.5" style={{ backgroundColor: '#FBFAF7' }}>
          {SIGNAL_CHIPS.map((chip) => (
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
        <ChatInput onSubmit={() => {}} />
      </div>
    </motion.aside>
  )
}

const PROMPT_CHIPS = [
  'Walk me through the 2 unreviewed signals',
  'Why is Canvas Performance strengthening?',
  'Which themes have new signals this week?',
]

const PROMPT_RESPONSES: Record<string, { response: string; followUps: string[] }> = {
  'Walk me through the 2 unreviewed signals': {
    response: `Two signals are waiting for review.\n\n**"Permission model blocks cross-org board sharing"** has 6 upvotes and maps cleanly to the **Permission Controls** theme — four enterprise accounts raised it in sales calls this week. It's high confidence and ready to add.\n\nThe second, **"Localisation gaps prevent rollout in APAC markets"**, is harder to place. It could sit under **Localisation & i18n**, but the signal is thin — only one source so far. I'd hold it for the next review cycle unless more signals come in.\n\n**Recommended action**: Map the permission signal now. Flag the APAC signal as 'watching'.`,
    followUps: ['Map the permission signal to a theme', 'Show Permission Controls coverage', 'Is APAC localisation a new theme?'],
  },
  'Why is Canvas Performance strengthening?': {
    response: `**Canvas Performance** now has 8 signals — up from 5 last month. Three things are driving this:\n\n**Enterprise scale** — accounts with 40+ concurrent users are hitting consistent lag during live sessions. It's not edge-case behaviour anymore.\n\n**Comparison pressure** — four sales calls this week included direct comparisons to Figma's performance. Prospects are using it as a decision criterion.\n\n**Churn risk** — two accounts flagged it as a blocker to wider rollout, not just a complaint. That's a different level of urgency.\n\nThe theme confidence is at **84%** — the highest of any active theme right now. It's moved from 'monitoring' to 'act now' territory.`,
    followUps: ['Which accounts mentioned Canvas Performance?', 'Draft a roadmap recommendation', 'Show all Canvas Performance signals'],
  },
  'Which themes have new signals this week?': {
    response: `**4 themes** picked up new signals since your last review:\n\n**Canvas Performance** — 2 new signals. Enterprise lag and a direct Figma comparison from a sales call.\n\n**Enterprise Security** — 2 new signals. SSO enforcement gaps and missing audit log granularity, both from regulated-industry accounts.\n\n**AI UX Controls** — 1 new signal. Users want to reject AI suggestions inline without turning the feature off entirely.\n\n**Mobile Parity** — 1 new signal. iOS touch target sizing during workshops. Notable because it's the first from a non-enterprise account this month — the problem may be broader than enterprise.`,
    followUps: ['Tell me more about Mobile Parity', 'Show me the Enterprise Security signals', 'Which theme needs the most attention?'],
  },
  'Show Enterprise Security signals across both accounts': {
    response: `Both signals come from enterprise accounts in regulated industries.\n\n**Signal 1 — "SSO enforcement not available for guest accounts"** (Spotify, sales call). Their IT team requires SSO for all users accessing boards — including external collaborators. Guest-level access currently bypasses this entirely.\n\n**Signal 2 — "Audit logs don't capture shape-level edit history"** (Zendesk, support ticket). Their compliance team needs a full edit trail for shared boards. Current logs only capture board-level actions, not individual edits.\n\nBoth map to **Enterprise Security**. Neither has been reviewed. These are the kind of signals that quietly block enterprise expansion — they rarely generate volume, but they carry high weight in renewal conversations.`,
    followUps: ['How does this compare to competitor audit features?', 'Are there more signals from regulated industries?', 'Flag both signals as high priority'],
  },
  'Are AI UX Controls and AI Accuracy related?': {
    response: `They're related but distinct, and it's worth keeping them separate.\n\n**AI UX Controls** is about how users interact with AI — surfacing suggestions, rejecting them, understanding what triggered them. The core problem is control and transparency.\n\n**AI Accuracy** is about whether the AI output is correct — clustering quality, summarisation fidelity, relevance of suggestions. The core problem is trust.\n\nIn practice they do overlap: when accuracy is low, users lose trust in the controls entirely and turn AI features off. Two signals sit on the boundary — one where a user rejected a correct suggestion because it looked wrong, and one where accepting a suggestion caused unintended changes.\n\n**Recommendation**: Keep them separate for now but link them. If accuracy improves, you may see UX Controls signals drop naturally.`,
    followUps: ['Show me the boundary signals', 'Show AI Accuracy signals', 'How do users currently turn off AI features?'],
  },
  'Map the permission signal to a theme': {
    response: `Done. **"Permission model blocks cross-org board sharing"** has been mapped to **Permission Controls**.\n\nThe theme now has 4 signals total. Confidence score moves from 71% to **76%** with this addition — the new signal is from a named enterprise account with strong source credibility.\n\nI've also flagged **"Localisation gaps prevent rollout in APAC markets"** as 'watching' pending more signals. You'll get a notification if a second source surfaces within 14 days.`,
    followUps: ['Show Permission Controls coverage', 'Is APAC localisation a new theme?', 'Walk me through the 2 unreviewed signals'],
  },
  'Show Permission Controls coverage': {
    response: `**Permission Controls** has 4 signals across 3 source types:\n\n2 from **sales calls** — enterprise accounts asking about granular role assignment and guest access scoping.\n1 from **support tickets** — a team lead unable to restrict editing to specific frames.\n1 just added — **cross-org board sharing blocked by permission model**.\n\nCoverage is solid for the enterprise segment. The gap is **SMB and agency use cases** — no signals from those segments yet, even though the permission model likely affects them too.\n\nConfidence: **76%**. Theme status: Active.`,
    followUps: ['Which theme needs the most attention?', 'Are there more signals from regulated industries?', 'Is APAC localisation a new theme?'],
  },
  'Is APAC localisation a new theme?': {
    response: `Not yet — but it could become one.\n\n**Localisation & i18n** already exists as a theme with 3 signals, mostly focused on RTL language support and date formatting. The APAC signal fits within that theme for now, but it's a different dimension: **market entry blockers** rather than language rendering bugs.\n\nIf two more signals come in specifically about APAC rollout friction, it would justify splitting into a dedicated **APAC Market Readiness** theme. I'd leave it under Localisation & i18n for this cycle and revisit in 3–4 weeks.`,
    followUps: ['Which themes have new signals this week?', 'Which theme needs the most attention?', 'Walk me through the 2 unreviewed signals'],
  },
  'Which accounts mentioned Canvas Performance?': {
    response: `**3 enterprise accounts** flagged Canvas Performance this week:\n\n**Spotify** (sales call, Mon) — "We run design sprints with 40+ people on a single board. The lag when everyone is active at once is a dealbreaker."\n\n**Zalando** (support ticket, Wed) — Reported consistent cursor lag above 50 objects with live presence enabled. Opened as a bug, but the root cause is the same rendering bottleneck.\n\n**Shopify** (community post, Thu) — A power user compared Miro's performance unfavourably to Figma in a public thread. 34 upvotes.`,
    followUps: ['Why is Canvas Performance strengthening?', 'Draft a roadmap recommendation', 'Show all Canvas Performance signals'],
  },
  'Draft a roadmap recommendation': {
    response: `Here's a draft recommendation for **Canvas Performance**:\n\n**Recommendation**: Prioritise rendering performance for boards with 40+ concurrent users in Q2. Address cursor lag before the enterprise sales cycle peaks in Q3.\n\n**Evidence**: 8 signals across 3 enterprise accounts. Two flagged as churn risk. Direct competitor comparisons appearing in sales calls.\n\n**Suggested scope**: Investigate and resolve the rendering bottleneck that causes lag above 40 concurrent users. Target: under 100ms cursor latency at 50 users on a standard board.\n\n**Impact**: Removes a stated blocker for 2 at-risk accounts. Reduces negative sentiment in enterprise sales conversations.`,
    followUps: ['Which accounts mentioned Canvas Performance?', 'Which theme needs the most attention?', 'Show all Canvas Performance signals'],
  },
  'Show all Canvas Performance signals': {
    response: `**Canvas Performance** has 8 signals total:\n\n3 from **sales calls** — enterprise accounts citing lag as a blocker or comparison point against Figma.\n3 from **support tickets** — reported as bugs (cursor lag, slow frame loads, presence indicator delays).\n1 from a **community post** — public comparison to Figma with 34 upvotes.\n1 from an **NPS response** — "Performance on large boards is the one thing stopping us going all-in."\n\nAll 8 point to the same root cause: rendering bottleneck under concurrent load. The theme has strong signal breadth across source types.`,
    followUps: ['Which accounts mentioned Canvas Performance?', 'Draft a roadmap recommendation', 'Which theme needs the most attention?'],
  },
  'Tell me more about Mobile Parity': {
    response: `**Mobile Parity** has 7 signals total, but this new one is different from the others.\n\nMost existing signals come from enterprise accounts where mobile use is incidental — someone checking a board on their phone, not actively editing. The new signal is from an **SMB facilitator** running a workshop where half the participants were on iOS tablets.\n\nThe specific complaint: touch targets on the toolbar are too small for reliable tapping during a fast-moving session. It caused delays and frustration in front of a client.\n\nThis is the first signal where mobile is the **primary device**, not a secondary one. It may indicate a different user segment starting to adopt Miro for facilitation on mobile.`,
    followUps: ['Which themes have new signals this week?', 'Which theme needs the most attention?', 'Are there more signals from regulated industries?'],
  },
  'Show me the Enterprise Security signals': {
    response: `**Enterprise Security** has 5 signals total. The 2 new ones this week:\n\n**SSO enforcement for guests** (Spotify) — IT policy requires SSO for all board access. Guest accounts bypass it entirely.\n\n**Audit log granularity** (Zendesk) — Compliance needs shape-level edit history. Current logs are board-level only.\n\nThe 3 existing signals:\n- Admin controls for external sharing (flagged by 2 accounts)\n- IP allowlist not applying to embedded boards\n- No way to revoke access on a per-board basis for departing employees\n\nAll 5 point to gaps in the enterprise security model for regulated-industry customers.`,
    followUps: ['Show Enterprise Security signals across both accounts', 'Are there more signals from regulated industries?', 'How does this compare to competitor audit features?'],
  },
  'Which theme needs the most attention?': {
    response: `**Canvas Performance** needs the most attention right now.\n\nIt has the highest confidence score (**84%**), the most signals added this week (**2**), and is the only theme with active **churn risk** attached — two accounts explicitly described it as a blocker to wider rollout, not just a point of feedback.\n\n**Enterprise Security** is a close second. The signals there are lower volume but higher stakes — they're appearing in regulated-industry accounts where security gaps can block deals entirely.\n\nI'd recommend reviewing Canvas Performance this sprint and flagging Enterprise Security for the next product review.`,
    followUps: ['Draft a roadmap recommendation', 'Show me the Enterprise Security signals', 'Why is Canvas Performance strengthening?'],
  },
  'How does this compare to competitor audit features?': {
    response: `Competitors are ahead on audit log granularity.\n\n**Figma** offers shape-level edit history in their enterprise plan, including who changed what and when. It's been a selling point in their enterprise sales motion for 18 months.\n\n**Notion** logs page-level edits with user attribution and timestamps — not as granular as Figma but good enough for most compliance use cases.\n\n**Miro** currently logs board-level actions only: who opened it, who shared it, who exported it. No edit-level trail.\n\nFor regulated-industry accounts (finance, healthcare, legal), this gap is material. It's not a feature request — it's a compliance requirement.`,
    followUps: ['Are there more signals from regulated industries?', 'Show Enterprise Security signals across both accounts', 'Are AI UX Controls and AI Accuracy related?'],
  },
  'Are there more signals from regulated industries?': {
    response: `Yes — **6 signals total** this month came from accounts in regulated industries (finance, healthcare, legal, government).\n\n3 map to **Enterprise Security** (SSO, audit logs, access revocation).\n2 map to **Export Fidelity** — a legal team needing pixel-perfect PDF exports for filing purposes.\n1 maps to **Sharing & Access** — a healthcare provider unable to restrict board access to specific departments.\n\nRegulated-industry accounts represent **23% of enterprise ARR** but are generating **43% of security and compliance signals** this month. The signal density is high relative to their size.`,
    followUps: ['Show Enterprise Security signals across both accounts', 'How does this compare to competitor audit features?', 'Flag both signals as high priority'],
  },
  'Flag both signals as high priority': {
    response: `Both Enterprise Security signals have been flagged as **high priority**.\n\n**"SSO enforcement not available for guest accounts"** — flagged. Assigned to the Identity & Access cluster. Renewal conversation with Spotify is in 6 weeks.\n\n**"Audit logs don't capture shape-level edit history"** — flagged. Assigned to the Compliance cluster. Zendesk's contract review is in Q2.\n\nI'd recommend adding both to the agenda for next week's enterprise review. The timing on both accounts makes these time-sensitive.`,
    followUps: ['Are there more signals from regulated industries?', 'Show Enterprise Security signals across both accounts', 'How does this compare to competitor audit features?'],
  },
  'Show me the boundary signals': {
    response: `Two signals sit on the boundary between **AI UX Controls** and **AI Accuracy**:\n\n**Signal 1** — A user running a retrospective rejected AI clustering suggestions across the board, then manually recreated almost identical clusters. In the session recording, they said "I don't trust it" — but the AI output was objectively accurate. This is an accuracy-perception problem, not a controls problem.\n\n**Signal 2** — A facilitator accepted an AI summarisation of sticky notes mid-session. The summary was technically correct but stripped important nuance, causing confusion. They needed a way to partially accept it — which is a controls gap, not an accuracy gap.\n\nBoth signals are tagged to both themes for now.`,
    followUps: ['Show AI Accuracy signals', 'How do users currently turn off AI features?', 'Are AI UX Controls and AI Accuracy related?'],
  },
  'Show AI Accuracy signals': {
    response: `**AI Accuracy** has 5 signals:\n\n2 from **session recordings** — AI clustering grouped unrelated sticky notes, causing facilitators to spend time correcting it mid-session.\n\n1 from a **support ticket** — AI summarisation removed key decisions from a design review summary. The team didn't catch it until after sharing with stakeholders.\n\n1 from a **community post** — A user compared Miro's AI clustering unfavourably to FigJam's, citing more coherent groupings.\n\n1 boundary signal shared with **AI UX Controls** — correct output, low perceived trust.\n\nCommon thread: accuracy issues are most visible in **high-stakes, time-pressured sessions** where there's no margin to verify AI output.`,
    followUps: ['Are AI UX Controls and AI Accuracy related?', 'How do users currently turn off AI features?', 'Show me the boundary signals'],
  },
  'How do users currently turn off AI features?': {
    response: `Right now, there's no single toggle. Users have three partial options:\n\n**Board settings** — AI suggestions can be disabled per board by the board owner. Most users don't know this exists.\n\n**Dismissing suggestions** — Users can dismiss individual suggestions inline, but they reappear in future sessions.\n\n**Workspace admin settings** — Admins can disable AI features workspace-wide, but this is all-or-nothing and rarely used.\n\nThe gap: there's no way to say "don't suggest clustering, but keep summarisation on." Feature-level control is missing entirely.\n\nThis is the core of the **AI UX Controls** theme — and it's exactly what the new signal this week is pointing at.`,
    followUps: ['Show me the boundary signals', 'Are AI UX Controls and AI Accuracy related?', 'Show AI Accuracy signals'],
  },
}

function AIPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [activePrompt, setActivePrompt] = useState<string | null>(null)

  if (!open) return null

  const promptData = activePrompt ? PROMPT_RESPONSES[activePrompt] : null

  return (
    <motion.aside
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 40, opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
      className="fixed top-4 right-4 bottom-4 w-[472px] bg-white rounded-[20px] shadow-[0_0_12px_rgba(34,36,40,0.04),-2px_0_8px_rgba(34,36,40,0.12)] flex flex-col overflow-hidden z-30"
    >
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-6 border-b border-[#e0e2e8] bg-white z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#E7E7E5' }}>
            <span className="text-[#222428] leading-[0] flex items-center justify-center">
              <IconSparksFilled css={{ width: 16, height: 16 }} />
            </span>
          </div>
          <p className="text-[#222428] text-base font-semibold" style={{ fontFamily: 'Roobert, sans-serif' }}>
            Insights Assistant
          </p>
        </div>
        <button onClick={onClose} className="w-6 h-6 flex items-center justify-center text-[#656b81] hover:text-[#222428] transition-colors">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className={`flex-1 overflow-y-auto flex flex-col px-6 pb-0 pt-24 ${activePrompt ? '' : 'justify-end'}`}>
        {activePrompt && promptData ? (
          <AnimatePresence mode="wait">
            <motion.div key={activePrompt} className="flex flex-col gap-6 px-4 pb-4">
              {/* User bubble */}
              <motion.div
                className="flex justify-end"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
              >
                <div className="max-w-[80%] bg-[#f1f2f5] rounded-[12px] px-4 py-3">
                  <p className="text-[14px] text-[#222428]">{activePrompt}</p>
                </div>
              </motion.div>

              {/* AI response */}
              <motion.div
                className="flex items-start gap-3"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.2, ease: [0.2, 0, 0, 1] }}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: '#E7E7E5' }}>
                  <span className="text-[#222428] leading-[0] flex items-center justify-center">
                    <IconSparksFilled css={{ width: 14, height: 14 }} />
                  </span>
                </div>
                <div className="flex-1 flex flex-col gap-3">
                  {promptData.response.split('\n\n').map((para, i) => (
                    <motion.p
                      key={i}
                      className="text-[14px] text-[#222428] leading-[1.6]"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.35 + i * 0.08, ease: [0.2, 0, 0, 1] }}
                    >
                      {para.split(/\*\*(.*?)\*\*/g).map((part, j) =>
                        j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                      )}
                    </motion.p>
                  ))}
                  <motion.div
                    className="flex flex-col gap-2 mt-2"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.8, ease: [0.2, 0, 0, 1] }}
                  >
                    <div className="-mx-4 rounded-[24px] overflow-hidden py-1.5" style={{ backgroundColor: '#FBFAF7' }}>
                      {promptData.followUps.map((chip) => (
                        <button
                          key={chip}
                          onClick={() => setActivePrompt(chip)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors"
                        >
                          <span className="text-gray-400 flex-shrink-0">
                            <IconSparksFilled css={{ width: 16, height: 16 }} />
                          </span>
                          <span className="text-gray-900">{chip}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                  <motion.button
                    onClick={() => setActivePrompt(null)}
                    className="self-start mt-2 h-8 px-3 rounded-lg text-sm font-medium text-[#222428] border border-[#e0e2e8] bg-white hover:bg-[#2B2D33] hover:text-white hover:border-[#2B2D33] transition-colors"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 1.0, ease: [0.2, 0, 0, 1] }}
                  >
                    Back to overview
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="flex flex-col gap-6 px-4">
            <div className="flex flex-col gap-2">
              <p className="text-[#222428] text-[28px] font-serif leading-[1.4]">
                Hi, Kajsa
              </p>
              <div className="text-[#656b81] text-[16px] leading-[1.5]">
                <p>
                  Since last time: 14 new signals were captured across support tickets, sales calls,
                  and community posts. Signals linked to &lsquo;Canvas Performance&rsquo; have strengthened —
                  three enterprise accounts flagged it as a blocker this week.
                </p>
                <p className="mt-4">
                  Two high-priority signals are unreviewed and ready to be mapped to themes. Want me to walk you through them?
                </p>
              </div>
            </div>
            <div className="-mx-4 rounded-[24px] overflow-hidden py-1.5" style={{ backgroundColor: '#FBFAF7' }}>
              {PROMPT_CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => setActivePrompt(chip)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="text-gray-400 flex-shrink-0">
                    <IconSparksFilled css={{ width: 16, height: 16 }} />
                  </span>
                  <span className="text-gray-900">{chip}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-6 pb-6 pt-4 shrink-0">
        <ChatInput onSubmit={() => {}} />
      </div>
    </motion.aside>
  )
}

export default function SignalsPage() {
  const [aiOpen, setAiOpen] = useState(false)
  const [selectedSignal, setSelectedSignal] = useState<typeof SIGNAL_ROWS[0] | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [direction, setDirection] = useState(1)
  const openAiPanel = () => { setAiOpen(true); setSelectedSignal(null) }
  const selectSignal = (row: typeof SIGNAL_ROWS[0]) => { setSelectedSignal(row); setAiOpen(false) }

  const cardsPerPage = (aiOpen || selectedSignal) ? 2 : 4
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

  return (
    <div className="relative h-full w-full flex flex-col" style={{ backgroundColor: '#FBFAF7' }}>
      <InsightsTopBar />

      <div
        className="flex-1 overflow-y-auto"
        style={{ paddingRight: selectedSignal ? 488 : aiOpen ? 488 : 0, transition: 'padding-right 0.25s ease' }}
      >
        <main className="px-0 py-[60px] mx-[60px]">

          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
            className="rounded-[24px] p-8 pt-[132px] mb-[60px] relative min-h-[390px] shadow-sm"
            style={{ backgroundColor: '#2A2A2D' }}
            aria-labelledby="signals-heading"
          >

            <div className="absolute bottom-8 left-8">
              <div
                className="flex items-center justify-center flex-shrink-0 overflow-hidden mb-4"
                style={{ width: 64, height: 64, borderRadius: 20, boxShadow: 'rgba(34,36,40,0.04) 0px 0px 12px, rgba(34,36,40,0.12) 0px 2px 8px', backgroundColor: 'rgba(255,255,255,0.1)' }}
              >
                <span className="inline-flex items-center justify-center flex-shrink-0 text-white" style={{ width: 38, height: 38 }}>
                  <IconRectanglesThreeOverlap css={{ width: 24, height: 24 }} />
                </span>
              </div>
              <h1 id="signals-heading" className="text-[60px] font-serif text-white mb-3">
                Signals
              </h1>
              <p className="text-[20px] text-white/70 max-w-md leading-relaxed">
                Track early indicators and emerging patterns across your product and market.
              </p>
            </div>
          </motion.section>

          {/* ── Featured ── */}
          <section className="mb-[60px]">
            <div className="flex items-center gap-2 mb-5">
              <h2 className="text-[24px] font-serif text-[#222428]">Featured</h2>
              <span className="text-[14px] text-[#656b81]">12 signals</span>
              <span className="flex items-center gap-1 h-6 px-2 rounded-full text-xs font-medium text-[#222428]" style={{ backgroundColor: '#DBFAAD' }}>7 new</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[#aeb2c0]">
                <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M8 5.5v.5M8 7.5v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0 overflow-visible relative">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={safePage}
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
                    className={`grid gap-[22px] pb-1 ${(aiOpen || selectedSignal) ? 'grid-cols-2' : 'grid-cols-4'}`}
                  >
                    {pages[safePage].map((card) => (
                      <FeaturedCard key={card.id} card={card} />
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>

              <button
                onClick={goNext}
                className="w-8 h-8 rounded-full border border-[#e0e2e8] bg-white flex items-center justify-center shrink-0 hover:bg-[#f1f2f5] transition-colors"
                aria-label="Next"
              >
                <ChevronRight className="w-4 h-4 text-[#656b81]" />
              </button>
            </div>

            {/* Pagination dots */}
            <div className="flex items-center justify-center gap-2 mt-4">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => goToPage(i)}
                  aria-label={`Go to page ${i + 1}`}
                  className={`rounded-full transition-all ${i === safePage ? 'w-2 h-2 bg-[#222428]' : 'w-1.5 h-1.5 bg-[#d0d2d8] opacity-60'}`}
                />
              ))}
            </div>
          </section>

          {/* ── Signals table ── */}
          <section>
            <div className="sticky top-0 z-10 bg-[#FBFAF7] pb-5">
              <div className="flex items-center gap-2">
                <h2 className="text-[24px] font-serif text-[#222428]">Signals</h2>
                <span className="text-[14px] text-[#656b81]">14 results</span>
                <span className="flex items-center gap-1 h-6 px-2 rounded-full text-xs font-medium" style={{ backgroundColor: '#DBFAAD', color: '#222428' }}>6 new</span>
                <div className="flex items-center gap-2 ml-auto">
                  <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f1f2f5] transition-colors text-[#656b81]">
                    <Search className="w-4 h-4" />
                  </button>
                  <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#e0e2e8] text-sm text-[#222428] hover:bg-[#f1f2f5] transition-colors">
                    Latest <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f1f2f5] transition-colors text-[#656b81]">
                    <SlidersHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

              <div className="overflow-hidden">
                <div className="grid gap-4 px-5 py-3 border-b border-[#e0e2e8] text-xs font-semibold text-[#656b81] uppercase tracking-wide" style={{ gridTemplateColumns: (aiOpen || selectedSignal) ? '24px 48px 1fr 1fr 100px 90px 90px 90px' : '24px 48px 1fr 1fr 180px 90px 90px 90px' }}>
                  <span />
                  <span>Source</span>
                  <span>Title</span>
                  <span>Theme</span>
                  <span>Tags</span>
                  <span>Impact</span>
                  <span>Est. revenue</span>
                  <span>Companies</span>
                </div>
                {SIGNAL_ROWS.map((row, i) => (
                  <motion.div
                    key={row.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.05 }}
                    onClick={() => selectSignal(row)}
                    className={`grid gap-4 px-5 py-3.5 items-center border-b border-[#e0e2e8] last:border-0 hover:bg-[#E7E7E5] transition-colors cursor-pointer ${selectedSignal?.id === row.id ? 'bg-[#E7E7E5]' : ''}`}
                    style={{ gridTemplateColumns: (aiOpen || selectedSignal) ? '24px 48px 1fr 1fr 100px 90px 90px 90px' : '24px 48px 1fr 1fr 180px 90px 90px 90px' }}
                  >
                    <span className="text-xs text-[#aeb2c0]">{row.id}</span>
                    <SourceIconComp type={row.sourceIcon} />
                    <p className="text-sm font-semibold text-[#222428] truncate">{row.title}</p>
                    <p className="text-sm text-[#656b81] truncate">{row.theme}</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {row.tags.map((tag) => <TagPill key={tag.label} label={tag.label} />)}
                    </div>
                    <p className="text-sm text-[#9ca0ad]">{row.impact}</p>
                    <p className="text-sm text-[#9ca0ad]">{row.revenue}</p>
                    <div className="flex items-center gap-1">
                      {row.companies.map((c) => c === 'apple' ? <AppleLogo key={c} /> : <SpotifyLogo key={c} />)}
                      <span className="text-xs text-[#9ca0ad] ml-0.5">+2</span>
                    </div>
                  </motion.div>
                ))}
              </div>
          </section>

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

      <AIPanel open={aiOpen} onClose={() => setAiOpen(false)} />

      <AnimatePresence>
        {selectedSignal && (
          <SignalDetailPanel
            signal={selectedSignal}
            onClose={() => setSelectedSignal(null)}
          />
        )}
      </AnimatePresence>

    </div>
  )
}
