#!/usr/bin/env node

import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const visualizations = {
  'venue-capacity-conflict': {
    prompt: `A clean, minimal 2D data visualization showing capacity overflow.
Two horizontal bars: a shorter blue bar (#3b82f6 to #60a5fa gradient) representing capacity,
and a longer orange/amber bar (#f59e0b to #f97316 gradient) representing demand that extends beyond.
Simple geometric rectangles with rounded corners, clearly showing the mismatch.
Flat, structured infographic style - not artistic, not flowing shapes. Think data dashboard
or presentation chart. The visual should clearly communicate "demand exceeds capacity" at a glance.
Very clean, generous whitespace. Information design, not editorial art.
1200x600px aspect ratio, white background.`,
    filename: 'conflict-venue-capacity.png'
  },
  'timeline-conflict': {
    prompt: `A modern, minimalist data visualization showing diverging timelines in conflict.
Two parallel horizontal bars/paths that start aligned but diverge apart, creating tension.
One path in blue-green gradient (#10b981 to #34d399) representing "on track",
another in orange-red gradient (#f59e0b to #f97316) representing "delayed".
Abstract geometric shapes, rounded corners, generous whitespace. The visual should
instantly communicate "schedules not aligned" without text. Clean, editorial style.
1200x600px aspect ratio, white background.`,
    filename: 'conflict-timeline.png'
  },
  'stalled-risk': {
    prompt: `A modern, minimalist data visualization showing stalled progress and risk.
A warning triangle or alert symbol made of geometric shapes, with a progress bar
that's barely filled (around 20%), creating a sense of stagnation. Use red-orange
gradients (#ef4444 to #f97316) for warning elements. Abstract, clean design with
rounded corners and generous whitespace. Should instantly communicate "stuck, not moving"
without text. Clean, editorial style. 1200x600px aspect ratio, white background.`,
    filename: 'risk-stalled.png'
  },
  'data-convergence': {
    prompt: `A modern, minimalist data visualization showing three streams converging into one point.
Three flowing paths in different blue/purple gradients (#3b82f6, #6366f1, #8b5cf6)
coming from the left side, merging into a single green point (#10b981) on the right.
Smooth, organic flowing lines with geometric elements. Generous whitespace, rounded shapes.
Should instantly communicate "multiple sources coming together" without text.
Clean, editorial style. 1200x600px aspect ratio, white background.`,
    filename: 'convergence-synthesis.png'
  },
  'missing-gap': {
    prompt: `A modern, minimalist data visualization showing a missing element or gap.
A circular progress ring or incomplete circle, showing about 40% completion, with the
missing segment clearly visible. Use blue-purple gradients (#3b82f6 to #8b5cf6)
for the completed portion, with subtle gray for the gap. Clean geometric shapes,
rounded corners, generous whitespace. Should instantly communicate "incomplete, missing piece"
without text. Clean, editorial style. 1200x600px aspect ratio, white background.`,
    filename: 'gap-missing.png'
  }
};

async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }

      const fileStream = fs.createWriteStream(filepath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });

      fileStream.on('error', (err) => {
        fs.unlink(filepath, () => reject(err));
      });
    }).on('error', reject);
  });
}

async function generateVisualization(key, config) {
  console.log(`\n🎨 Generating: ${key}...`);
  console.log(`📝 Prompt: ${config.prompt.substring(0, 100)}...`);

  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: config.prompt,
      n: 1,
      size: "1792x1024", // DALL-E 3 closest to 1200x600 aspect ratio
      quality: "standard",
      style: "natural"
    });

    const imageUrl = response.data[0].url;
    const outputPath = path.join(__dirname, '..', 'public', 'feed-viz', config.filename);

    console.log(`⬇️  Downloading image...`);
    await downloadImage(imageUrl, outputPath);

    console.log(`✅ Saved: ${config.filename}`);
    console.log(`📍 Path: /feed-viz/${config.filename}`);

    return { success: true, filename: config.filename };
  } catch (error) {
    console.error(`❌ Error generating ${key}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 Starting AI Feed Visualization Generator\n');
  console.log(`🔑 Using OpenAI API Key: ${process.env.OPENAI_API_KEY ? '✓ Found' : '✗ Not found'}`);

  if (!process.env.OPENAI_API_KEY) {
    console.error('\n❌ Error: OPENAI_API_KEY not found in environment variables');
    console.error('Please ensure .env.local contains OPENAI_API_KEY');
    process.exit(1);
  }

  // Get visualization key from command line argument, or generate all
  const targetKey = process.argv[2];

  if (targetKey) {
    if (!visualizations[targetKey]) {
      console.error(`\n❌ Unknown visualization: ${targetKey}`);
      console.error(`Available options: ${Object.keys(visualizations).join(', ')}`);
      process.exit(1);
    }

    const result = await generateVisualization(targetKey, visualizations[targetKey]);

    if (!result.success) {
      process.exit(1);
    }
  } else {
    // Generate all visualizations
    console.log(`📋 Generating ${Object.keys(visualizations).length} visualizations...\n`);

    for (const [key, config] of Object.entries(visualizations)) {
      await generateVisualization(key, config);

      // Add delay between requests to avoid rate limiting
      if (Object.keys(visualizations).indexOf(key) < Object.keys(visualizations).length - 1) {
        console.log('⏳ Waiting 2 seconds before next request...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  console.log('\n✨ Done!');
}

main().catch(console.error);
