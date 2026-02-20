export type SpaceRow = {
  id: string;
  name: string;
  description: string;
  emoji: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
  order: number;
};

export type CanvasRow = {
  id: string;
  space_id: string;
  name: string;
  emoji: string | null;
  section_id: string | null;
  created_at: string;
  updated_at: string;
  order: number;
};

export type BoardSectionRow = {
  id: string;
  space_id: string;
  label: string;
  order: number;
  created_at: string;
  updated_at: string;
};

export function spaceRowToApi(row: SpaceRow) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    emoji: row.emoji ?? undefined,
    color: row.color ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    order: row.order,
  };
}

export function canvasRowToApi(row: CanvasRow) {
  return {
    id: row.id,
    spaceId: row.space_id,
    name: row.name,
    emoji: row.emoji ?? undefined,
    sectionId: row.section_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    order: row.order,
  };
}

export function boardSectionRowToApi(row: BoardSectionRow) {
  return {
    id: row.id,
    spaceId: row.space_id,
    label: row.label,
    order: row.order,
  };
}
