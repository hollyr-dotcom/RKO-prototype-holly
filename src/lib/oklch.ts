/**
 * Minimal OKLCH → hex conversion and scale generation.
 *
 * Provides runtime OKLCH color math without external dependencies.
 * Used by space-theme.ts to generate 12-step color scales from a hue.
 */

// ── OKLCH → Oklab → linear sRGB → sRGB → hex ──

/** Convert OKLCH (L, C, H in degrees) to Oklab (L, a, b). */
function oklchToOklab(L: number, C: number, H: number) {
  const hRad = (H * Math.PI) / 180;
  return { L, a: C * Math.cos(hRad), b: C * Math.sin(hRad) };
}

/** Convert Oklab to linear sRGB. */
function oklabToLinearRgb(L: number, a: number, b: number) {
  // Oklab → LMS (cube-root space)
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

  // Cube to undo the perceptual compression
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  // LMS → linear sRGB
  return {
    r: +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  };
}

/** Linear sRGB → sRGB (apply gamma). */
function linearToSrgb(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

/** Clamp a value to [0, 1]. */
function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/** Convert OKLCH values to a hex color string. */
export function oklchToHex(L: number, C: number, H: number): string {
  const { L: okL, a, b } = oklchToOklab(L, C, H);
  const rgb = oklabToLinearRgb(okL, a, b);
  const r = Math.round(clamp01(linearToSrgb(rgb.r)) * 255);
  const g = Math.round(clamp01(linearToSrgb(rgb.g)) * 255);
  const bVal = Math.round(clamp01(linearToSrgb(rgb.b)) * 255);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${bVal.toString(16).padStart(2, "0")}`;
}

// ── Scale generation ──

/** Step names matching the Tailwind convention. */
export const SCALE_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950, 1000] as const;

/** Lightness targets for chromatic scales. */
const CHROMATIC_LIGHTNESS = [
  0.970, // 50
  0.940, // 100
  0.890, // 200
  0.830, // 300
  0.760, // 400
  0.623, // 500  — "solid" brand color
  0.530, // 600
  0.450, // 700
  0.370, // 800
  0.290, // 900
  0.220, // 950
  0.160, // 1000
];

/** Chroma multipliers relative to reference chroma (peaks at step 500). */
const CHROMATIC_CHROMA_CURVE = [
  0.08, // 50
  0.14, // 100
  0.25, // 200
  0.40, // 300
  0.70, // 400
  1.00, // 500
  0.90, // 600
  0.80, // 700
  0.65, // 800
  0.50, // 900
  0.40, // 950
  0.30, // 1000
];

/** Default reference chroma for space colors. */
export const REFERENCE_CHROMA = 0.15;

/**
 * Generate a 12-step color scale from a hue value (0–359).
 * Returns an array of 12 hex colors from lightest (50) to darkest (1000).
 * Optional `chroma` overrides the reference chroma (default 0.15).
 */
export function generateScaleFromHue(hue: number, chroma = REFERENCE_CHROMA): string[] {
  return CHROMATIC_LIGHTNESS.map((L, i) => {
    const C = chroma * CHROMATIC_CHROMA_CURVE[i];
    return oklchToHex(L, C, hue);
  });
}
