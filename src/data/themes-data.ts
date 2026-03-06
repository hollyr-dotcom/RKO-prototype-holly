export type ThemeTag = { label: string }

export type ThemeCard = {
  id: string
  image?: string
  tags: ThemeTag[]
  title: string
  description: string
  meta: {
    sources: number
    arr: string
    confidence: string
    confidenceDelta: string
    likes: number
    comments?: number
  }
  primaryAction: { label: string; variant: 'filled' | 'outline' }
  secondaryAction?: { label: string }
}

export const THEME_CARDS: ThemeCard[] = [
  {
    id: '1',
    tags: [{ label: 'New' }, { label: 'Customer' }, { label: 'Market' }],
    title: 'Jira custom fields demand surged +65% this quarter',
    description: 'Time-sensitive — competitor gap is closing. Demand accelerating while the window for differentiation narrows.',
    meta: { sources: 0, arr: '$2.3 Million ARR', confidence: '99%', confidenceDelta: '+1%', likes: 1, comments: 1 },
    primaryAction: { label: 'Move to "Next"', variant: 'filled' },
    secondaryAction: { label: 'View details' },
  },
  {
    id: '2',
    tags: [{ label: 'New' }, { label: 'Customer' }],
    title: 'Adoption plateau signals mismatch between vision and usage',
    description: 'Suggestion created: Re-align roadmap to actual usage patterns and double down on the feature with proven revenue lift, rather than continuing to fund lower-impact bets.',
    meta: { sources: 0, arr: '$2.3 Million ARR', confidence: '88%', confidenceDelta: '+1%', likes: 3 },
    primaryAction: { label: 'Edit roadmap', variant: 'filled' },
    secondaryAction: { label: 'View details' },
  },
  {
    id: '3',
    tags: [{ label: 'New' }, { label: 'Customer' }],
    title: '3 enterprise accounts mentioned "portfolio view" — wasn\'t in your top 20',
    description: 'Feature adoption dropped below 5% threshold — silent abandonment',
    meta: { sources: 1, arr: '$2.3 Million ARR', confidence: '80%', confidenceDelta: '+5%', likes: 1, comments: 1 },
    primaryAction: { label: 'View details', variant: 'outline' },
  },
  {
    id: '4',
    tags: [{ label: 'Urgent' }, { label: 'Customer' }, { label: 'Market' }],
    title: 'AI sticky note clustering saves facilitators 40+ minutes per session',
    description: 'Users running retrospectives and workshops report AI summarisation as the single biggest time-saver. Competitor parity risk — Figma FigJam shipped a similar feature last sprint.',
    meta: { sources: 3, arr: '$4.1 Million ARR', confidence: '94%', confidenceDelta: '+3%', likes: 7, comments: 3 },
    primaryAction: { label: 'Move to "Next"', variant: 'filled' },
    secondaryAction: { label: 'View details' },
  },
  {
    id: '5',
    tags: [{ label: 'Strengthening' }, { label: 'Customer' }],
    title: 'Real-time cursor lag on boards with 50+ objects drives session abandonment',
    description: 'Performance degradation consistently cited in enterprise churn interviews. 12 accounts flagged canvas lag as a blocker to wider team rollout.',
    meta: { sources: 2, arr: '$3.6 Million ARR', confidence: '91%', confidenceDelta: '+2%', likes: 5, comments: 2 },
    primaryAction: { label: 'File bug report', variant: 'filled' },
    secondaryAction: { label: 'View details' },
  },
  {
    id: '6',
    tags: [{ label: 'New' }, { label: 'Market' }],
    title: 'Template library depth is a top-3 purchase criteria for mid-market buyers',
    description: 'Sales call analysis shows prospects comparing template counts directly against Lucidspark and Conceptboard. Current gap: 340 vs 600+ competitor templates.',
    meta: { sources: 4, arr: '$1.8 Million ARR', confidence: '76%', confidenceDelta: '+8%', likes: 4 },
    primaryAction: { label: 'Edit roadmap', variant: 'filled' },
    secondaryAction: { label: 'View details' },
  },
  {
    id: '7',
    tags: [{ label: 'Weakening' }, { label: 'Customer' }],
    title: 'Mobile editing experience cited in 18% of negative NPS responses',
    description: 'Touch target sizing and zoom behaviour on iOS prevent meaningful contribution from mobile. Signal weakening as desktop-first habits persist post-pandemic.',
    meta: { sources: 0, arr: '$0.9 Million ARR', confidence: '72%', confidenceDelta: '-2%', likes: 2, comments: 1 },
    primaryAction: { label: 'View details', variant: 'outline' },
  },
  {
    id: '8',
    tags: [{ label: 'Urgent' }, { label: 'Customer' }],
    title: 'Async video comments reduce meeting load — users want it on every object',
    description: 'Teams using Loom embeds report 30% fewer sync meetings. Demand to expand native async video to shapes, connectors, and frames — not just sticky notes.',
    meta: { sources: 2, arr: '$2.7 Million ARR', confidence: '88%', confidenceDelta: '+4%', likes: 9, comments: 5 },
    primaryAction: { label: 'Move to "Next"', variant: 'filled' },
    secondaryAction: { label: 'View details' },
  },
  {
    id: '9',
    tags: [{ label: 'Customer' }, { label: 'Strengthening' }],
    title: 'Smart shape suggestions during diagramming cut creation time by half',
    description: 'Users building flowcharts and org charts want AI to auto-suggest the next shape based on context. Early beta testers show 2x faster diagram completion rates.',
    meta: { sources: 3, arr: '$3.2 Million ARR', confidence: '86%', confidenceDelta: '+6%', likes: 11, comments: 4 },
    primaryAction: { label: 'Move to "Next"', variant: 'filled' },
    secondaryAction: { label: 'View details' },
  },
  {
    id: '10',
    tags: [{ label: 'New' }, { label: 'Customer' }],
    title: 'Guest access limitations blocking external contractor collaboration',
    description: 'Freelancers and agency partners can\'t edit specific sections without full workspace access. 23 enterprise accounts raised this as a blocker to wider rollout.',
    meta: { sources: 2, arr: '$1.9 Million ARR', confidence: '83%', confidenceDelta: '+3%', likes: 6, comments: 2 },
    primaryAction: { label: 'Edit roadmap', variant: 'filled' },
    secondaryAction: { label: 'View details' },
  },
  {
    id: '11',
    tags: [{ label: 'Urgent' }, { label: 'Market' }],
    title: 'Presentation mode lacking speaker notes drives users back to PowerPoint',
    description: 'Product managers and designers need speaker notes during live walkthroughs. 40% of users who churn back to slide tools cite this gap as their primary reason.',
    meta: { sources: 4, arr: '$4.5 Million ARR', confidence: '92%', confidenceDelta: '+2%', likes: 14, comments: 7 },
    primaryAction: { label: 'Move to "Next"', variant: 'filled' },
    secondaryAction: { label: 'View details' },
  },
  {
    id: '12',
    tags: [{ label: 'Customer' }, { label: 'Strengthening' }],
    title: 'Cross-board search returning incomplete results frustrates power users',
    description: 'Enterprise teams with 500+ boards report search missing sticky notes and embedded content. Confidence in search has dropped — users resort to manual browsing.',
    meta: { sources: 1, arr: '$2.1 Million ARR', confidence: '79%', confidenceDelta: '+1%', likes: 5, comments: 3 },
    primaryAction: { label: 'File bug report', variant: 'filled' },
    secondaryAction: { label: 'View details' },
  },
  {
    id: '13',
    tags: [{ label: 'New' }, { label: 'Customer' }, { label: 'Market' }],
    title: 'Unlimited undo history is now table stakes — 50-step limit causes friction',
    description: 'Figma and Notion both offer deep undo history. Users running long workshops hit the limit mid-session and lose significant work, driving negative NPS responses.',
    meta: { sources: 3, arr: '$1.4 Million ARR', confidence: '81%', confidenceDelta: '+4%', likes: 8, comments: 2 },
    primaryAction: { label: 'Edit roadmap', variant: 'filled' },
    secondaryAction: { label: 'View details' },
  },
  {
    id: '14',
    tags: [{ label: 'Strengthening' }, { label: 'Customer' }],
    title: 'Nested frames enable structured content — demand up 55% from design teams',
    description: 'Design and product teams use nested frames to represent component hierarchies and page layouts. Current flat frame model forces workarounds with grouped shapes.',
    meta: { sources: 2, arr: '$2.8 Million ARR', confidence: '85%', confidenceDelta: '+7%', likes: 10, comments: 4 },
    primaryAction: { label: 'Move to "Next"', variant: 'filled' },
    secondaryAction: { label: 'View details' },
  },
  {
    id: '15',
    tags: [{ label: 'New' }, { label: 'Market' }],
    title: 'Custom brand colour palettes per workspace requested by 60% of agencies',
    description: 'Creative agencies need to lock workspace colours to client brand guidelines. Current workaround of saving hex codes in a sticky note is cited as unprofessional in pitches.',
    meta: { sources: 2, arr: '$1.7 Million ARR', confidence: '77%', confidenceDelta: '+3%', likes: 7, comments: 1 },
    primaryAction: { label: 'Edit roadmap', variant: 'filled' },
    secondaryAction: { label: 'View details' },
  },
  {
    id: '16',
    tags: [{ label: 'Weakening' }, { label: 'Customer' }],
    title: 'Comment threading diluted by lack of resolution states',
    description: 'Design review comments pile up with no way to mark them resolved or assign follow-ups. Signal weakening as teams migrate feedback workflows to Linear and Notion.',
    meta: { sources: 1, arr: '$0.8 Million ARR', confidence: '68%', confidenceDelta: '-3%', likes: 3 },
    primaryAction: { label: 'View details', variant: 'outline' },
  },
  {
    id: '17',
    tags: [{ label: 'Urgent' }, { label: 'Customer' }, { label: 'Market' }],
    title: 'Notion integration tops third-party request list for two consecutive quarters',
    description: 'Product and engineering teams want to embed live Notion pages in boards and push Miro frames as Notion documents. Zapier workarounds add 20+ minutes to weekly rituals.',
    meta: { sources: 5, arr: '$5.1 Million ARR', confidence: '96%', confidenceDelta: '+2%', likes: 18, comments: 9 },
    primaryAction: { label: 'Move to "Next"', variant: 'filled' },
    secondaryAction: { label: 'View details' },
  },
  {
    id: '18',
    tags: [{ label: 'New' }, { label: 'Customer' }],
    title: 'Whiteboard session recording unlocks async review for distributed teams',
    description: 'Remote-first teams want to record facilitated sessions with cursor playback for members in different time zones. Competitors Mural and FigJam both ship this in Q3.',
    meta: { sources: 3, arr: '$3.0 Million ARR', confidence: '84%', confidenceDelta: '+5%', likes: 12, comments: 6 },
    primaryAction: { label: 'Edit roadmap', variant: 'filled' },
    secondaryAction: { label: 'View details' },
  },
  {
    id: '19',
    tags: [{ label: 'Strengthening' }, { label: 'Market' }],
    title: 'Advanced table widget closing the gap with Airtable for lightweight data tasks',
    description: 'Users managing sprint trackers and OKR tables inside Miro want sorting, filtering, and formula support. Signal strengthening as Miro becomes the single source of truth for more teams.',
    meta: { sources: 2, arr: '$2.4 Million ARR', confidence: '80%', confidenceDelta: '+5%', likes: 8, comments: 3 },
    primaryAction: { label: 'Move to "Next"', variant: 'filled' },
    secondaryAction: { label: 'View details' },
  },
  {
    id: '20',
    tags: [{ label: 'New' }, { label: 'Customer' }],
    title: 'AI meeting facilitation reduces facilitator prep time by 60%',
    description: 'Teams want AI to auto-generate agendas, timers, and icebreakers based on meeting type. Early interest strongest in HR and L&D personas running large-scale workshops.',
    meta: { sources: 2, arr: '$3.8 Million ARR', confidence: '78%', confidenceDelta: '+9%', likes: 13, comments: 5 },
    primaryAction: { label: 'Edit roadmap', variant: 'filled' },
    secondaryAction: { label: 'View details' },
  },
  {
    id: '21',
    tags: [{ label: 'Weakening' }, { label: 'Customer' }],
    title: 'Keyboard shortcut discoverability below industry standard',
    description: 'Power users report Miro\'s shortcut coverage is comprehensive but invisible. Requests for a command palette (Cmd+K) have plateaued — signal weakening as habit forms around mouse-only workflows.',
    meta: { sources: 0, arr: '$0.5 Million ARR', confidence: '65%', confidenceDelta: '-1%', likes: 2 },
    primaryAction: { label: 'View details', variant: 'outline' },
  },
  {
    id: '22',
    tags: [{ label: 'Urgent' }, { label: 'Customer' }],
    title: 'Board loading time exceeds 8 seconds for teams with embedded media',
    description: 'Boards containing video embeds, large PDFs, and Figma frames take 8–15 seconds to load. Five enterprise accounts have opened support tickets flagging this as a retention risk.',
    meta: { sources: 3, arr: '$3.3 Million ARR', confidence: '93%', confidenceDelta: '+1%', likes: 6, comments: 4 },
    primaryAction: { label: 'File bug report', variant: 'filled' },
    secondaryAction: { label: 'View details' },
  },
  {
    id: '23',
    tags: [{ label: 'New' }, { label: 'Market' }],
    title: 'Custom fonts support is a hard blocker for brand-conscious enterprise buyers',
    description: 'Legal, financial, and pharmaceutical enterprises require specific typefaces for compliance. Three six-figure deals stalled at procurement due to absence of custom font upload.',
    meta: { sources: 2, arr: '$6.2 Million ARR', confidence: '89%', confidenceDelta: '+4%', likes: 15, comments: 3 },
    primaryAction: { label: 'Move to "Next"', variant: 'filled' },
    secondaryAction: { label: 'View details' },
  },
  {
    id: '24',
    tags: [{ label: 'Strengthening' }, { label: 'Customer' }, { label: 'Market' }],
    title: 'WCAG AA compliance gaps affecting public sector and education deals',
    description: 'Screen reader support and keyboard navigation fall short of WCAG AA standards. EU accessibility legislation effective 2025 is accelerating urgency across 14 enterprise accounts.',
    meta: { sources: 4, arr: '$4.7 Million ARR', confidence: '91%', confidenceDelta: '+6%', likes: 10, comments: 5 },
    primaryAction: { label: 'Edit roadmap', variant: 'filled' },
    secondaryAction: { label: 'View details' },
  },
  {
    id: '25',
    tags: [{ label: 'Customer' }, { label: 'Strengthening' }],
    title: 'Offline mode for field teams unlocks manufacturing and healthcare use cases',
    description: 'Field engineers and clinical teams operate in connectivity-limited environments. Offline board access with sync-on-reconnect would open two entirely new market verticals.',
    meta: { sources: 2, arr: '$2.9 Million ARR', confidence: '74%', confidenceDelta: '+3%', likes: 7, comments: 2 },
    primaryAction: { label: 'Edit roadmap', variant: 'filled' },
    secondaryAction: { label: 'View details' },
  },
  {
    id: '26',
    tags: [{ label: 'New' }, { label: 'Customer' }],
    title: 'Live voting and polling in sticky note clusters accelerates consensus',
    description: 'Facilitators running dot-voting sessions use workarounds with emoji reactions. Native polling with real-time result visualisation is the top request from agile coaches.',
    meta: { sources: 2, arr: '$1.6 Million ARR', confidence: '82%', confidenceDelta: '+4%', likes: 9, comments: 3 },
    primaryAction: { label: 'Edit roadmap', variant: 'filled' },
    secondaryAction: { label: 'View details' },
  },
  {
    id: '27',
    tags: [{ label: 'Urgent' }, { label: 'Market' }],
    title: 'Miro\'s pricing jump at 10 seats is causing mid-market churn to Lucidspark',
    description: 'Teams of 8–15 report sticker shock when crossing the 10-seat threshold. Competitor analysis shows Lucidspark\'s flat-rate plan captures 34% of churned Miro mid-market accounts.',
    meta: { sources: 5, arr: '$7.4 Million ARR', confidence: '95%', confidenceDelta: '+2%', likes: 20, comments: 11 },
    primaryAction: { label: 'View details', variant: 'outline' },
  },
  {
    id: '28',
    tags: [{ label: 'New' }, { label: 'Customer' }, { label: 'Market' }],
    title: 'Real-time translation for global teams removes language as a collaboration barrier',
    description: 'Multinational enterprises with non-English-speaking stakeholders want sticky note and comment auto-translation. Signal emerging strongly from APAC and LATAM expansion cohorts.',
    meta: { sources: 2, arr: '$2.2 Million ARR', confidence: '71%', confidenceDelta: '+8%', likes: 11, comments: 4 },
    primaryAction: { label: 'Edit roadmap', variant: 'filled' },
    secondaryAction: { label: 'View details' },
  },
  {
    id: '29',
    tags: [{ label: 'Weakening' }, { label: 'Customer' }],
    title: 'Mind map mode adoption plateauing as Miro users default to sticky notes',
    description: 'Mind map feature usage has flatlined at 8% MAU after initial spike. Users prefer freeform sticky note layouts over structured mind map constraints.',
    meta: { sources: 1, arr: '$0.6 Million ARR', confidence: '63%', confidenceDelta: '-4%', likes: 2, comments: 1 },
    primaryAction: { label: 'View details', variant: 'outline' },
  },
  {
    id: '30',
    tags: [{ label: 'Strengthening' }, { label: 'Customer' }],
    title: 'Sprint planning templates driving 3x retention in engineering teams',
    description: 'Engineering teams who use the sprint planning template during onboarding show 3x 90-day retention vs. those who start with a blank board. Signal strengthening with each new template added.',
    meta: { sources: 3, arr: '$4.0 Million ARR', confidence: '90%', confidenceDelta: '+5%', likes: 16, comments: 6 },
    primaryAction: { label: 'Move to "Next"', variant: 'filled' },
    secondaryAction: { label: 'View details' },
  },
]

export const THEME_SIGNALS = [
  { id: '1', type: 'audio' as const, badge: '1 Clip', title: 'User Interview: Sam Ledezma', description: 'Discussion on "Heavy Board" load times and visual comfort.', date: 'Jul 14', source: 'Gong', person: 'Sam Ledezma', company: 'Figma' },
  { id: '2', type: 'audio' as const, badge: '1 Clip', title: 'Call with Siemens Admin', description: 'Ayoub El Assri discusses SCIM provisioning hurdles.', date: 'Jul 14', source: 'Gong', person: 'Ayoub El Assri', company: 'Siemens' },
  { id: '3', type: 'quote' as const, quote: '"The new feature clearly drives revenue when adopted, but most users aren\'t getting there. We\'re investing in big bets while the core experience that drives engagement feels stuck."', title: 'Call with Spotify', person: 'John Cusick', company: 'Spotify', date: 'Jul 14', source: 'Gong' },
  { id: '4', type: 'quote' as const, quote: '"The Miro Assist summarization has cut our research review time by 60%… We can now cluster insights across thousands of sticky notes in seconds."', title: 'Call with Apple', person: 'James Watson', company: 'Apple', date: 'Jul 14', source: 'Gong' },
  { id: '5', type: 'audio' as const, badge: '1 Clip', title: 'User Interview: Priya Nair', description: 'Frustration with AI suggestions appearing mid-session — breaks focus during live workshops.', date: 'Jul 18', source: 'Gong', person: 'Priya Nair', company: 'Miro' },
  { id: '6', type: 'audio' as const, badge: '1 Clip', title: 'Call with Adobe', description: 'Team requests persistent cursor visibility across large boards during collaborative reviews.', date: 'Jul 21', source: 'Gong', person: 'Sofia Reyes', company: 'Adobe' },
  { id: '7', type: 'quote' as const, quote: '"We run design sprints with 40+ people on a single board. The lag when everyone is active at once is a dealbreaker — we\'ve nearly lost the account over it."', title: 'Call with Spotify', person: 'Anna Bergström', company: 'Spotify', date: 'Jul 22', source: 'Gong' },
  { id: '8', type: 'quote' as const, quote: '"We need SSO that actually works with our IdP out of the box. Every workaround costs us an IT sprint and delays our org-wide rollout."', title: 'Call with Apple', person: 'Derek Chu', company: 'Apple', date: 'Jul 25', source: 'Gong' },
  { id: '9', type: 'audio' as const, badge: '1 Clip', title: 'User Interview: Tomás Herrera', description: 'Wants template locking so junior designers can\'t accidentally overwrite research structures.', date: 'Aug 1', source: 'Gong', person: 'Tomás Herrera', company: 'Atlassian' },
  { id: '10', type: 'audio' as const, badge: '1 Clip', title: 'Call with Siemens PM', description: 'Requesting granular export controls — PDF fidelity and selective frame exports are blocking enterprise handoff.', date: 'Aug 3', source: 'Gong', person: 'Klaus Weber', company: 'Siemens' },
  { id: '11', type: 'quote' as const, quote: '"Diagramming in Miro is close but the auto-layout still falls short for complex system maps. One misaligned node and the whole thing breaks."', title: 'Call with Spotify', person: 'Clara Johansson', company: 'Spotify', date: 'Aug 6', source: 'Gong' },
  { id: '12', type: 'audio' as const, badge: '1 Clip', title: 'User Interview: Kenji Watanabe', description: 'Wants real-time translation in sticky notes for cross-regional workshops — a blocker for APAC teams.', date: 'Aug 8', source: 'Gong', person: 'Kenji Watanabe', company: 'Sony' },
]

export const THEME_ANALYSIS: Record<string, { response: string; prompts?: string[] }> = {
  'analysis-1': {
    response: `**Jira custom fields demand surged +65% this quarter** is your highest-confidence theme at 99% — and it's still climbing (+1%).

**Confidence drivers:**

**1. Unprompted, repeated mentions** — Multiple enterprise accounts raised Jira custom fields independently across discovery calls, with no prompting from the sales team. Spontaneous recurrence is the strongest signal type.

**2. Sustained NPS verbatims** — "Jira" and "fields" appear together in NPS detractor comments across three consecutive quarters, pointing to a persistent unmet need rather than a passing complaint.

**3. Competitor parity risk** — Market signals show Notion and Linear have already shipped custom field parity. Every week this ships is a week competitors can close the gap.

**4. Sales call pattern** — Custom fields rank in the top 3 unmet needs when prospects compare Miro against Confluence alternatives. This is actively costing deals.

**Recommended action:** The confidence and ARR impact ($2.3M) justify fast-tracking. Move to "Next" on the roadmap this sprint.`,
    prompts: ["What's the risk if we delay this?", 'Show me the signals behind this theme', 'How does this compare to other urgent themes?'],
  },
  'analysis-2': {
    response: `**Adoption plateau signals mismatch between vision and usage** sits at 88% confidence (+1%) — a steady signal pointing to a structural product-market fit issue.

**Confidence drivers:**

**1. Flat DAU/MAU ratio** — Daily active users relative to monthly actives has been flat for six weeks despite new feature releases, suggesting features aren't reaching the core use case.

**2. Low feature uptake** — Adoption of template and diagram tools is below 15% across the active user base. Users are creating, but not using the tools designed to drive retention.

**3. Session recording patterns** — Recordings show users repeatedly returning to familiar, simple canvas interactions rather than exploring higher-value features.

**4. High creation, low revisit** — Product analytics show strong first-session board creation, but boards are rarely revisited or built upon — a sign of shallow engagement.

**Recommended action:** Re-align the roadmap to actual usage patterns. The suggestion to double down on the feature with proven revenue lift is the right call.`,
    prompts: ['Which features have proven revenue lift?', 'What does the usage data look like?', 'How do we re-align the roadmap?'],
  },
  'analysis-3': {
    response: `**3 enterprise accounts mentioned "portfolio view"** sits at 80% confidence with a strong +5% jump this week — a fast-rising signal worth watching closely.

**Confidence drivers:**

**1. Unprompted, cross-account pattern** — Three separate enterprise accounts raised "portfolio view" or "all projects" independently in discovery calls. Unprompted repetition across accounts is a high-quality signal.

**2. Heavy multi-board usage** — All three accounts are managing five or more active boards simultaneously, creating a genuine navigation problem the product doesn't currently solve.

**3. Support ticket trend** — Tickets referencing "overview" and "all projects" are up 22% this quarter, showing the need extends beyond just these three accounts.

**4. Confidence accelerating** — The +5% jump came after a fourth account raised the same need this week. The signal is broadening, not narrowing.

**Recommended action:** Prioritise discovery to scope a lightweight portfolio view. The signal is still forming but the trajectory is clear.`,
    prompts: ['Who are the accounts raising this?', 'What would a portfolio view look like?', 'Are there existing solutions we could build on?'],
  },
  'analysis-4': {
    response: `**AI sticky note clustering saves facilitators 40+ minutes per session** is at 94% confidence (+3%) with the highest ARR potential on the board at $4.1M. This is your most urgent theme.

**Confidence drivers:**

**1. Quantified time savings** — 47 beta tester surveys reported 40+ minute savings per session, with consistent results across team sizes and session types. Quantified impact is rare and valuable.

**2. Competitor shipped parity** — FigJam shipped a comparable clustering feature last sprint. Every week without parity is a week the competitive window closes.

**3. Top use case by volume** — Workshop facilitation is a top-3 session type by frequency. A feature that directly accelerates the most-used workflow has compounding impact.

**4. AI upgrade correlation** — Users who engaged with any AI feature showed 2.4× higher upgrade rates. This theme directly strengthens that pattern.

**Recommended action:** This is the highest-urgency theme on the board. Move to "Next" immediately and protect it from sprint de-prioritisation.`,
    prompts: ['How urgent is the competitor risk?', "What's the upgrade rate impact?", "What's the MVP scope for this?"],
  },
  'analysis-5': {
    response: `**Real-time cursor lag on boards with 50+ objects drives session abandonment** sits at 91% confidence (+2%) and is actively costing enterprise renewals.

**Confidence drivers:**

**1. Churn interview evidence** — 12 enterprise accounts explicitly cited canvas lag during churn interviews. When customers name a specific technical issue at the point of churn, the signal is unambiguous.

**2. Performance data confirms the threshold** — Engineering data shows a 40% frame rate drop above 50 objects. The threshold is clearly defined and reproducible.

**3. Support volume rising** — "Slow board" support tickets increased 18% this quarter, indicating the problem is spreading as customers build more complex boards.

**4. Renewals at risk** — Three enterprise accounts have put renewal conversations on hold pending performance improvements. This is a direct revenue blocker.

**Recommended action:** File and prioritise the bug report. This is a retention risk, not just a UX issue. Consider proactive outreach to the three at-risk accounts.`,
    prompts: ['Which accounts are at risk of churning?', "What's the engineering effort to fix this?", 'How do we communicate progress to at-risk accounts?'],
  },
  'analysis-6': {
    response: `**Template library depth is a top-3 purchase criteria for mid-market buyers** is at 76% confidence with the fastest-rising momentum this week at +8%.

**Confidence drivers:**

**1. Sales call transcripts** — Gong analysis shows 68% of mid-market deals include an explicit template comparison. This isn't an edge case — it's a routine part of the buying conversation.

**2. Named competitors** — Lucidspark and Conceptboard are referenced by name in 14 calls this quarter when discussing templates. Prospects are doing the comparison work themselves.

**3. Objection doubling** — Template count objections doubled since last quarter, suggesting competitors are actively using this gap in their positioning.

**4. Confidence jump** — The +8% rise this week came directly from the Gong analysis surfacing the pattern systematically for the first time. The underlying signal had been there longer.

**Recommended action:** Quantify the exact gap (340 vs 600+ templates) and build a roadmap plan to close it. This is a sales conversion problem as much as a product one.`,
    prompts: ['Which template categories are most requested?', 'How quickly can we close the gap with competitors?', 'Should we partner for template content?'],
  },
  'analysis-7': {
    response: `**Mobile editing experience cited in 18% of negative NPS responses** sits at 72% confidence and is the only weakening signal on the board at -2%.

**Confidence drivers:**

**1. NPS verbatim volume** — "Mobile" appears in 18% of detractor comments — a significant share, but the absolute NPS impact is moderate given overall response volume.

**2. Documented UX issues** — Session recordings on iOS 17 show specific touch target and zoom behaviour problems. The issues are real and reproducible.

**3. Signal weakening** — The -2% confidence drop reflects a key contextual shift: post-pandemic, desktop-first habits have persisted. Mobile editing demand is real, but less urgent than it appeared in 2021-22.

**4. Lower ARR impact** — At $0.9M, this is the lowest ARR-weighted theme on the board. Mobile editing remains a secondary use case for most enterprise buyers.

**Recommended action:** Don't archive, but don't prioritise ahead of higher-impact themes. A focused fix on the iOS touch target issues would address the sharpest complaints with minimal engineering cost.`,
    prompts: ['What are the specific iOS issues to fix?', 'Is mobile editing growing or shrinking as a use case?', 'How does this compare to competitor mobile experiences?'],
  },
  'analysis-8': {
    response: `**Async video comments reduce meeting load — users want it on every object** is at 88% confidence with strong momentum at +4% and $2.7M ARR impact.

**Confidence drivers:**

**1. Measurable meeting reduction** — Teams using Loom embeds self-report 30% fewer sync meetings. Measurable behavioural change, not just satisfaction, is the strongest possible signal type.

**2. Expansion demand pattern** — 28 feature requests explicitly ask to expand async video from sticky notes to shapes, connectors, and frames. The demand is specific and actionable.

**3. Market tailwind** — Async-first workflows are a top enterprise productivity trend for 2024-25. This theme has macro momentum behind it, not just product-level demand.

**4. Accelerating confidence** — The +4% rise reflects new signal volume from teams doubling down on async workflows after hybrid work norms solidified.

**Recommended action:** Move to "Next." The case for expanding native async video is strong — scoped to high-value object types first (frames, then connectors).`,
    prompts: ['Which object types should we expand to first?', "What's the competitive landscape for async video?", 'How do we measure success after shipping?'],
  },
  'analysis-9': {
    response: `**Smart shape suggestions during diagramming cut creation time by half** is at 86% confidence and strengthening fast (+6%) — a standout product opportunity.

**Confidence drivers:**

**1. Controlled beta results** — 2× faster diagram completion across 120 beta users is a compelling, reproducible result. Controlled studies are higher quality than survey data.

**2. Top use case alignment** — Flowchart and org chart are the top two diagram types by session volume. Improving the core workflow for the most-used diagrams has compounding impact.

**3. Abandonment reduction** — 34% of diagrams are abandoned before completion. Shape suggestions specifically address the point where users get stuck — reducing abandonment is a direct retention lever.

**4. Rising AI expectations** — The +6% confidence jump reflects broader market expectation shifts: users now expect AI assistance in creation workflows as a baseline, not a differentiator.

**Recommended action:** Move to "Next." This has high confidence, clear user impact, and strengthening market momentum. Prioritise the flowchart and org chart use cases for the first release.`,
    prompts: ['What does the beta data tell us about edge cases?', 'How do we avoid suggestions feeling intrusive?', 'Which diagram types should ship in v1?'],
  },
  'analysis-10': {
    response: `**Guest access limitations blocking external contractor collaboration** sits at 83% confidence (+3%) — a concrete enterprise blocker backed by strong qualitative evidence.

**Confidence drivers:**

**1. Account volume** — 23 enterprise accounts explicitly raised contractor access as a blocker to wider rollout. When 23 accounts name the same specific limitation, the signal is highly reliable.

**2. Support ticket trend** — Guest permission tickets are up 31% this quarter, showing the problem extends well beyond the accounts that raised it proactively in calls.

**3. Clear use case pattern** — The blocker is specific: agencies and freelancers need section-level edit access on client boards without full workspace access. The requirement is well-defined and scoped.

**4. Growing demand signal** — Feature request votes for "scoped guest access" tripled in the last 90 days, indicating the problem is becoming more widely felt as teams scale collaboration.

**Recommended action:** Edit the roadmap to include scoped guest access. The use case is well-defined enough for engineering to scope quickly — this is not an ambiguous discovery problem.`,
    prompts: ['What level of access control do enterprise accounts need?', 'How do competitors handle guest access?', "What's the security implication of section-level access?"],
  },
}
