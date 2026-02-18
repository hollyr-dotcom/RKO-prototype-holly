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
  created_at: string;
  updated_at: string;
  order: number;
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    order: row.order,
  };
}
