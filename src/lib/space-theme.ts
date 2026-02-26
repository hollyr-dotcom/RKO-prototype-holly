/**
 * Space colour theming system.
 *
 * Generates a 12-step OKLCH color scale from a single hue value so every
 * space gets a perceptually uniform palette via CSS custom properties.
 *
 * Lighter tones shift 10° cooler to stay perceptually "the same colour"
 * (the Abney effect).
 *
 * ## Scale → alias mapping
 *
 * | Alias            | Step | Role                          |
 * |------------------|------|-------------------------------|
 * | `--space-bg`     | 50   | Light surface background      |
 * | `--space-100` | 200 | Widget panel background      |
 * | `--space-secondary` | 500 | Mid accent (stats, callouts) |
 * | `--space-accent` | 950  | Dark accent (buttons, headings) |
 *
 * ## Graph colour rule
 *
 * Two-colour graphs use **light** (`--space-bg`) and **dark** (`--space-accent`) only.
 * The primary chart component (filled slice, active ring, trend line) and its value
 * label (e.g. "$4.2M", "62%") always use `--space-accent`.
 * The **mid** colour (`--space-secondary`) is reserved for callouts within graphs
 * (highlighted stats, annotations, labels that need to stand out).
 */

import { generateScaleFromHue, SCALE_STEPS, REFERENCE_CHROMA } from "./oklch";

export interface SpaceTheme {
  /** Full 12-step OKLCH scale from lightest (50) to darkest (1000). */
  scale: string[];
  /** Light surface background — scale step 50 */
  bg: string;
  /** Dark accent (buttons, headings) — scale step 950 */
  accent: string;
  /** Mid accent (stats, tag tints) — scale step 500 */
  secondary: string;
  /** Widget panel background — scale step 200 */
  widgetBg: string;
  /** Base hue for the space */
  hue: number;
  /** Cooled hue (hue - 10) for hsla() gradients needing alpha transparency */
  tintHue: number;
}

/** Derive a stable hue (0–359) from a string by summing char codes. */
function hueFromId(id: string): number {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return sum % 360;
}

/** Hue overrides for spaces with branded colours. */
const SPACE_HUES: Record<string, number> = {
  // Portfolio
  "space-paygrid": 145,       // green
  "space-firstflex": 184,     // teal
  "space-core": 215,          // blue
  "space-embed": 28,          // orange
  // Programs
  "space-launch-q3": 355,     // red
  "space-brand": 325,         // pink
  "space-kyc": 48,            // amber
  "space-claims": 165,        // teal-green
  // Events
  "space-ff26": 260,          // purple (DO NOT CHANGE)
  // Operations
  "space-roadmaps": 85,       // chartreuse
  "space-epd": 240,           // indigo
  "space-revenueops": 12,     // warm red-orange
  "space-org27": 290,         // violet
  // 1:1s
  "space-1on1-james": 350,    // rose
  "space-1on1-amara": 42,     // gold
  "space-1on1-daniel": 130,   // green
};

/** Get the hue for a space (branded override or derived from id). */
export function getSpaceHue(spaceId: string): number {
  return SPACE_HUES[spaceId] ?? hueFromId(spaceId);
}

// Scale step indices for the alias mapping
const BG_INDEX = 0;        // step 50
const WIDGET_BG_INDEX = 1; // step 100
const SECONDARY_INDEX = 5; // step 500
const ACCENT_INDEX = 10;   // step 950

/** Build a full theme object from a hue value and optional chroma. */
export function generateSpaceTheme(hue: number, chroma?: number): SpaceTheme {
  const scale = generateScaleFromHue(hue, chroma);
  return {
    scale,
    bg: scale[BG_INDEX],
    widgetBg: scale[WIDGET_BG_INDEX],
    secondary: scale[SECONDARY_INDEX],
    accent: scale[ACCENT_INDEX],
    hue,
    tintHue: (hue - 10 + 360) % 360,
  };
}

/**
 * Parse a space's stored `color` field into hue + chroma.
 * Handles JSON format `{"hue":260,"chroma":0.18}` or falls back to
 * the branded hue override / ID-derived hue with default chroma.
 */
export function parseSpaceColor(
  color: string | undefined,
  spaceId: string
): { hue: number; chroma: number } {
  if (color) {
    try {
      const parsed = JSON.parse(color);
      if (typeof parsed.hue === "number") {
        return {
          hue: parsed.hue,
          chroma: typeof parsed.chroma === "number" ? parsed.chroma : REFERENCE_CHROMA,
        };
      }
    } catch {
      // Not JSON — fall through to default
    }
  }
  return { hue: getSpaceHue(spaceId), chroma: REFERENCE_CHROMA };
}

/**
 * Get a display-ready hex color from a space's stored `color` field.
 * Returns the step-500 (secondary) color — a vivid mid-tone suitable for
 * small UI elements like space icons in the nav sidebar.
 * Falls back to the branded hue or ID-derived hue when color is absent or legacy hex.
 */
export function getSpaceDisplayColor(color: string | undefined, spaceId: string): string {
  const { hue, chroma } = parseSpaceColor(color, spaceId);
  return generateScaleFromHue(hue, chroma)[SECONDARY_INDEX];
}

/** Convert a SpaceTheme to a Record suitable for a React style prop. */
export function spaceThemeToCssVars(theme: SpaceTheme): Record<string, string> {
  const vars: Record<string, string> = {};

  // Emit all 12 numbered steps
  theme.scale.forEach((hex, i) => {
    vars[`--space-${SCALE_STEPS[i]}`] = hex;
  });

  // Backwards-compatible aliases
  vars["--space-bg"] = theme.bg;
  vars["--space-accent"] = theme.accent;
  vars["--space-secondary"] = theme.secondary;

  return vars;
}
