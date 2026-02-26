/**
 * Nav Palette — generates a tonal color palette from a single base hex color.
 *
 * Used by the primary navigation (PrimaryRail, ExpandedPrimaryPanel, NavigationShell)
 * to create a customisable, accessible color scheme. Pass any hex color as the base
 * and the system derives all surface, text, icon, and indicator colors automatically.
 */

export interface NavPalette {
  /** The base color — used as the navigation background */
  base: string;
  /** Lighter tint — used for the logo container background */
  logoContainer: string;
  /** High-contrast color for active/hovered icons */
  iconActive: string;
  /** Medium-contrast color for inactive icons */
  iconDefault: string;
  /** Subtle overlay for hover/active indicator pills */
  indicator: string;
  /** Subtle line color for dividers */
  divider: string;
  /** High-contrast text (headings, active labels) */
  textPrimary: string;
  /** Medium-contrast text (secondary labels, muted copy) */
  textSecondary: string;
  /** Subtle hover background for list items */
  hoverBg: string;
  /** Color for the "+" button and section header icons */
  iconMuted: string;
}

// ---------------------------------------------------------------------------
// Hex <-> HSL conversion helpers
// ---------------------------------------------------------------------------

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return [r, g, b];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return [0, 0, l];

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;

  return [h * 360, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  const hNorm = ((h % 360) + 360) % 360;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hNorm / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0,
    g = 0,
    b = 0;

  if (hNorm < 60) {
    r = c; g = x; b = 0;
  } else if (hNorm < 120) {
    r = x; g = c; b = 0;
  } else if (hNorm < 180) {
    r = 0; g = c; b = x;
  } else if (hNorm < 240) {
    r = 0; g = x; b = c;
  } else if (hNorm < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hslString(h: number, s: number, l: number): string {
  return hslToHex(h, s, l);
}

function hsla(h: number, s: number, l: number, a: number): string {
  return `hsla(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%, ${a})`;
}

// ---------------------------------------------------------------------------
// Relative luminance (WCAG)
// ---------------------------------------------------------------------------

function relativeLuminance(r: number, g: number, b: number): number {
  const linearize = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/** Returns true when the base color is perceptually light (needs dark foreground) */
function isLightColor(r: number, g: number, b: number): boolean {
  return relativeLuminance(r, g, b) > 0.4;
}

// ---------------------------------------------------------------------------
// Palette generator
// ---------------------------------------------------------------------------

export function generateNavPalette(baseHex: string): NavPalette {
  const [r, g, b] = hexToRgb(baseHex);
  const [h, s, l] = rgbToHsl(r, g, b);
  const light = isLightColor(r, g, b);

  if (light) {
    // Light base → dark foreground elements
    // Icon contrast targets: iconDefault ≈ 4.5:1 against base
    // Hover background: gray-200 (var(--color-gray-200)) for list item hover states
    return {
      base: baseHex,
      logoContainer: "#F2CA02",
      iconActive: hslString(h, Math.min(s * 0.5, 0.4), 0.28),
      iconDefault: hslString(h, Math.min(s * 0.25, 0.2), 0.44),
      indicator: hsla(h, s * 0.3, 0.1, 0.1),
      divider: hsla(h, s * 0.2, 0.1, 0.12),
      textPrimary: hslString(h, Math.min(s * 0.5, 0.4), 0.22),
      textSecondary: hslString(h, Math.min(s * 0.25, 0.22), 0.42),
      hoverBg: "var(--color-gray-200)",
      iconMuted: hslString(h, Math.min(s * 0.2, 0.18), 0.48),
    };
  } else {
    // Dark base → light foreground elements
    return {
      base: baseHex,
      logoContainer: hslString(h, Math.max(s * 0.6, 0.15), Math.min(l + 0.15, 0.45)),
      iconActive: hslString(h, Math.min(s * 0.15, 0.12), 0.95),
      iconDefault: hslString(h, Math.min(s * 0.2, 0.15), 0.7),
      indicator: hsla(h, s * 0.2, 0.9, 0.12),
      divider: hsla(h, s * 0.15, 0.9, 0.15),
      textPrimary: hslString(h, Math.min(s * 0.15, 0.12), 0.95),
      textSecondary: hslString(h, Math.min(s * 0.15, 0.12), 0.72),
      hoverBg: hsla(h, s * 0.2, 0.9, 0.08),
      iconMuted: hslString(h, Math.min(s * 0.15, 0.12), 0.6),
    };
  }
}
