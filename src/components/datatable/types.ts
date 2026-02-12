// Column type definitions for DataTable

export type ColumnType =
  | "text"
  | "number"
  | "select"
  | "multiSelect"
  | "date"
  | "person"
  | "link"
  | "formula"
  | "relatesTo"
  | "rollup";

export interface SelectOption {
  label: string;
  color: string;
}

export interface ColumnConfig {
  name: string;
  type: ColumnType;
  // Select / Multi-select options
  options?: SelectOption[];
  // Date format (e.g. "YYYY-MM-DD", "MMM D, YYYY")
  dateFormat?: string;
  // Formula expression
  formula?: string;
  // Relates to – target table ID
  relatedTableId?: string;
  // Rollup configuration
  rollupConfig?: {
    relationColumnIndex: number;
    targetProperty: string;
    aggregation: "count" | "sum" | "avg" | "min" | "max";
  };
}

export interface TableMeta {
  columns: ColumnConfig[];
  rowCount: number;
}

export type RowData = Record<string, string | number> & { _rowIndex: number };

// Default select option colors (Notion-style)
export const OPTION_COLORS = [
  { name: "gray", bg: "#f1f1ef", text: "#787774" },
  { name: "brown", bg: "#f3eeee", text: "#976d57" },
  { name: "orange", bg: "#fdecc8", text: "#d9730d" },
  { name: "yellow", bg: "#fbecb0", text: "#cb912f" },
  { name: "green", bg: "#dbeddb", text: "#448361" },
  { name: "blue", bg: "#d3e5ef", text: "#337ea9" },
  { name: "purple", bg: "#e8deee", text: "#9065b0" },
  { name: "pink", bg: "#f5e0e9", text: "#c14c8a" },
  { name: "red", bg: "#ffe2dd", text: "#d44c47" },
];

/** Get a random option color */
export function getRandomOptionColor(): string {
  return OPTION_COLORS[Math.floor(Math.random() * OPTION_COLORS.length)].bg;
}

/** Get text color for a given background option color */
export function getOptionTextColor(bgColor: string): string {
  const found = OPTION_COLORS.find((c) => c.bg === bgColor);
  return found?.text ?? "#374151";
}

/** Migrate legacy columns (string[]) to ColumnConfig[] */
export function migrateColumns(
  columns: (string | ColumnConfig)[]
): ColumnConfig[] {
  return columns.map((col) => {
    if (typeof col === "string") {
      return { name: col, type: "text" as ColumnType };
    }
    return col;
  });
}

/** Default table metadata */
export const DEFAULT_META: TableMeta = {
  columns: [
    { name: "Name", type: "text" },
    { name: "Status", type: "select", options: [] },
    { name: "Notes", type: "text" },
  ],
  rowCount: 3,
};

/** Column type display info */
export const COLUMN_TYPE_INFO: Record<
  ColumnType,
  { label: string; description: string }
> = {
  text: { label: "Text", description: "Plain text content" },
  number: { label: "Number", description: "Numeric values" },
  select: { label: "Select", description: "Single option from a list" },
  multiSelect: {
    label: "Multiple select",
    description: "Multiple options from a list",
  },
  date: { label: "Date", description: "Date value" },
  person: { label: "Person", description: "User or team member" },
  link: { label: "Link", description: "URL link" },
  formula: { label: "Formula", description: "Computed value" },
  relatesTo: { label: "Relates to", description: "Link to another table" },
  rollup: { label: "Rollup", description: "Aggregated value from relation" },
};
