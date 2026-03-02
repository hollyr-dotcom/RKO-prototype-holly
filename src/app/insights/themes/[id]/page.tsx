'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Play, Search, SlidersHorizontal, ChevronDown, RotateCcw } from 'lucide-react'
import { IconSparksFilled, IconSmileyChat, IconGlobe, IconExclamationPointCircle, IconChartLine, IconArrowDown, IconThumbsUp, IconChatLinesTwo } from '@mirohq/design-system-icons'
import InsightsTopBar from '@/components/InsightsTopBar'
import { THEME_CARDS, THEME_ANALYSIS, type ThemeCard } from '@/data/themes-data'

// ─── Tag colour map ────────────────────────────────────────────────────────────

const TAG_COLORS: Record<string, string> = {
  New: '#DBFAAD',
  Urgent: '#FFABEC',
  Customer: '#FFED7B',
  Market: '#A0C4FB',
  Strengthening: '#FFBD83',
  Weakening: '#B5A9FF',
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
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 2h8a1 1 0 011 1v10l-5-3-5 3V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}
function MoreIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="4" r="1" fill="currentColor" />
      <circle cx="8" cy="8" r="1" fill="currentColor" />
      <circle cx="8" cy="12" r="1" fill="currentColor" />
    </svg>
  )
}
function ThumbsUpIcon() {
  return <IconThumbsUp css={{ width: 14, height: 14 }} />
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
    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[#2B2D33]">
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
  audio: '#f17de5',
  clips: '#b9b5ff',
  quote: '#ffdc4a',
}

const FEATURED_CARDS = [
  { id: '1', type: 'audio' as const, badge: 'Audio', title: 'User Interview: Sam Ledezma', description: 'Discussion on "Heavy Board" load times and visual comfort.', date: 'Jul 14', source: 'Gong' },
  { id: '2', type: 'clips' as const, badge: '2 Clips', title: 'Call with Siemens Admin', participants: 'Henry Park, Sarah Parker, +3 more', description: 'Ayoub El Assri discusses SCIM provisioning hurdles.', date: 'Jul 14', source: 'Gong' },
  { id: '3', type: 'quote' as const, quote: '"The new feature clearly drives revenue when adopted, but most users aren\'t getting there. We\'re investing in big bets while the core experience that drives engagement feels stuck."', duration: '32m 34s', title: 'Call with Spotify', person: 'John Cusick', date: 'Jul 14', source: 'Gong', logo: 'spotify' },
  { id: '4', type: 'quote' as const, quote: '"The Miro Assist summarization has cut our research review time by 60%… We can now cluster insights across thousands of sticky notes in seconds."', duration: '12m 04s', title: 'Call with Apple', person: 'James Watson', date: 'Jul 14', source: 'Gong', logo: 'apple' },
  { id: '5', type: 'audio' as const, badge: 'Audio', title: 'User Interview: Priya Nair', description: 'Frustration with AI suggestions appearing mid-session — breaks focus during live workshops.', date: 'Jul 18', source: 'Gong' },
  { id: '6', type: 'clips' as const, badge: '4 Clips', title: 'Call with Adobe', participants: 'Marco Rossi, Leah Kim, +2 more', description: 'Team requests persistent cursor visibility across large boards during collaborative reviews.', date: 'Jul 21', source: 'Gong' },
  { id: '7', type: 'quote' as const, quote: '"We run design sprints with 40+ people on a single board. The lag when everyone is active at once is a dealbreaker — we\'ve nearly lost the account over it."', duration: '28m 12s', title: 'Call with Spotify', person: 'Anna Bergström', date: 'Jul 22', source: 'Gong', logo: 'spotify' },
  { id: '8', type: 'quote' as const, quote: '"We need SSO that actually works with our IdP out of the box. Every workaround costs us an IT sprint and delays our org-wide rollout."', duration: '41m 07s', title: 'Call with Apple', person: 'Derek Chu', date: 'Jul 25', source: 'Gong', logo: 'apple' },
  { id: '9', type: 'audio' as const, badge: 'Audio', title: 'User Interview: Tomás Herrera', description: 'Wants template locking so junior designers can\'t accidentally overwrite research structures.', date: 'Aug 1', source: 'Gong' },
  { id: '10', type: 'clips' as const, badge: '3 Clips', title: 'Call with Siemens PM', participants: 'Rachel Moore, Ben Okafor, +1 more', description: 'Requesting granular export controls — PDF fidelity and selective frame exports are blocking enterprise handoff.', date: 'Aug 3', source: 'Gong' },
  { id: '11', type: 'quote' as const, quote: '"Diagramming in Miro is close but the auto-layout still falls short for complex system maps. One misaligned node and the whole thing breaks."', duration: '19m 48s', title: 'Call with Spotify', person: 'Clara Johansson', date: 'Aug 6', source: 'Gong', logo: 'spotify' },
  { id: '12', type: 'audio' as const, badge: 'Audio', title: 'User Interview: Kenji Watanabe', description: 'Wants real-time translation in sticky notes for cross-regional workshops — a blocker for APAC teams.', date: 'Aug 8', source: 'Gong' },
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

function FeaturedCard({ card }: { card: typeof FEATURED_CARDS[0] }) {
  const accent = CARD_ACCENT[card.type]
  return (
    <div className="w-full h-full rounded-[16px] overflow-hidden" style={{ backgroundColor: accent, padding: '2px 2px 6px 2px' }}>
      <div className="bg-white rounded-[16px] flex flex-col gap-3 p-3 h-full">
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
              <p className="text-[14px] font-semibold text-[#222428] text-center leading-[1.4]">{card.quote}</p>
              {'duration' in card && <p className="text-[12px] text-[#656b81] text-center">{card.duration}</p>}
            </div>
          )}
          <button className="absolute top-2 right-2 w-6 h-6 rounded-[6px] bg-white/80 flex items-center justify-center text-[#656b81] hover:bg-white transition-colors">
            <CopyIcon />
          </button>
        </div>

        {(card.type === 'audio' || card.type === 'clips') && (
          <span className="h-5 px-2 bg-[#3859FF] text-white text-[10px] font-medium rounded-[4px] flex items-center w-fit">
            {card.badge}
          </span>
        )}

        <div className={`flex flex-col gap-1.5 flex-1 min-h-0 ${card.type !== 'quote' ? 'justify-end' : ''}`}>
          {card.type !== 'quote' && (
            <>
              {'participants' in card && card.participants && <p className="text-[12px] text-[#656b81]">{card.participants}</p>}
              <p className="text-[14px] font-semibold text-[#222428] leading-[1.4]">{card.title}</p>
              {'description' in card && card.description && <p className="text-[12px] text-[#656b81] leading-[1.4]">{card.description}</p>}
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

        <div className="h-px bg-[#e0e2e8] shrink-0 -mx-1" />
        <div className="flex items-center gap-2 shrink-0">
          <span className="flex items-center justify-center w-[28px] h-[28px] border border-[#c7c7d1] rounded-[4px] text-[#656b81] shrink-0">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 2h10M1 5h10M1 8h7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
            </svg>
          </span>
          <span className="flex items-center gap-1 h-[28px] px-2 bg-[#f2f2f2] rounded-[4px] text-[12px] text-[#050038] shrink-0">
            <CalendarIcon />{card.date}
          </span>
          <span className="flex items-center gap-1 h-[28px] px-2 border border-[#e0e2e8] rounded-[4px] text-[12px] text-[#222428] shrink-0">
            <GongIcon />{card.source}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Detail signals table ──────────────────────────────────────────────────────

const DETAIL_SIGNALS = [
  { id: '1', sourceIcon: 'audio', title: 'Canvas lag with 40+ concurrent users', description: 'Three enterprise accounts flagged as Q3 retention blocker.', person: { name: 'Zac Brown', initials: 'ZB', bg: '#FFED7B' }, revenue: '$2.1M', company: { name: 'Google', letter: 'G', bg: '#4285F4' } },
  { id: '2', sourceIcon: 'globe', title: 'AI suggestions interrupt live workshops', description: 'Mid-session interruptions break workshop flow and focus.', person: { name: 'Sarah B', initials: 'SB', bg: '#FFABEC' }, revenue: '$850K', company: { name: 'Blizzard', letter: 'B', bg: '#00AEFF' } },
  { id: '3', sourceIcon: 'mobile', title: 'Cursors invisible to collaborators on 4K boards', description: 'Collaboration breaks down when cursor presence disappears.', person: { name: 'Mika B', initials: 'MB', bg: '#DBFAAD' }, revenue: '$620K', company: { name: 'Apple', letter: 'A', bg: '#555' } },
  { id: '4', sourceIcon: 'globe', title: 'SAML / SSO breaks with Okta and Azure AD', description: 'Six-figure deals stalled at procurement over SSO failures.', person: { name: 'Zac Brown', initials: 'ZB', bg: '#FFED7B' }, revenue: '$1.4M', company: { name: 'Adobe', letter: 'A', bg: '#E0001B' } },
  { id: '5', sourceIcon: 'audio', title: 'PDF exports lose fonts on large frames', description: 'Enterprise handoff workflows blocked by export fidelity.', person: { name: 'Sarah B', initials: 'SB', bg: '#FFABEC' }, revenue: '$540K', company: { name: 'Google', letter: 'G', bg: '#4285F4' } },
  { id: '6', sourceIcon: 'mobile', title: 'SCIM provisioning fails silently on first sync', description: 'IT teams report silent failures blocking org-wide rollouts.', person: { name: 'Mika B', initials: 'MB', bg: '#DBFAAD' }, revenue: '$1.1M', company: { name: 'Apple', letter: 'A', bg: '#555' } },
  { id: '7', sourceIcon: 'globe', title: 'Boards with 500+ objects take 8+ seconds to load', description: 'Heavy boards cause session abandonment in enterprise accounts.', person: { name: 'Zac Brown', initials: 'ZB', bg: '#FFED7B' }, revenue: '$760K', company: { name: 'Blizzard', letter: 'B', bg: '#00AEFF' } },
  { id: '8', sourceIcon: 'audio', title: 'Auto-layout breaks on complex system maps', description: 'Architecture diagrams with 50+ nodes fail to auto-arrange.', person: { name: 'Sarah B', initials: 'SB', bg: '#FFABEC' }, revenue: '$720K', company: { name: 'Adobe', letter: 'A', bg: '#E0001B' } },
]

// ─── AI Panel ─────────────────────────────────────────────────────────────────

function AIPanel({ open, onClose, theme, showAnalysis, onDismissAnalysis }: { open: boolean; onClose: () => void; theme: ThemeCard; showAnalysis?: boolean; onDismissAnalysis?: () => void }) {
  const [input, setInput] = useState('')
  const analysisData = THEME_ANALYSIS['analysis-' + theme.id]
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
          <p className="text-[#222428] text-base font-semibold" style={{ fontFamily: 'Roobert, sans-serif' }}>Insights Assistant</p>
        </div>
        <button onClick={onClose} className="w-6 h-6 flex items-center justify-center text-[#656b81] hover:text-[#222428] transition-colors">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className={`flex-1 overflow-y-auto flex flex-col px-6 pb-0 pt-24 ${showAnalysis ? '' : 'justify-end'}`}>
        {showAnalysis ? (
          <AnimatePresence mode="wait">
            <motion.div key="analysis" className="flex flex-col gap-6 px-4 pb-4">
              {/* User bubble */}
              <motion.div
                className="flex justify-end"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
              >
                <div className="max-w-[80%] bg-[#f1f2f5] rounded-[12px] px-4 py-3">
                  <p className="text-[14px] text-[#222428]">View analysis</p>
                </div>
              </motion.div>

              {/* AI response */}
              <motion.div
                className="flex items-start gap-3"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.2, ease: [0.2, 0, 0, 1] }}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: '#3859FF' }}>
                  <span className="text-white leading-[0] flex items-center justify-center">
                    <IconSparksFilled css={{ width: 14, height: 14 }} />
                  </span>
                </div>
                <div className="flex-1 flex flex-col gap-3">
                  {(analysisData?.response ?? '').split('\n\n').map((para, i) => (
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
                  {analysisData?.prompts && (
                    <motion.div
                      className="flex flex-col gap-2 mt-2"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.8, ease: [0.2, 0, 0, 1] }}
                    >
                      {analysisData.prompts.map((chip) => (
                        <button key={chip} className="flex items-center gap-1.5 h-8 pl-3 pr-2 border border-[#e0e2e8] rounded-[8px] bg-white text-[13px] text-[#222428] hover:bg-[#f1f2f5] transition-colors text-left w-fit">
                          <span className="shrink-0 leading-[0] flex items-center justify-center opacity-70">
                            <IconSparksFilled css={{ width: 14, height: 14 }} />
                          </span>
                          <span className="pr-1">{chip}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                  <motion.button
                    onClick={onDismissAnalysis}
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
              <p className="text-[#222428] text-[28px] font-serif leading-[1.4]">Theme deep-dive</p>
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
              {['Summarise signals for this theme', 'Draft a roadmap recommendation', 'Show related customer quotes'].map((chip) => (
                <button key={chip} className="flex items-center gap-1 h-8 pl-3 pr-2 border border-[#e0e2e8] rounded-[8px] bg-white text-[14px] text-[#222428] hover:bg-[#f1f2f5] transition-colors text-left w-fit">
                  <span className="shrink-0 opacity-70 leading-[0] flex items-center justify-center">
                    <IconSparksFilled css={{ width: 16, height: 16 }} />
                  </span>
                  <span className="pr-1">{chip}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="px-6 pb-6 pt-6 shrink-0">
        <div className="border border-[#e0e2e8] rounded-[8px] overflow-hidden">
          <div className="px-4 pt-4 pb-6">
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="What can I do next?" className="w-full text-[14px] text-[#222428] placeholder-[#7d8297] bg-transparent outline-none" />
          </div>
          <div className="flex items-center justify-between px-2 py-2">
            <div className="flex items-center">
              <button className="w-8 h-8 flex items-center justify-center rounded text-[#656b81] hover:bg-[#f1f2f5] transition-colors">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded text-[#656b81] hover:bg-[#f1f2f5] transition-colors">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="3.5" stroke="currentColor" strokeWidth="1.5" /><path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </button>
            </div>
            <button className="w-8 h-8 flex items-center justify-center rounded bg-[#e9eaef] text-[#656b81]">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 12V4M4 8l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
        </div>
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
  const [currentPage, setCurrentPage] = useState(0)
  const [direction, setDirection] = useState(1)
  const [activeTab, setActiveTab] = useState<'signals' | 'details' | 'comments' | 'updates'>('signals')
  const [showAnalysis, setShowAnalysis] = useState(false)

  const theme = THEME_CARDS.find((c) => c.id === String(params.id))

  const cardsPerPage = aiOpen ? 2 : 4
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
        <p className="text-[#656b81]">Theme not found.</p>
      </div>
    )
  }

  const stats = deriveStats(theme)
  const signalCount = 12

  return (
    <div className="relative h-full w-full flex flex-col" style={{ backgroundColor: '#FBFAF7' }}>
      <InsightsTopBar onPromptClick={() => setAiOpen(true)} />

      <div
        className="flex-1 overflow-y-auto"
        style={{ paddingRight: aiOpen ? 400 : 0, transition: 'padding-right 0.25s ease' }}
      >
        <main className="px-0 py-[60px] mx-[60px]">

          {/* Breadcrumb */}
          <div className="flex items-center gap-1 mb-6 h-7">
            <Link
              href="/insights/themes"
              className="text-[14px] font-medium text-[#656b81] hover:text-[#222428] transition-colors whitespace-nowrap"
              style={{ fontFamily: 'Roobert, sans-serif' }}
            >
              Themes
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#aeb2c0] shrink-0" />
            <span
              className="text-[14px] font-medium text-[#222428] truncate"
              style={{ fontFamily: 'Roobert, sans-serif' }}
            >
              Theme detail
            </span>
          </div>

          {/* ── Hero ── */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.2, 0, 0, 1] }}
            className="rounded-xl p-8 pt-[132px] mb-8 relative min-h-[440px] shadow-sm"
            style={{ backgroundColor: '#2B2D33' }}
          >
            {/* Top-right badges */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1.5 border border-white/20 text-white">
                <ThumbsUpIcon />
                <span className="text-xs font-medium">{theme.meta.likes}</span>
              </div>
              <button className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors text-white/70">
                <BookmarkIcon />
              </button>
              <button className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors text-white/70">
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
              <h1 className="text-[48px] font-serif text-white leading-[1.2] mb-3">
                {theme.title}
              </h1>

              {/* Description */}
              <p className="text-[16px] text-white/70 leading-[1.6] mb-6 max-w-2xl">
                {theme.description}
              </p>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button className="h-9 px-4 rounded-lg text-sm font-medium bg-white text-[#222428] hover:bg-white/90 transition-colors">
                  {theme.primaryAction.label}
                </button>
              </div>
            </div>
          </motion.section>

          {/* ── Confidence drivers ── */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[24px] font-serif text-[#222428]">Confidence drivers</h2>
              <button onClick={() => { setShowAnalysis(true); setAiOpen(true); }} className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#222428] text-sm font-medium text-white hover:bg-[#2e3036] transition-colors">
                <span className="leading-[0]"><IconSparksFilled css={{ width: 14, height: 14 }} /></span>
                View analysis
              </button>
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
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-5">
              <h2 className="text-[24px] font-serif text-[#222428]">Featured</h2>
              <span className="text-[14px] text-[#656b81]">{signalCount} signals</span>
              <span className="text-[14px] text-[#656b81]">7 new</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[#aeb2c0]">
                <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M8 5.5v.5M8 7.5v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0 overflow-hidden relative">
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
                    className={`grid ${aiOpen ? 'grid-cols-2' : 'grid-cols-4'} gap-[22px] pb-1`}
                  >
                    {pages[safePage].map((card) => (
                      <FeaturedCard key={card.id} card={card} />
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
                    className={`flex items-center gap-1.5 h-8 px-3 rounded-lg text-[14px] transition-colors ${
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

            {/* Signals table */}
            {activeTab === 'signals' && (
              <div className="overflow-hidden">
                {/* Header */}
                <div
                  className="grid gap-4 px-5 py-3 border-b border-[#e0e2e8] text-xs font-semibold text-[#656b81] uppercase tracking-wide"
                  style={{ gridTemplateColumns: '24px 48px 1fr 1fr 120px 90px 110px' }}
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
                    className="grid gap-4 px-5 py-3.5 items-center border-b border-[#e0e2e8] last:border-0 hover:bg-[#fafafa] transition-colors cursor-pointer"
                    style={{ gridTemplateColumns: '24px 48px 1fr 1fr 120px 90px 110px' }}
                  >
                    <span className="text-xs text-[#aeb2c0]">{row.id}</span>
                    <SourceIconComp type={row.sourceIcon} />
                    <p className="text-sm font-semibold text-[#222428] truncate">{row.title}</p>
                    <p className="text-sm text-[#656b81] truncate">{row.description}</p>
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold text-[#222428] shrink-0" style={{ backgroundColor: row.person.bg }}>
                        {row.person.initials}
                      </div>
                      <span className="text-sm text-[#222428] truncate">{row.person.name}</span>
                    </div>
                    <p className="text-sm text-[#222428] font-medium">{row.revenue}</p>
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: row.company.bg }}>
                        {row.company.letter}
                      </div>
                      <span className="text-sm text-[#222428] truncate">{row.company.name}</span>
                    </div>
                  </motion.div>
                ))}
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
                        <div className="w-5 h-5 rounded-full bg-[#FFED7B] flex items-center justify-center text-[10px] font-semibold text-[#222428] shrink-0">K</div>
                        <span className="text-sm text-[#222428]">{row.value}</span>
                      </div>
                    )}
                    {row.type === 'score' && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[#222428] font-medium">{row.value}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#DBFAAD] text-[#222428] font-medium">{row.badge}</span>
                      </div>
                    )}
                    {row.type === 'revenue' && (
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-[#DBFAAD] flex items-center justify-center text-[10px] font-bold text-[#222428]">$</span>
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
                    <div className="w-8 h-8 rounded-full bg-[#3859FF] flex items-center justify-center shrink-0">
                      <span className="text-white leading-[0] flex items-center justify-center">
                        <IconSparksFilled css={{ width: 14, height: 14 }} />
                      </span>
                    </div>
                    <p className="flex-1 text-sm text-[#222428]">
                      <span className="font-semibold">Miro Insights</span>{' '}
                      {item.action}
                      {item.date && <span className="text-[#656b81]"> • {item.date}</span>}
                    </p>
                    <button className="w-8 h-8 flex items-center justify-center rounded-lg text-[#aeb2c0] hover:text-[#656b81] hover:bg-[#f1f2f5] transition-colors shrink-0">
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

      <AIPanel open={aiOpen} onClose={() => { setAiOpen(false); setShowAnalysis(false); }} theme={theme} showAnalysis={showAnalysis} onDismissAnalysis={() => setShowAnalysis(false)} />
    </div>
  )
}
