'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Users, Search, SlidersHorizontal, ChevronDown, ChevronRight, Play } from 'lucide-react'
import { IconSparksFilled, IconSmileyChat, IconGlobe } from '@mirohq/design-system-icons'
import InsightsTopBar from '@/components/InsightsTopBar'

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
  {
    id: '1', sourceIcon: 'audio',
    title: 'Canvas lag when 40+ users are active on a single board',
    theme: 'Canvas Performance',
    tags: [{ label: 'Customer' }, { label: 'Urgent' }] as SignalTag[],
    revenue: '$2.1M',
    companies: ['apple', 'spotify'],
  },
  {
    id: '2', sourceIcon: 'globe',
    title: 'AI suggestions interrupt focus during live workshops',
    theme: 'AI UX Controls',
    tags: [{ label: 'Customer' }, { label: 'Market' }, { label: 'New' }] as SignalTag[],
    revenue: '$850K',
    companies: ['spotify'],
  },
  {
    id: '3', sourceIcon: 'mobile',
    title: 'Cursors invisible to collaborators on large 4K boards',
    theme: 'Collaboration Visibility',
    tags: [{ label: 'Customer' }, { label: 'Market' }] as SignalTag[],
    revenue: '$620K',
    companies: ['apple', 'spotify'],
  },
  {
    id: '4', sourceIcon: 'audio',
    title: 'SAML / SSO breaks with Okta and Azure AD out of the box',
    theme: 'Enterprise Security',
    tags: [{ label: 'Customer' }, { label: 'Urgent' }, { label: 'Strengthening' }] as SignalTag[],
    revenue: '$1.4M',
    companies: ['apple'],
  },
  {
    id: '5', sourceIcon: 'globe',
    title: 'Templates overwritten by junior team members accidentally',
    theme: 'Permission Controls',
    tags: [{ label: 'Customer' }, { label: 'Market' }] as SignalTag[],
    revenue: '$390K',
    companies: ['spotify'],
  },
  {
    id: '6', sourceIcon: 'mobile',
    title: 'PDF exports lose fonts and break layout on large frames',
    theme: 'Export Fidelity',
    tags: [{ label: 'Customer' }] as SignalTag[],
    revenue: '$540K',
    companies: ['apple', 'spotify'],
  },
  {
    id: '7', sourceIcon: 'audio',
    title: 'Auto-layout breaks on complex multi-level system maps',
    theme: 'Diagramming Engine',
    tags: [{ label: 'Market' }, { label: 'Strengthening' }, { label: 'Customer' }] as SignalTag[],
    revenue: '$720K',
    companies: ['spotify'],
  },
  {
    id: '8', sourceIcon: 'globe',
    title: 'No real-time translation support for APAC workshop teams',
    theme: 'Localisation & i18n',
    tags: [{ label: 'Market' }, { label: 'New' }] as SignalTag[],
    revenue: '$480K',
    companies: ['apple'],
  },
  {
    id: '9', sourceIcon: 'mobile',
    title: 'SCIM provisioning fails silently on first-time sync',
    theme: 'Enterprise Security',
    tags: [{ label: 'Customer' }, { label: 'Urgent' }] as SignalTag[],
    revenue: '$1.1M',
    companies: ['apple', 'spotify'],
  },
  {
    id: '10', sourceIcon: 'audio',
    title: 'Boards with 500+ objects take 8+ seconds to fully load',
    theme: 'Canvas Performance',
    tags: [{ label: 'Customer' }, { label: 'Strengthening' }, { label: 'Urgent' }] as SignalTag[],
    revenue: '$760K',
    companies: ['spotify', 'apple'],
  },
  {
    id: '11', sourceIcon: 'globe',
    title: 'Miro Assist clusters stickies into incorrect or vague themes',
    theme: 'AI Accuracy',
    tags: [{ label: 'Customer' }, { label: 'New' }] as SignalTag[],
    revenue: '$330K',
    companies: ['spotify'],
  },
  {
    id: '12', sourceIcon: 'mobile',
    title: 'Enterprise onboarding missing bulk admin controls for orgs',
    theme: 'Onboarding & Admin',
    tags: [{ label: 'Market' }, { label: 'New' }] as SignalTag[],
    revenue: '$290K',
    companies: ['apple', 'spotify'],
  },
  {
    id: '13', sourceIcon: 'audio',
    title: 'Share link permissions confuse guests unfamiliar with Miro',
    theme: 'Sharing & Access',
    tags: [{ label: 'Customer' }, { label: 'Weakening' }, { label: 'Market' }] as SignalTag[],
    revenue: '$450K',
    companies: ['apple'],
  },
  {
    id: '14', sourceIcon: 'mobile',
    title: 'Mobile app missing sticky note editing and frame navigation',
    theme: 'Mobile Parity',
    tags: [{ label: 'Market' }] as SignalTag[],
    revenue: '$380K',
    companies: ['spotify'],
  },
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

  return (
    <div
      className="w-full h-full rounded-[16px] overflow-hidden"
      style={{ backgroundColor: accent, padding: '2px 2px 6px 2px' }}
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
                <p className="text-[12px] text-[#656b81]">{'person' in card ? card.person : ''}</p>
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
    </div>
  )
}

// ─── Signal detail panel ──────────────────────────────────────────────────────

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
      className="fixed top-4 right-4 bottom-4 w-[480px] bg-white rounded-[20px] shadow-[0_2px_10px_rgba(5,0,56,0.08)] flex flex-col overflow-hidden z-30"
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
                activeTab === tab.toLowerCase() ? 'bg-[#f2f4fc] text-[#3859FF]' : 'text-[#656b81] hover:bg-[#f1f2f5]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="h-px bg-[#e0e2e8] -mt-2" />

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
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: '#3859FF' }}>
                <span className="text-white leading-[0] flex items-center justify-center">
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
    </motion.aside>
  )
}

const PROMPT_CHIPS = [
  'What signals changed most this week?',
  'Which signals should I act on now?',
  'Summarise signals by theme',
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
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-6 border-b border-[#e0e2e8] bg-white z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#3859FF' }}>
            <span className="text-white leading-[0] flex items-center justify-center">
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

      <div className="flex-1 overflow-y-auto flex flex-col justify-end px-6 pb-0 pt-24">
        <div className="flex flex-col gap-6 px-4">
          <div className="flex items-start">
            <div className="flex items-center gap-1 bg-[#f1f2f5] rounded-full pr-2">
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#3859FF' }}>
                <span className="text-white leading-[0] flex items-center justify-center">
                  <IconSparksFilled css={{ width: 16, height: 16 }} />
                </span>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 6L8 10L12 6" stroke="#222428" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
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
          <div className="flex flex-col gap-3">
            {PROMPT_CHIPS.map((chip) => (
              <button
                key={chip}
                className="flex items-center gap-1 h-8 pl-3 pr-2 border border-[#e0e2e8] rounded-[8px] bg-white text-[14px] text-[#222428] hover:bg-[#f1f2f5] transition-colors text-left w-fit"
              >
                <span className="shrink-0 opacity-70 leading-[0] flex items-center justify-center">
                  <IconSparksFilled css={{ width: 16, height: 16 }} />
                </span>
                <span className="pr-1">{chip}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

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

export default function SignalsPage() {
  const [aiOpen, setAiOpen] = useState(true)
  const [selectedSignal, setSelectedSignal] = useState<typeof SIGNAL_ROWS[0] | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [direction, setDirection] = useState(1)
  const [tableTab, setTableTab] = useState<'signals' | 'comments' | 'updates'>('signals')

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
      <InsightsTopBar onPromptClick={openAiPanel} />

      <div
        className="flex-1 overflow-y-auto"
        style={{ paddingRight: selectedSignal ? 496 : aiOpen ? 400 : 0, transition: 'padding-right 0.25s ease' }}
      >
        <main className="px-0 py-[60px] mx-[60px]">

          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
            className="rounded-xl p-8 pt-[132px] mb-[60px] relative min-h-[440px] shadow-sm"
            style={{ backgroundColor: '#2A2A2D' }}
            aria-labelledby="signals-heading"
          >
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
              <div className="flex-1 min-w-0 overflow-hidden relative">
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
              <div className="flex items-center gap-2 mb-5">
                <h2 className="text-[24px] font-serif text-[#222428]">Signals</h2>
                <span className="text-[14px] text-[#656b81]">14 results</span>
                <span className="flex items-center gap-1 h-6 px-2 rounded-full text-xs font-medium" style={{ backgroundColor: '#DBFAAD', color: '#222428' }}>6 new</span>
              </div>
              <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {([
                  { id: 'signals' as const, label: 'Signals', count: 0 },
                  { id: 'comments' as const, label: 'Comments', count: 5 },
                  { id: 'updates' as const, label: 'Updates', count: 4 },
                ]).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setTableTab(tab.id)}
                    className={`flex items-center gap-1.5 h-8 px-3 rounded-lg text-[14px] transition-colors ${
                      tableTab === tab.id ? 'bg-[#222428] text-white' : 'text-[#656b81] hover:bg-white'
                    }`}
                  >
                    {tab.label}
                    {tab.count > 0 && (
                      <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${tableTab === tab.id ? 'bg-white/20 text-white' : 'bg-[#e9eaef] text-[#656b81]'}`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
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

            {tableTab === 'signals' && (
              <div className="overflow-hidden">
                <div className="grid gap-4 px-5 py-3 border-b border-[#e0e2e8] text-xs font-semibold text-[#656b81] uppercase tracking-wide" style={{ gridTemplateColumns: '24px 48px 1fr 1fr 180px 100px 100px' }}>
                  <span />
                  <span>Source</span>
                  <span>Title</span>
                  <span>Theme</span>
                  <span>Tags</span>
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
                    className={`grid gap-4 px-5 py-3.5 items-center border-b border-[#e0e2e8] last:border-0 hover:bg-[#fafafa] transition-colors cursor-pointer ${selectedSignal?.id === row.id ? 'bg-[#f2f4fc]' : ''}`}
                    style={{ gridTemplateColumns: '24px 48px 1fr 1fr 180px 100px 100px' }}
                  >
                    <span className="text-xs text-[#aeb2c0]">{row.id}</span>
                    <SourceIconComp type={row.sourceIcon} />
                    <p className="text-sm font-semibold text-[#222428] truncate">{row.title}</p>
                    <p className="text-sm text-[#656b81] truncate">{row.theme}</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {row.tags.map((tag) => <TagPill key={tag.label} label={tag.label} />)}
                    </div>
                    <p className="text-sm text-[#222428] font-medium">{row.revenue}</p>
                    <div className="flex items-center gap-1">
                      {row.companies.map((c) => c === 'apple' ? <AppleLogo key={c} /> : <SpotifyLogo key={c} />)}
                      <span className="text-xs text-[#656b81] ml-0.5">+2</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {tableTab === 'comments' && (
              <div>
                {[
                  { name: 'Kajsa Bell', initials: 'KB', bg: '#FFED7B', date: 'May 21, 2026', comment: "Three of our top enterprise accounts flagged canvas performance and SSO as linked blockers. We should treat them as a single reliability narrative in the roadmap." },
                  { name: 'Marco Rossi', initials: 'MR', bg: '#FFABEC', date: 'May 20, 2026', comment: 'Agreed — the SCIM provisioning signal is compounding the SSO issue. IT teams are re-syncing manually after every Okta update.' },
                  { name: 'Priya Nair', initials: 'PN', bg: '#DBFAAD', date: 'May 18, 2026', comment: 'The AI UX Controls signal is worth watching. Mid-session interruptions keep appearing in workshop feedback across different accounts.' },
                  { name: 'James Watson', initials: 'JW', bg: '#A0C4FB', date: 'May 15, 2026', comment: 'Moved Canvas Performance to "Next" in the roadmap sync. The +18% WoW spike is hard to ignore heading into renewal season.' },
                  { name: 'Anna Bergström', initials: 'AB', bg: '#FFBD83', date: 'May 14, 2026', comment: "Export fidelity is blocking enterprise handoffs at Siemens. They've mentioned it three calls in a row — escalating to PM." },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 py-4 border-b border-[#f1f2f5] last:border-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold text-[#222428] shrink-0" style={{ backgroundColor: item.bg }}>
                      {item.initials}
                    </div>
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

            {tableTab === 'updates' && (
              <div>
                {[
                  { action: 'added 6 new signals from Gong calls this week', date: 'May 21, 2026' },
                  { action: 'flagged Canvas Performance as high priority based on WoW frequency spike', date: 'May 20, 2026' },
                  { action: 'linked 3 signals to the Enterprise Security theme', date: 'May 18, 2026' },
                  { action: 'updated revenue estimates across 4 signals based on latest ARR data', date: 'May 15, 2026' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 py-4 border-b border-[#f1f2f5] last:border-0">
                    <div className="w-8 h-8 rounded-full bg-[#3859FF] flex items-center justify-center shrink-0">
                      <span className="text-white leading-[0] flex items-center justify-center">
                        <IconSparksFilled css={{ width: 14, height: 14 }} />
                      </span>
                    </div>
                    <p className="flex-1 text-sm text-[#222428]">
                      <span className="font-semibold">Miro Insights</span>{' '}
                      {item.action}
                      <span className="text-[#656b81]"> • {item.date}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

        </main>
      </div>

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
