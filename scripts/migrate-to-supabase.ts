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

  // --- Cleanup: delete all existing data (order matters for FK constraints) ---
  console.log('Cleaning up existing data...');
  const { error: delCanvases } = await supabase.from('canvases').delete().neq('id', '');
  if (delCanvases) {
    console.error('Failed to delete canvases:', delCanvases);
    process.exit(1);
  }
  const { error: delSections } = await supabase.from('board_sections').delete().neq('id', '');
  if (delSections) {
    console.error('Failed to delete board_sections:', delSections);
    // Non-fatal — table may not exist yet
  }
  const { error: delSpaces } = await supabase.from('spaces').delete().neq('id', '');
  if (delSpaces) {
    console.error('Failed to delete spaces:', delSpaces);
    process.exit(1);
  }
  console.log('Existing data cleared');

  // --- Spaces ---
  const spaces = JSON.parse(fs.readFileSync(spacesPath, 'utf-8'));
  const spaceRows = spaces.map((s: Record<string, unknown>) => ({
    id: s.id,
    name: s.name,
    description: (s.description as string) || '',
    emoji: (s.emoji as string) || null,
    color: (s.color as string) || null,
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

  // --- Board Sections ---
  const { BOARD_SECTIONS } = await import('../src/data/board-sections');

  const sectionRows: { id: string; space_id: string; label: string; order: number }[] = [];
  const canvasSectionUpdates: { canvasId: string; sectionId: string }[] = [];

  for (const [spaceId, sections] of Object.entries(BOARD_SECTIONS)) {
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const sectionId = `section-${spaceId.replace('space-', '')}-${section.label.toLowerCase().replace(/\s+/g, '-')}`;
      sectionRows.push({
        id: sectionId,
        space_id: spaceId,
        label: section.label,
        order: i,
      });
      for (const canvasId of section.canvasIds) {
        canvasSectionUpdates.push({ canvasId, sectionId });
      }
    }
  }

  if (sectionRows.length > 0) {
    const { error } = await supabase.from('board_sections').upsert(sectionRows);
    if (error) {
      console.error('Failed to insert board_sections:', error);
    } else {
      console.log(`Inserted ${sectionRows.length} board sections`);
    }

    // Assign canvases to sections
    for (const { canvasId, sectionId } of canvasSectionUpdates) {
      await supabase.from('canvases').update({ section_id: sectionId }).eq('id', canvasId);
    }
    console.log(`Assigned ${canvasSectionUpdates.length} canvases to sections`);
  }

  console.log(`\nMigration complete: ${spaceRows.length} spaces, ${canvasRows.length} canvases, ${sectionRows.length} board sections`);
}

migrate();
