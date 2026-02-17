/**
 * One-time migration: Import spaces and canvases from JSON files into Supabase.
 *
 * Usage:
 *   SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=xxx npx tsx scripts/migrate-to-supabase.ts
 *
 * Or if env vars are already in .env.local:
 *   npx dotenv -e .env.local -- npx tsx scripts/migrate-to-supabase.ts
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  const spacesPath = path.join(process.cwd(), 'src/data/spaces.json');
  const canvasesPath = path.join(process.cwd(), 'src/data/canvases.json');

  // --- Spaces ---
  const spaces = JSON.parse(fs.readFileSync(spacesPath, 'utf-8'));
  const spaceRows = spaces.map((s: Record<string, unknown>) => ({
    id: s.id,
    name: s.name,
    description: (s.description as string) || '',
    created_at: s.createdAt,
    updated_at: s.updatedAt,
    order: (s.order as number) ?? 0,
  }));

  if (spaceRows.length > 0) {
    const { error } = await supabase.from('spaces').upsert(spaceRows);
    if (error) {
      console.error('Failed to insert spaces:', error);
      process.exit(1);
    }
    console.log(`Inserted ${spaceRows.length} spaces`);
  } else {
    console.log('No spaces to insert');
  }

  // --- Canvases (batch to handle large emoji data) ---
  const canvases = JSON.parse(fs.readFileSync(canvasesPath, 'utf-8'));
  const canvasMap = new Map<string, Record<string, unknown>>();
  for (const c of canvases) {
    canvasMap.set(c.id as string, c); // last occurrence wins (deduplicates)
  }
  const canvasRows = Array.from(canvasMap.values()).map((c) => ({
    id: c.id,
    space_id: (c.spaceId as string) || '',
    name: c.name,
    emoji: (c.emoji as string) || null,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
    order: (c.order as number) ?? 0,
  }));
  if (canvasRows.length !== canvases.length) {
    console.log(`Deduplicated: ${canvases.length} → ${canvasRows.length} canvases`);
  }

  const BATCH_SIZE = 50;
  for (let i = 0; i < canvasRows.length; i += BATCH_SIZE) {
    const batch = canvasRows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('canvases').upsert(batch);
    if (error) {
      console.error(`Failed to insert canvases batch ${i}:`, error);
      process.exit(1);
    }
    console.log(`Inserted canvases ${i + 1}-${Math.min(i + BATCH_SIZE, canvasRows.length)}`);
  }

  console.log(`\nMigration complete: ${spaceRows.length} spaces, ${canvasRows.length} canvases`);
}

migrate();
