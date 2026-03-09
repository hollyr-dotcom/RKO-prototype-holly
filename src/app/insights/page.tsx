'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

// ─── Sidebar nav item ──────────────────────────────────────────────────────────

function NavItem({ label, active, href }: { label: string; active?: boolean; href: string }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-3 py-[5px] rounded-md text-[14px] transition-colors ${
        active ? 'bg-white/15 text-white font-semibold' : 'text-white/50 hover:text-white/80 hover:bg-white/8'
      }`}
    >
      <span className={active ? 'text-white/60' : 'text-white/30'}>#</span>
      {label}
    </Link>
  )
}

// ─── Overview card ─────────────────────────────────────────────────────────────

function OverviewCard() {
  return (
    <Link href="/insights/overview">
      <motion.div
        whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(34,36,40,0.12)' }}
        transition={{ duration: 0.15 }}
        className="rounded-[10px] border border-[#e0e2e8] bg-white overflow-hidden cursor-pointer"
        style={{ width: 320, boxShadow: '0 2px 8px rgba(34,36,40,0.06)' }}
      >
        {/* Header */}
        <div className="px-4 py-3 flex items-center gap-3 border-b border-[#e0e2e8]">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#FFDD33' }}>
            <svg width="14" height="14" viewBox="0 0 33 32" fill="none">
              <path d="M19.3 2.7h-5.1l-3.5 8.2-3.5-8.2H2l4.9 10.6L2 24h5.2l3.5-8.2 3.5 8.2h5.1l-4.9-10.7 4.9-10.6zm7.4 0h-5.2l6.5 10.6L22.5 24h5.2l6.5-10.7-7.5-10.6z" fill="#1C1C1E"/>
            </svg>
          </div>
          <div>
            <p className="text-[14px] font-semibold text-[#4262FF] leading-tight">Insights Overview</p>
            <p className="text-[12px] text-[#656b81]">Miro Insights</p>
          </div>
        </div>

        {/* Metric grid */}
        <div className="p-4 grid grid-cols-2 gap-2.5" style={{ backgroundColor: '#C6DCFF18' }}>
          {[
            { label: 'Feature adoption', value: '+8.5%', bg: '#ADF0C7' },
            { label: 'Active Users',     value: '+12.1%', bg: '#C6DCFF' },
            { label: 'New Users',        value: '+8.3%',  bg: '#FFD8F4' },
            { label: 'Avg Session',      value: '−30s',   bg: '#FFF6B6' },
          ].map(stat => (
            <div key={stat.label} className="rounded-[8px] p-3" style={{ backgroundColor: stat.bg + 'CC' }}>
              <p className="text-[20px] font-serif text-[#222428] leading-tight">{stat.value}</p>
              <p className="text-[11px] text-[#656b81] mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </Link>
  )
}

// ─── Signals card ──────────────────────────────────────────────────────────────

function SignalsCard() {
  const signals = [
    { title: 'Canvas lag with 40+ concurrent users',         tag: 'Urgent',    impact: 94, tagBg: '#FFD8F4' },
    { title: 'SAML / SSO breaks with Okta and Azure AD',     tag: 'Customer',  impact: 91, tagBg: '#FFF6B6' },
    { title: 'PDF exports lose fonts on large frames',        tag: 'Customer',  impact: 63, tagBg: '#FFF6B6' },
    { title: 'Auto-layout breaks on complex system maps',     tag: 'Market',    impact: 78, tagBg: '#C6DCFF' },
  ]

  return (
    <Link href="/insights/signals">
      <motion.div
        whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(34,36,40,0.12)' }}
        transition={{ duration: 0.15 }}
        className="rounded-[10px] border border-[#e0e2e8] bg-white overflow-hidden cursor-pointer"
        style={{ width: 320, boxShadow: '0 2px 8px rgba(34,36,40,0.06)' }}
      >
        {/* Header */}
        <div className="px-4 py-3 flex items-center gap-3 border-b border-[#e0e2e8]">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#FFDD33' }}>
            <svg width="14" height="14" viewBox="0 0 33 32" fill="none">
              <path d="M19.3 2.7h-5.1l-3.5 8.2-3.5-8.2H2l4.9 10.6L2 24h5.2l3.5-8.2 3.5 8.2h5.1l-4.9-10.7 4.9-10.6zm7.4 0h-5.2l6.5 10.6L22.5 24h5.2l6.5-10.7-7.5-10.6z" fill="#1C1C1E"/>
            </svg>
          </div>
          <div>
            <p className="text-[14px] font-semibold text-[#4262FF] leading-tight">Signals</p>
            <p className="text-[12px] text-[#656b81]">Miro Insights</p>
          </div>
        </div>

        {/* Signal rows */}
        <div style={{ backgroundColor: '#ADF0C718' }}>
          {signals.map((row, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-b border-[#e0e2e8]/50 last:border-0">
              <p className="text-[13px] font-medium text-[#222428] flex-1 min-w-0 truncate">{row.title}</p>
              <span
                className="text-[11px] px-2 py-0.5 rounded-full shrink-0 text-[#222428]"
                style={{ backgroundColor: row.tagBg }}
              >
                {row.tag}
              </span>
              <span className="text-[12px] text-[#9ca0ad] w-6 text-right shrink-0">{row.impact}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </Link>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function InsightsLandingPage() {
  return (
    <div className="h-full w-full flex overflow-hidden">

      {/* ── Sidebar ── */}
      <div className="w-[220px] shrink-0 flex flex-col h-full" style={{ backgroundColor: '#2A2A2D' }}>

        {/* Workspace header */}
        <div className="flex items-center gap-2.5 px-4 h-14 border-b border-white/10 shrink-0">
          <img
            src="https://www.figma.com/api/mcp/asset/1b5baebf-49e4-4442-8f19-83bf3d2d059b"
            alt="FlexFund"
            className="w-6 h-6 rounded-md shrink-0"
          />
          <span className="text-white font-semibold text-[14px] tracking-tight">FlexFund</span>
          <svg className="ml-auto text-white/30" width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto px-2 py-4 flex flex-col gap-5">
          <div>
            <p className="text-[11px] font-semibold text-white/30 uppercase tracking-wider px-3 mb-1.5">Channels</p>
            <NavItem label="insights"  href="/insights/overview" active />
            <NavItem label="amped"     href="/insights/themes" />
            <NavItem label="general"   href="/insights/signals" />
          </div>

          <div>
            <p className="text-[11px] font-semibold text-white/30 uppercase tracking-wider px-3 mb-1.5">Direct Messages</p>
            {['Kyra Wong', 'Mark B-S', 'Product Leader'].map(name => (
              <div key={name} className="flex items-center gap-2 px-3 py-[5px] text-[14px] text-white/40">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400/70 shrink-0" />
                {name}
              </div>
            ))}
          </div>

          {/* Skeleton items */}
          <div className="px-3 flex flex-col gap-2 mt-2">
            {[100, 80, 90, 70].map((w, i) => (
              <div key={i} className="h-[8px] rounded-full bg-white/8" style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">

        {/* Channel header */}
        <div className="flex items-center gap-2 px-6 h-14 border-b border-[#e0e2e8] shrink-0">
          <span className="text-[#aeb2c0] text-[18px] font-light">#</span>
          <span className="font-semibold text-[#222428] text-[15px]">insights</span>
          <div className="ml-auto flex items-center gap-2">
            <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#f1f2f5] transition-colors text-[#656b81]">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#f1f2f5] transition-colors text-[#656b81]">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="2" r="1.2" fill="currentColor"/>
                <circle cx="7" cy="7" r="1.2" fill="currentColor"/>
                <circle cx="7" cy="12" r="1.2" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-6 py-8">

          {/* Date divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-[#e0e2e8]" />
            <span className="text-[12px] text-[#656b81] font-medium px-2 border border-[#e0e2e8] rounded-full py-0.5">Today</span>
            <div className="flex-1 h-px bg-[#e0e2e8]" />
          </div>

          {/* AI message */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
            className="flex gap-3"
          >
            {/* Avatar */}
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
              style={{ backgroundColor: '#FFDD33' }}
            >
              <svg width="14" height="14" viewBox="0 0 33 32" fill="none">
                <path d="M19.3 2.7h-5.1l-3.5 8.2-3.5-8.2H2l4.9 10.6L2 24h5.2l3.5-8.2 3.5 8.2h5.1l-4.9-10.7 4.9-10.6zm7.4 0h-5.2l6.5 10.6L22.5 24h5.2l6.5-10.7-7.5-10.6z" fill="#1C1C1E"/>
              </svg>
            </div>

            {/* Body */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="font-semibold text-[#222428] text-[15px]">Insights AI</span>
                <span className="text-[12px] text-[#aeb2c0]">Today at 9:00 AM</span>
              </div>

              <p className="text-[15px] text-[#222428] leading-[1.65] mb-2">
                Good morning team 👋 Here&apos;s your weekly Insights summary. Active users are up{' '}
                <strong>+12.1%</strong> and feature adoption is growing at <strong>+8.5%</strong>. Three
                high-impact signals are tracking as enterprise blockers — canvas performance, SSO failures,
                and export fidelity.
              </p>

              <p className="text-[15px] text-[#222428] leading-[1.65] mb-5">
                Explore the full overview or dive into signals below:
              </p>

              {/* Cards */}
              <div className="flex gap-4 flex-wrap">
                <OverviewCard />
                <SignalsCard />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Message input */}
        <div className="px-6 pb-6 shrink-0">
          <div className="border border-[#e0e2e8] rounded-[10px] px-4 py-3 text-[14px] text-[#aeb2c0] hover:border-[#c5c7cf] transition-colors cursor-text">
            Message #insights
          </div>
        </div>
      </div>
    </div>
  )
}
