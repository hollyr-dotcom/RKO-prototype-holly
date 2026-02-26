#!/usr/bin/env node

/**
 * generate-color-scale.mjs
 *
 * Generates 12-step color scales from seed hex colors using OKLCH color math.
 * Lightness follows the Tailwind distribution curve; hue and chroma are
 * derived from the seed. Change the seed to shift the tonal quality
 * (e.g. cool gray → warm gray) while keeping brightness consistent.
 *
 * Usage:
 *   node scripts/generate-color-scale.mjs            # writes to globals.css
 *   node scripts/generate-color-scale.mjs --preview   # prints to stdout only
 */

import { parse, converter, formatHex, wcagContrast } from 'culori';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const toOklch = converter('oklch');

// ── Step names ──

const TAILWIND_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950, 1000];

const RADIX_ROLES = [
  'App background',
  'Subtle background',
  'Component background',
  'Component hover',
  'Component active / muted text',
  'Subtle border',
  'Default border / secondary text',
  'Strong border',
  'Solid color',
  'Primary text',
  'High-contrast text',
  'Ultra-high-contrast text',
];

// ── Scale configurations ──
//
// Each scale defines:
//   seed       — base hex color (provides hue + chroma reference)
//   lightness  — OKLCH L values for each of the 12 steps
//   chroma     — multipliers relative to seed chroma (neutral scales use absolute values)
//   type       — 'neutral' or 'chromatic'

const SCALES = {
  gray: {
    seed: '#62615B',
    type: 'neutral',
    tailwindName: 'gray',
    // Lightness curve matching Tailwind gray distribution
    // Steps 50–900 match existing Tailwind defaults; 950 + 1000 extrapolated
    lightness: [
      0.985, // 50
      0.966, // 100
      0.928, // 200
      0.872, // 300
      0.714, // 400
      0.551, // 500
      0.446, // 600
      0.373, // 700
      0.278, // 800
      0.210, // 900
      0.155, // 950  (new)
      0.110, // 1000 (new)
    ],
    // Chroma increases gently with darkness — matches the natural
    // pattern in Tailwind's gray where darker steps are slightly more chromatic
    chromaCurve: [
      0.40, // 50
      0.35, // 100
      0.30, // 200
      0.35, // 300
      0.73, // 400
      0.89, // 500
      1.00, // 600  (seed chroma)
      1.16, // 700
      1.13, // 800
      1.21, // 900
      1.25, // 950
      1.30, // 1000
    ],
  },
  blue: {
    seed: '#3B82F6',
    type: 'chromatic',
    tailwindName: 'blue',
    // Blue lightness: seed anchored at step 500 (L=0.623),
    // lighter steps above, darker below
    lightness: [
      0.970, // 50
      0.940, // 100
      0.890, // 200
      0.830, // 300
      0.760, // 400
      null,  // 500  — anchored to seed L
      0.530, // 600
      0.450, // 700
      0.370, // 800
      0.290, // 900
      0.220, // 950
      0.160, // 1000
    ],
    // Chroma: builds up to seed at step 500, reduces for text steps
    chromaCurve: [
      0.08, // 50
      0.14, // 100
      0.25, // 200
      0.40, // 300
      0.70, // 400
      1.00, // 500  (seed chroma)
      0.90, // 600
      0.80, // 700
      0.65, // 800
      0.50, // 900
      0.40, // 950
      0.30, // 1000
    ],
  },
};

// ── Core generation ──

function generateScale(config) {
  const seedOklch = toOklch(parse(config.seed));
  const { l: seedL, c: seedC, h: seedH } = seedOklch;

  return config.lightness.map((targetL, i) => {
    const l = targetL === null ? seedL : targetL;
    const c = seedC * config.chromaCurve[i];
    return formatHex({ mode: 'oklch', l, c, h: seedH });
  });
}

// ── Contrast checking ──

function checkContrast(scale, name) {
  const results = [];

  // Text steps against light backgrounds
  const textSteps = [8, 9, 10, 11]; // 800, 900, 950, 1000
  const bgSteps = [0, 1];           // 50, 100

  for (const ti of textSteps) {
    for (const bi of bgSteps) {
      const ratio = wcagContrast(parse(scale[ti]), parse(scale[bi]));
      const label = `${name}-${TAILWIND_STEPS[ti]} on ${name}-${TAILWIND_STEPS[bi]}`;
      const aa = ratio >= 4.5;
      const aaa = ratio >= 7;
      results.push({
        label,
        ratio,
        grade: aaa ? 'AAA' : aa ? 'AA' : 'FAIL',
      });
    }
  }

  // Step 500 (accent / button color) on white
  const accentOnWhite = wcagContrast(parse(scale[5]), parse('#FFFFFF'));
  results.push({
    label: `${name}-${TAILWIND_STEPS[5]} on white`,
    ratio: accentOnWhite,
    grade: accentOnWhite >= 4.5 ? 'AAA' : accentOnWhite >= 3 ? 'AA-large' : 'FAIL',
  });

  return results;
}

// ── Current values for comparison ──

const CURRENT_VALUES = {
  gray: {
    50: '#F9FAFB', 100: '#F3F4F6', 200: '#E5E7EB',
    400: '#9CA3AF', 600: '#4B5563', 900: '#111827',
  },
  blue: {
    50: '#EFF6FF', 500: '#3B82F6', 900: '#1E3A5F',
  },
};

function compareDelta(generated, current, name) {
  const lines = [];
  for (const [step, currentHex] of Object.entries(current)) {
    const stepIndex = TAILWIND_STEPS.indexOf(Number(step));
    if (stepIndex === -1) continue;
    const generatedHex = generated[stepIndex];
    const c = toOklch(parse(currentHex));
    const g = toOklch(parse(generatedHex));
    const dL = Math.abs(c.l - g.l);
    const dC = Math.abs(c.c - g.c);
    const tag = dL < 0.01 ? 'match' : dL < 0.03 ? 'close' : dL < 0.06 ? 'review' : 'DRIFT';
    lines.push(
      `  ${name}-${step.padStart(4)}: ${currentHex} -> ${generatedHex.toUpperCase()}  ` +
      `(dL:${dL.toFixed(3)} dC:${dC.toFixed(4)}) [${tag}]`
    );
  }
  return lines;
}

// ── CSS formatting ──

function formatCssBlock(name, scale) {
  const lines = [`  /* ── Colors — ${name} ramp (generated from ${SCALES[name === 'gray' ? 'gray' : 'blue'].seed}) ── */`];
  scale.forEach((hex, i) => {
    lines.push(`  --color-${name}-${TAILWIND_STEPS[i]}: ${hex.toUpperCase()};`);
  });
  return lines.join('\n');
}

// ── File patching ──

function patchGlobalsCss(cssBlocks) {
  const globalsPath = path.join(__dirname, '..', 'src', 'app', 'globals.css');
  let content = fs.readFileSync(globalsPath, 'utf-8');

  const startIdx = content.indexOf('  /* ── Colors');
  if (startIdx === -1) {
    console.error('Could not find color section marker in globals.css');
    process.exit(1);
  }

  const endMatch = content.match(/--color-yellow-500:[^;]+;/);
  if (!endMatch) {
    console.error('Could not find yellow-500 token in globals.css');
    process.exit(1);
  }
  const endIdx = endMatch.index + endMatch[0].length;

  const replacement = [
    cssBlocks.gray,
    '',
    cssBlocks.blue,
    '',
    '  /* ── Colors — Semantic ── */',
    '  --color-red-500: #EF4444;',
    '  --color-green-500: #22C55E;',
    '  --color-yellow-500: #EAB308;',
  ].join('\n');

  content = content.slice(0, startIdx) + replacement + content.slice(endIdx);
  fs.writeFileSync(globalsPath, content, 'utf-8');
  console.log(`\nWrote updated colors to ${globalsPath}`);
}

// ── Main ──

function main() {
  const preview = process.argv.includes('--preview');

  console.log('Generating color scales (OKLCH, Tailwind distribution)...\n');

  const cssBlocks = {};

  for (const [key, config] of Object.entries(SCALES)) {
    const scale = generateScale(config);

    console.log(`${config.tailwindName} (seed: ${config.seed}, type: ${config.type}):`);
    scale.forEach((hex, i) => {
      console.log(
        `  ${TAILWIND_STEPS[i].toString().padStart(4)}: ${hex.toUpperCase()}  // ${RADIX_ROLES[i]}`
      );
    });

    // Contrast checks
    const checks = checkContrast(scale, config.tailwindName);
    console.log('\n  Contrast:');
    for (const { label, ratio, grade } of checks) {
      const icon = grade === 'FAIL' ? 'x' : 'v';
      console.log(`  [${icon}] ${grade.padEnd(8)} ${ratio.toFixed(2)}:1  ${label}`);
    }

    // Delta comparison
    if (CURRENT_VALUES[key]) {
      console.log('\n  Delta vs current:');
      compareDelta(scale, CURRENT_VALUES[key], config.tailwindName).forEach((l) =>
        console.log(l)
      );
    }

    console.log('');
    cssBlocks[key] = formatCssBlock(config.tailwindName, scale);
  }

  // Print CSS
  console.log('--- Generated CSS ---\n');
  for (const block of Object.values(cssBlocks)) {
    console.log(block);
    console.log('');
  }

  if (!preview) {
    patchGlobalsCss(cssBlocks);
  } else {
    console.log('(preview mode — no files modified)');
  }
}

main();
