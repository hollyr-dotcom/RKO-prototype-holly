-- Migration: Board Sections
-- Adds collapsible section groupings to space sidebars.
-- Each space can define ordered sections (e.g. Discovery → Definition → Delivery)
-- and canvases are assigned to a section via section_id.

-- ============================================================
-- 1. Create board_sections table
-- ============================================================

create table if not exists board_sections (
  id          text        primary key,
  space_id    text        not null references spaces(id) on delete cascade,
  label       text        not null,
  "order"     integer     not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_board_sections_space_id
  on board_sections(space_id);

-- ============================================================
-- 2. Add section_id to canvases
-- ============================================================

alter table canvases
  add column if not exists section_id text references board_sections(id) on delete set null;

create index if not exists idx_canvases_section_id
  on canvases(section_id);

-- ============================================================
-- 3. Seed board sections
-- ============================================================

insert into board_sections (id, space_id, label, "order") values

  -- PayGrid (Discovery → Definition → Delivery)
  ('section-paygrid-discovery',   'space-paygrid',   'Discovery',      0),
  ('section-paygrid-definition',  'space-paygrid',   'Definition',     1),
  ('section-paygrid-delivery',    'space-paygrid',   'Delivery',       2),

  -- FirstFlex Youth Banking (Discovery → Definition → Delivery)
  ('section-firstflex-discovery',  'space-firstflex', 'Discovery',     0),
  ('section-firstflex-definition', 'space-firstflex', 'Definition',    1),
  ('section-firstflex-delivery',   'space-firstflex', 'Delivery',      2),

  -- Embedded Finance (Design → Partner → Measure)
  ('section-embed-design',   'space-embed', 'Design',    0),
  ('section-embed-partner',  'space-embed', 'Partner',   1),
  ('section-embed-measure',  'space-embed', 'Measure',   2),

  -- EU KYC Optimisation (Assess → Design → Deliver)
  ('section-kyc-assess',  'space-kyc', 'Assess',  0),
  ('section-kyc-design',  'space-kyc', 'Design',  1),
  ('section-kyc-deliver', 'space-kyc', 'Deliver', 2),

  -- AI Claims (Research → Build → Govern)
  ('section-claims-research', 'space-claims', 'Research', 0),
  ('section-claims-build',    'space-claims', 'Build',    1),
  ('section-claims-govern',   'space-claims', 'Govern',   2),

  -- Core Banking Migration (Plan → Build → Launch)
  ('section-core-plan',   'space-core', 'Plan',   0),
  ('section-core-build',  'space-core', 'Build',  1),
  ('section-core-launch', 'space-core', 'Launch', 2),

  -- Product Launch Q3 (Research → Strategy → Execution)
  ('section-launch-q3-research',  'space-launch-q3', 'Research',  0),
  ('section-launch-q3-strategy',  'space-launch-q3', 'Strategy',  1),
  ('section-launch-q3-execution', 'space-launch-q3', 'Execution', 2),

  -- Brand Refresh (Explore → Define → Deliver)
  ('section-brand-explore', 'space-brand', 'Explore', 0),
  ('section-brand-define',  'space-brand', 'Define',  1),
  ('section-brand-deliver', 'space-brand', 'Deliver', 2),

  -- Roadmaps (Planning → Prioritisation → Review)
  ('section-roadmaps-planning',       'space-roadmaps', 'Planning',       0),
  ('section-roadmaps-prioritisation', 'space-roadmaps', 'Prioritisation', 1),
  ('section-roadmaps-review',         'space-roadmaps', 'Review',         2),

  -- Org Plan 2027 (Vision → Structure → Resources)
  ('section-org27-vision',    'space-org27', 'Vision',    0),
  ('section-org27-structure', 'space-org27', 'Structure', 1),
  ('section-org27-resources', 'space-org27', 'Resources', 2),

  -- EPD Leadership (People → Strategy → Governance)
  ('section-epd-people',     'space-epd', 'People',     0),
  ('section-epd-strategy',   'space-epd', 'Strategy',   1),
  ('section-epd-governance', 'space-epd', 'Governance', 2),

  -- Revenue Operations (Pipeline → Analysis → Review)
  ('section-revenueops-pipeline', 'space-revenueops', 'Pipeline', 0),
  ('section-revenueops-analysis', 'space-revenueops', 'Analysis', 1),
  ('section-revenueops-review',   'space-revenueops', 'Review',   2),

  -- FlexForward 26 (Content → Logistics → Operations)
  ('section-ff26-content',    'space-ff26', 'Content',    0),
  ('section-ff26-logistics',  'space-ff26', 'Logistics',  1),
  ('section-ff26-operations', 'space-ff26', 'Operations', 2)

on conflict (id) do update set
  label      = excluded.label,
  "order"    = excluded."order",
  updated_at = now();

-- ============================================================
-- 4. Assign canvases to their sections
-- ============================================================

-- PayGrid
update canvases set section_id = 'section-paygrid-discovery'  where id in ('canvas-paygrid-01', 'canvas-paygrid-05');
update canvases set section_id = 'section-paygrid-definition' where id in ('canvas-paygrid-02', 'canvas-paygrid-03', 'canvas-paygrid-04');
update canvases set section_id = 'section-paygrid-delivery'   where id in ('canvas-paygrid-06', 'canvas-paygrid-07');

-- FirstFlex Youth Banking
update canvases set section_id = 'section-firstflex-discovery'  where id in ('canvas-firstflex-01', 'canvas-firstflex-05');
update canvases set section_id = 'section-firstflex-definition' where id in ('canvas-firstflex-02', 'canvas-firstflex-03', 'canvas-firstflex-04');
update canvases set section_id = 'section-firstflex-delivery'   where id in ('canvas-firstflex-06', 'canvas-firstflex-07');

-- Embedded Finance
update canvases set section_id = 'section-embed-design'  where id in ('canvas-embed-01', 'canvas-embed-02');
update canvases set section_id = 'section-embed-partner' where id in ('canvas-embed-03', 'canvas-embed-05');
update canvases set section_id = 'section-embed-measure' where id in ('canvas-embed-04');

-- EU KYC Optimisation
update canvases set section_id = 'section-kyc-assess'  where id in ('canvas-kyc-01', 'canvas-kyc-02');
update canvases set section_id = 'section-kyc-design'  where id in ('canvas-kyc-03', 'canvas-kyc-04', 'canvas-kyc-05');
update canvases set section_id = 'section-kyc-deliver' where id in ('canvas-kyc-06', 'canvas-kyc-07', 'canvas-kyc-08');

-- AI Claims
update canvases set section_id = 'section-claims-research' where id in ('canvas-claims-01', 'canvas-claims-02');
update canvases set section_id = 'section-claims-build'    where id in ('canvas-claims-03', 'canvas-claims-05');
update canvases set section_id = 'section-claims-govern'   where id in ('canvas-claims-04', 'canvas-claims-06');

-- Core Banking Migration
update canvases set section_id = 'section-core-plan'   where id in ('canvas-core-01', 'canvas-core-02');
update canvases set section_id = 'section-core-build'  where id in ('canvas-core-03', 'canvas-core-04');
update canvases set section_id = 'section-core-launch' where id in ('canvas-core-05', 'canvas-core-06');

-- Product Launch Q3
update canvases set section_id = 'section-launch-q3-research'  where id in ('canvas-launch-q3-01');
update canvases set section_id = 'section-launch-q3-strategy'  where id in ('canvas-launch-q3-02', 'canvas-launch-q3-04');
update canvases set section_id = 'section-launch-q3-execution' where id in ('canvas-launch-q3-03', 'canvas-launch-q3-05');

-- Brand Refresh
update canvases set section_id = 'section-brand-explore' where id in ('canvas-brand-01', 'canvas-brand-02');
update canvases set section_id = 'section-brand-define'  where id in ('canvas-brand-03', 'canvas-brand-04');
update canvases set section_id = 'section-brand-deliver' where id in ('canvas-brand-05');

-- Roadmaps
update canvases set section_id = 'section-roadmaps-planning'       where id in ('canvas-roadmaps-01', 'canvas-roadmaps-02');
update canvases set section_id = 'section-roadmaps-prioritisation' where id in ('canvas-roadmaps-03', 'canvas-roadmaps-05');
update canvases set section_id = 'section-roadmaps-review'         where id in ('canvas-roadmaps-04');

-- Org Plan 2027
update canvases set section_id = 'section-org27-vision'    where id in ('canvas-org27-01', 'canvas-org27-03');
update canvases set section_id = 'section-org27-structure' where id in ('canvas-org27-02');
update canvases set section_id = 'section-org27-resources' where id in ('canvas-org27-04', 'canvas-org27-05');

-- EPD Leadership
update canvases set section_id = 'section-epd-people'     where id in ('canvas-epd-01');
update canvases set section_id = 'section-epd-strategy'   where id in ('canvas-epd-02', 'canvas-epd-03');
update canvases set section_id = 'section-epd-governance' where id in ('canvas-epd-04', 'canvas-epd-05');

-- Revenue Operations
update canvases set section_id = 'section-revenueops-pipeline' where id in ('canvas-revenueops-01', 'canvas-revenueops-04');
update canvases set section_id = 'section-revenueops-analysis' where id in ('canvas-revenueops-02', 'canvas-revenueops-03');
update canvases set section_id = 'section-revenueops-review'   where id in ('canvas-revenueops-05');

-- FlexForward 26
update canvases set section_id = 'section-ff26-content'    where id in ('canvas-ff26-01', 'canvas-ff26-02');
update canvases set section_id = 'section-ff26-logistics'  where id in ('canvas-ff26-03', 'canvas-ff26-05');
update canvases set section_id = 'section-ff26-operations' where id in ('canvas-ff26-04', 'canvas-ff26-06', 'canvas-ff26-07');
