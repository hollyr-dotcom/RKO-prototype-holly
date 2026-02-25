/**
 * Space colour theming system.
 *
 * Derives 3 named colour tokens (dark / mid / light) from a single hue
 * value so every space gets a coherent palette via CSS custom properties.
 *
 * Lighter tones shift 10° cooler to stay perceptually "the same colour"
 * (the Abney effect). For FF26 (H 260) this produces:
 *   dark  ≈ #371778  (target #361777)
 *   mid   ≈ #9381EF  (target #8F7FEE)
 *   light ≈ #F0EDFD  (target #EFEDFD)
 *   widget ≈ #E1DBFF  (target #DEDAFF)
 *
 * ## Graph colour rule
 *
 * Two-colour graphs use **light** (`--space-bg`) and **dark** (`--space-accent`) only.
 * The primary chart component (filled slice, active ring, trend line) and its value
 * label (e.g. "$4.2M", "62%") always use `--space-accent`.
 * The **mid** colour (`--space-secondary`) is reserved for callouts within graphs
 * (highlighted stats, annotations, labels that need to stand out).
 */

export interface SpaceTheme {
  /** Light surface background — hsl(H-10, 80%, 96%) */
  bg: string;
  /** Dark accent (buttons, headings) — hsl(H, 68%, 28%) */
  accent: string;
  /** Mid accent (stats, tag tints) — hsl(H-10, 77%, 72%) */
  secondary: string;
  /** Widget panel background — hsl(H-10, 100%, 93%) */
  widgetBg: string;
  /** Base hue for the space */
  hue: number;
  /** Cooled hue used by bg & secondary (hue - 10) */
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

/** Build a full theme object from a hue value. */
export function generateSpaceTheme(hue: number): SpaceTheme {
  const tintHue = (hue - 10 + 360) % 360;
  return {
    bg: `hsl(${tintHue}, 80%, 96%)`,
    accent: `hsl(${hue}, 68%, 28%)`,
    secondary: `hsl(${tintHue}, 77%, 72%)`,
    widgetBg: `hsl(${tintHue}, 100%, 93%)`,
    hue,
    tintHue,
  };
}

/** Convert a SpaceTheme to a Record suitable for a React style prop. */
export function spaceThemeToCssVars(theme: SpaceTheme): Record<string, string> {
  return {
    "--space-bg": theme.bg,
    "--space-accent": theme.accent,
    "--space-secondary": theme.secondary,
    "--space-widget-bg": theme.widgetBg,
  };
}
