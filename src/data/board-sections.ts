/**
 * Board section definitions per space.
 *
 * Each space maps to an ordered array of sections. Each section has a label
 * and an ordered list of canvas IDs that belong to it. Section labels are
 * tailored to the type of work the space represents (product development,
 * planning, event management, etc.) and follow a typical process progression.
 */

export type BoardSection = {
  label: string;
  canvasIds: string[];
};

export const BOARD_SECTIONS: Record<string, BoardSection[]> = {
  /* ── Product spaces (Discover → Define → Deliver) ─────────────── */

  "space-paygrid": [
    {
      label: "Discovery",
      canvasIds: ["canvas-paygrid-01", "canvas-paygrid-05"],
    },
    {
      label: "Definition",
      canvasIds: ["canvas-paygrid-02", "canvas-paygrid-03", "canvas-paygrid-04"],
    },
    {
      label: "Delivery",
      canvasIds: ["canvas-paygrid-06", "canvas-paygrid-07"],
    },
  ],

  "space-firstflex": [
    {
      label: "Discovery",
      canvasIds: ["canvas-firstflex-01", "canvas-firstflex-05"],
    },
    {
      label: "Definition",
      canvasIds: ["canvas-firstflex-02", "canvas-firstflex-03", "canvas-firstflex-04"],
    },
    {
      label: "Delivery",
      canvasIds: ["canvas-firstflex-06", "canvas-firstflex-07"],
    },
  ],

  "space-embed": [
    {
      label: "Design",
      canvasIds: ["canvas-embed-01", "canvas-embed-02"],
    },
    {
      label: "Partner",
      canvasIds: ["canvas-embed-03", "canvas-embed-05"],
    },
    {
      label: "Measure",
      canvasIds: ["canvas-embed-04"],
    },
  ],

  /* ── Process / optimisation spaces ────────────────────────────── */

  "space-kyc": [
    {
      label: "Assess",
      canvasIds: ["canvas-kyc-01", "canvas-kyc-02"],
    },
    {
      label: "Design",
      canvasIds: ["canvas-kyc-03", "canvas-kyc-04", "canvas-kyc-05"],
    },
    {
      label: "Deliver",
      canvasIds: ["canvas-kyc-06", "canvas-kyc-07", "canvas-kyc-08"],
    },
  ],

  "space-claims": [
    {
      label: "Research",
      canvasIds: ["canvas-claims-01", "canvas-claims-02"],
    },
    {
      label: "Build",
      canvasIds: ["canvas-claims-03", "canvas-claims-05"],
    },
    {
      label: "Govern",
      canvasIds: ["canvas-claims-04", "canvas-claims-06"],
    },
  ],

  "space-core": [
    {
      label: "Plan",
      canvasIds: ["canvas-core-01", "canvas-core-02"],
    },
    {
      label: "Build",
      canvasIds: ["canvas-core-03", "canvas-core-04"],
    },
    {
      label: "Launch",
      canvasIds: ["canvas-core-05", "canvas-core-06"],
    },
  ],

  /* ── GTM / launch spaces ──────────────────────────────────────── */

  "space-launch-q3": [
    {
      label: "Research",
      canvasIds: ["canvas-launch-q3-01"],
    },
    {
      label: "Strategy",
      canvasIds: ["canvas-launch-q3-02", "canvas-launch-q3-04"],
    },
    {
      label: "Execution",
      canvasIds: ["canvas-launch-q3-03", "canvas-launch-q3-05"],
    },
  ],

  /* ── Design spaces ────────────────────────────────────────────── */

  "space-brand": [
    {
      label: "Explore",
      canvasIds: ["canvas-brand-01", "canvas-brand-02"],
    },
    {
      label: "Define",
      canvasIds: ["canvas-brand-03", "canvas-brand-04"],
    },
    {
      label: "Deliver",
      canvasIds: ["canvas-brand-05"],
    },
  ],

  /* ── Planning / strategy spaces ───────────────────────────────── */

  "space-roadmaps": [
    {
      label: "Planning",
      canvasIds: ["canvas-roadmaps-01", "canvas-roadmaps-02"],
    },
    {
      label: "Prioritisation",
      canvasIds: ["canvas-roadmaps-03", "canvas-roadmaps-05"],
    },
    {
      label: "Review",
      canvasIds: ["canvas-roadmaps-04"],
    },
  ],

  "space-org27": [
    {
      label: "Vision",
      canvasIds: ["canvas-org27-01", "canvas-org27-03"],
    },
    {
      label: "Structure",
      canvasIds: ["canvas-org27-02"],
    },
    {
      label: "Resources",
      canvasIds: ["canvas-org27-04", "canvas-org27-05"],
    },
  ],

  /* ── Leadership / governance spaces ───────────────────────────── */

  "space-epd": [
    {
      label: "People",
      canvasIds: ["canvas-epd-01"],
    },
    {
      label: "Strategy",
      canvasIds: ["canvas-epd-02", "canvas-epd-03"],
    },
    {
      label: "Governance",
      canvasIds: ["canvas-epd-04", "canvas-epd-05"],
    },
  ],

  /* ── Revenue / operations spaces ──────────────────────────────── */

  "space-revenueops": [
    {
      label: "Pipeline",
      canvasIds: ["canvas-revenueops-01", "canvas-revenueops-04"],
    },
    {
      label: "Analysis",
      canvasIds: ["canvas-revenueops-02", "canvas-revenueops-03"],
    },
    {
      label: "Review",
      canvasIds: ["canvas-revenueops-05"],
    },
  ],

  /* ── Event spaces ─────────────────────────────────────────────── */

  "space-ff26": [
    {
      label: "Content",
      canvasIds: ["canvas-ff26-01", "canvas-ff26-02"],
    },
    {
      label: "Logistics",
      canvasIds: ["canvas-ff26-03", "canvas-ff26-05"],
    },
    {
      label: "Operations",
      canvasIds: ["canvas-ff26-04", "canvas-ff26-06", "canvas-ff26-07"],
    },
  ],
};
