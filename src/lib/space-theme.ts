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
  "space-firstflex": 184,
  "space-ff26": 260,
  "space-1on1-james": 263,
  "space-1on1-amara": 202,
  "space-1on1-daniel": 212,
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
  };
}
