"use client";

import { Suspense, useCallback, useMemo, useRef, useState, useEffect } from "react";
import { RoomProvider, useStorage, useMutation } from "@/liveblocks.config";
import { LiveMap } from "@liveblocks/client";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type ColumnSizingState,
} from "@tanstack/react-table";
import {
  type TableMeta,
  type ColumnConfig,
  type ColumnType,
  type SelectOption,
  type RowData,
  DEFAULT_META,
  migrateColumns,
  getRandomOptionColor,
} from "./datatable/types";
import { CellRenderer } from "./datatable/CellRenderer";
import { ColumnTypeIcon } from "./datatable/ColumnTypeIcons";
import { ColumnTypePicker } from "./datatable/ColumnTypePicker";
import { ColumnHeaderMenu } from "./datatable/ColumnHeaderMenu";
import { IconDotsThreeVertical, IconTable } from "@mirohq/design-system-icons";
import type { Editor } from "tldraw";

interface DataTableEditorProps {
  tableId: string;
  title: string;
  isEditing: boolean;
  isSelected?: boolean;
  tldrawEditor?: Editor;
  w: number;
  h: number;
  onEscape?: () => void;
  initialData?: { columns: (string | { name: string; type?: string })[]; rows: string[][] };
  pendingRows?: string[][];
}

// Editable header component with type icon and config menu
function EditableHeader({
  column,
  colIndex,
  isEditing,
  onRename,
  onChangeType,
  onDeleteColumn,
  sortDirection,
  onToggleSort,
}: {
  column: ColumnConfig;
  colIndex: number;
  isEditing: boolean;
  onRename: (colIndex: number, name: string) => void;
  onChangeType: (colIndex: number, type: ColumnType) => void;
  onDeleteColumn: (colIndex: number) => void;
  sortDirection: false | "asc" | "desc";
  onToggleSort: () => void;
}) {
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const [headerValue, setHeaderValue] = useState(column.name);
  const [showMenu, setShowMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isHeaderEditing) {
      setHeaderValue(column.name);
    }
  }, [column.name, isHeaderEditing]);

  useEffect(() => {
    if (isHeaderEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isHeaderEditing]);

  const handleSave = useCallback(() => {
    onRename(colIndex, headerValue);
    setIsHeaderEditing(false);
  }, [colIndex, headerValue, onRename]);

  if (isHeaderEditing) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span style={{ color: "var(--color-gray-400)", display: "flex" }}>
          <ColumnTypeIcon type={column.type} size={14} />
        </span>
        <input
          ref={inputRef}
          value={headerValue}
          onChange={(e) => setHeaderValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") {
              setHeaderValue(column.name);
              setIsHeaderEditing(false);
            }
            e.stopPropagation();
          }}
          onClick={(e) => e.stopPropagation()}
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            background: "transparent",
            fontSize: 12,
            fontWeight: 600,
            color: "var(--color-gray-700)",
            padding: 0,
            margin: 0,
            minWidth: 0,
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          cursor: isEditing ? "pointer" : "default",
        }}
        onClick={(e) => {
          if (isEditing) {
            e.stopPropagation();
            onToggleSort();
          }
        }}
        onDoubleClick={(e) => {
          if (isEditing) {
            e.stopPropagation();
            setIsHeaderEditing(true);
          }
        }}
        onContextMenu={(e) => {
          if (isEditing) {
            e.preventDefault();
            e.stopPropagation();
            setShowMenu(true);
          }
        }}
      >
        <span style={{ color: "var(--color-gray-400)", display: "flex", flexShrink: 0 }}>
          <ColumnTypeIcon type={column.type} size={14} />
        </span>
        <span
          style={{
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {column.name}
        </span>
        {sortDirection && (
          <span style={{ fontSize: 10, color: "var(--color-gray-500)", flexShrink: 0 }}>
            {sortDirection === "asc" ? "▲" : "▼"}
          </span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu((prev) => !prev);
          }}
          style={{
            padding: 0,
            border: "none",
            background: "transparent",
            cursor: isEditing ? "pointer" : "default",
            color: "var(--color-gray-400)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 16,
            height: 16,
            flexShrink: 0,
            borderRadius: 3,
            opacity: isEditing ? 0.6 : 0,
            pointerEvents: isEditing ? "auto" : "none",
          }}
          onMouseEnter={(e) => { if (isEditing) e.currentTarget.style.opacity = "1"; }}
          onMouseLeave={(e) => { if (isEditing) e.currentTarget.style.opacity = "0.6"; }}
        >
          <IconDotsThreeVertical css={{ width: 12, height: 12 }} />
        </button>
      </div>
      {showMenu && (
        <ColumnHeaderMenu
          column={column}
          colIndex={colIndex}
          onChangeType={onChangeType}
          onDeleteColumn={onDeleteColumn}
          onClose={() => setShowMenu(false)}
          style={{ top: "100%", left: 0, marginTop: 4 }}
        />
      )}
    </div>
  );
}

function DataTableGrid({
  title,
  isEditing,
  isSelected,
  tldrawEditor,
  onEscape,
  pendingRows,
}: {
  title: string;
  isEditing: boolean;
  isSelected?: boolean;
  tldrawEditor?: Editor;
  onEscape?: () => void;
  pendingRows?: string[][];
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [showFilters, setShowFilters] = useState(false);
  const [showAddColumnPicker, setShowAddColumnPicker] = useState(false);

  // Read the meta key from storage reactively, returning a stable
  // serialized string to avoid reference-change re-render loops.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const metaSerialized = useStorage((root: any) => {
    const records = root.records;
    if (!records) return null;
    const m = records.get("meta") as TableMeta | undefined;
    return m ? JSON.stringify(m) : null;
  });
  const meta = useMemo(() => {
    if (!metaSerialized) return null;
    const parsed = JSON.parse(metaSerialized) as TableMeta;
    // Migrate legacy string[] columns to ColumnConfig[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parsed.columns = migrateColumns(parsed.columns as any);
    return parsed;
  }, [metaSerialized]);

  // Read all cell values reactively, returning a stable reference
  // to avoid infinite re-render loops with TanStack Table.
  const cellsRef = useRef<Record<string, string>>({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cellsSerialized = useStorage((root: any) => {
    const records = root.records;
    if (!records) return "{}";
    const result: Record<string, string> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const [key, value] of records.entries()) {
      if (typeof key === "string" && key.startsWith("cell:")) {
        result[key] = value as string;
      }
    }
    return JSON.stringify(result);
  });
  const cells = useMemo(() => {
    const parsed = JSON.parse(cellsSerialized || "{}") as Record<string, string>;
    cellsRef.current = parsed;
    return parsed;
  }, [cellsSerialized]);

  // Update a cell value
  const updateCell = useMutation(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ({ storage }: any, { key, value }: { key: string; value: string }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const records = storage.get("records") as LiveMap<string, any>;
      if (!records) return;
      records.set(key, value);
    },
    []
  );

  // Update a column header name
  const updateColumnName = useMutation(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ({ storage }: any, { colIndex, name }: { colIndex: number; name: string }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const records = storage.get("records") as LiveMap<string, any>;
      if (!records) return;
      const currentMeta = records.get("meta") as TableMeta | undefined;
      if (!currentMeta) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cols = migrateColumns(currentMeta.columns as any);
      const newColumns = [...cols];
      newColumns[colIndex] = { ...newColumns[colIndex], name };
      records.set("meta", { ...currentMeta, columns: newColumns });
    },
    []
  );

  // Change a column type
  const updateColumnType = useMutation(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ({ storage }: any, { colIndex, type }: { colIndex: number; type: ColumnType }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const records = storage.get("records") as LiveMap<string, any>;
      if (!records) return;
      const currentMeta = records.get("meta") as TableMeta | undefined;
      if (!currentMeta) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cols = migrateColumns(currentMeta.columns as any);
      const newColumns = [...cols];
      const existing = newColumns[colIndex];
      newColumns[colIndex] = {
        name: existing.name,
        type,
        // Preserve options if switching between select types
        options:
          (type === "select" || type === "multiSelect") ? (existing.options ?? []) : undefined,
      };
      records.set("meta", { ...currentMeta, columns: newColumns });
    },
    []
  );

  // Update select options for a column
  const updateColumnOptions = useMutation(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ({ storage }: any, { colIndex, options }: { colIndex: number; options: SelectOption[] }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const records = storage.get("records") as LiveMap<string, any>;
      if (!records) return;
      const currentMeta = records.get("meta") as TableMeta | undefined;
      if (!currentMeta) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cols = migrateColumns(currentMeta.columns as any);
      const newColumns = [...cols];
      newColumns[colIndex] = { ...newColumns[colIndex], options };
      records.set("meta", { ...currentMeta, columns: newColumns });
    },
    []
  );

  // Delete a column
  const deleteColumn = useMutation(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ({ storage }: any, { colIndex }: { colIndex: number }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const records = storage.get("records") as LiveMap<string, any>;
      if (!records) return;
      const currentMeta = records.get("meta") as TableMeta | undefined;
      if (!currentMeta) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cols = migrateColumns(currentMeta.columns as any);
      if (cols.length <= 1) return; // Don't delete last column
      const newColumns = cols.filter((_, i) => i !== colIndex);
      records.set("meta", { ...currentMeta, columns: newColumns });
      // Note: cell data for the deleted column index remains but is harmless
    },
    []
  );

  // Add a new row
  const addRow = useMutation(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ({ storage }: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const records = storage.get("records") as LiveMap<string, any>;
      if (!records) return;
      const currentMeta = records.get("meta") as TableMeta | undefined;
      if (!currentMeta) return;
      records.set("meta", { ...currentMeta, rowCount: currentMeta.rowCount + 1 });
    },
    []
  );

  // Apply pending rows from AI streaming (same pattern as DocumentEditor's pendingContent)
  const applyPendingRows = useMutation(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ({ storage }: any, { rows }: { rows: string[][] }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const records = storage.get("records") as LiveMap<string, any>;
      if (!records) return;
      const currentMeta = records.get("meta") as TableMeta | undefined;
      if (!currentMeta) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cols = migrateColumns(currentMeta.columns as any);
      // Update row count and populate cells
      records.set("meta", { ...currentMeta, rowCount: rows.length });
      rows.forEach((row, rowIdx) => {
        row.forEach((cell, colIdx) => {
          if (colIdx < cols.length) {
            records.set(`cell:${rowIdx}:${colIdx}`, cell);
          }
        });
      });
    },
    []
  );

  const appliedPendingRowsRef = useRef<number>(0);
  useEffect(() => {
    // Wait for Liveblocks storage to be loaded (meta available) before applying rows
    if (!meta) return;
    if (!pendingRows || pendingRows.length <= appliedPendingRowsRef.current) return;
    applyPendingRows({ rows: pendingRows });
    appliedPendingRowsRef.current = pendingRows.length;
  }, [pendingRows, applyPendingRows, meta]);

  // Add a new column with a specified type
  const addColumnWithType = useMutation(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ({ storage }: any, { type }: { type: ColumnType }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const records = storage.get("records") as LiveMap<string, any>;
      if (!records) return;
      const currentMeta = records.get("meta") as TableMeta | undefined;
      if (!currentMeta) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cols = migrateColumns(currentMeta.columns as any);
      const newCol: ColumnConfig = {
        name: `Column ${cols.length + 1}`,
        type,
        options: (type === "select" || type === "multiSelect") ? [] : undefined,
      };
      records.set("meta", {
        ...currentMeta,
        columns: [...cols, newCol],
      });
    },
    []
  );

  const handleCellSave = useCallback(
    (rowIndex: number, colIndex: number, value: string) => {
      updateCell({ key: `cell:${rowIndex}:${colIndex}`, value });
    },
    [updateCell]
  );

  const handleColumnRename = useCallback(
    (colIndex: number, name: string) => {
      updateColumnName({ colIndex, name });
    },
    [updateColumnName]
  );

  const handleChangeType = useCallback(
    (colIndex: number, type: ColumnType) => {
      updateColumnType({ colIndex, type });
    },
    [updateColumnType]
  );

  const handleUpdateOptions = useCallback(
    (colIndex: number, options: SelectOption[]) => {
      updateColumnOptions({ colIndex, options });
    },
    [updateColumnOptions]
  );

  const handleDeleteColumn = useCallback(
    (colIndex: number) => {
      deleteColumn({ colIndex });
    },
    [deleteColumn]
  );

  const tableMeta = meta || DEFAULT_META;
  const columnConfigs = tableMeta.columns;
  const rowCount = tableMeta.rowCount;

  // Build row data from Liveblocks cells
  const data: RowData[] = useMemo(() => {
    return Array.from({ length: rowCount }, (_, rowIdx) => {
      const row: RowData = { _rowIndex: rowIdx };
      columnConfigs.forEach((_, colIdx) => {
        row[`col_${colIdx}`] = cells?.[`cell:${rowIdx}:${colIdx}`] || "";
      });
      return row;
    });
  }, [rowCount, columnConfigs, cells]);

  // Build TanStack column definitions dynamically
  const columns: ColumnDef<RowData>[] = useMemo(() => {
    // Row number column
    const rowNumCol: ColumnDef<RowData> = {
      id: "_rowNum",
      header: "#",
      size: 36,
      enableSorting: false,
      enableColumnFilter: false,
      enableResizing: false,
      cell: ({ row }) => row.original._rowIndex + 1,
    };

    const dataCols: ColumnDef<RowData>[] = columnConfigs.map((colConfig, colIdx) => ({
      id: `col_${colIdx}`,
      accessorKey: `col_${colIdx}`,
      header: colConfig.name,
      size: 150,
      minSize: 60,
      maxSize: 800,
      enableResizing: true,
      cell: ({ row }: { row: { original: RowData } }) => (
        <CellRenderer
          column={colConfig}
          value={String(row.original[`col_${colIdx}`] || "")}
          rowIndex={row.original._rowIndex}
          colIndex={colIdx}
          isEditing={isEditing}
          onSave={handleCellSave}
          onUpdateOptions={handleUpdateOptions}
        />
      ),
    }));

    return [rowNumCol, ...dataCols];
  }, [columnConfigs, isEditing, handleCellSave, handleUpdateOptions]);

  const table = useReactTable({
    data,
    columns,
    columnResizeMode: "onChange",
    enableColumnResizing: true,
    state: {
      sorting,
      columnFilters,
      columnSizing,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnSizingChange: setColumnSizing,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div
      data-shape-editing={isEditing ? "true" : "false"}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
      onPointerDown={(e) => {
        if (isEditing) {
          e.stopPropagation();
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onEscape?.();
        }
      }}
    >
      {/* Title bar */}
      <div
        style={{
          padding: "12px 14px",
          borderBottom: "1px solid var(--color-gray-100)",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <IconTable css={{ width: 16, height: 16, flexShrink: 0, color: 'var(--color-gray-400)' }} />
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--color-gray-700)",
              lineHeight: "18px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {title}
          </span>
        </div>
      </div>

      {/* Table content */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          fontSize: 12,
        }}
      >
        <table
          style={{
            borderCollapse: "collapse",
            minWidth: "100%",
            width: table.getCenterTotalSize() + 32, // +32 for add-column button col
            tableLayout: "fixed",
          }}
        >
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const isRowNum = header.column.id === "_rowNum";
                  const colIdx = isRowNum
                    ? -1
                    : parseInt(header.column.id.replace("col_", ""), 10);

                  return (
                    <th
                      key={header.id}
                      style={{
                        width: header.getSize(),
                        padding: "6px 8px",
                        borderBottom: "1px solid var(--color-gray-200)",
                        borderRight: "1px solid var(--color-gray-100)",
                        background: "var(--color-gray-50)",
                        color: isRowNum ? "var(--color-gray-400)" : "var(--color-gray-700)",
                        fontSize: isRowNum ? 11 : 12,
                        fontWeight: isRowNum ? 500 : 600,
                        textAlign: isRowNum ? "center" : "left",
                        position: "sticky",
                        top: 0,
                        zIndex: 2,
                        overflow: "hidden",
                      }}
                    >
                      {isRowNum ? (
                        "#"
                      ) : (
                        <>
                          <EditableHeader
                            column={columnConfigs[colIdx]}
                            colIndex={colIdx}
                            isEditing={isEditing}
                            onRename={handleColumnRename}
                            onChangeType={handleChangeType}
                            onDeleteColumn={handleDeleteColumn}
                            sortDirection={header.column.getIsSorted()}
                            onToggleSort={() => header.column.toggleSorting()}
                          />
                          {showFilters && (
                            <input
                              value={(header.column.getFilterValue() as string) ?? ""}
                              onChange={(e) => header.column.setFilterValue(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => e.stopPropagation()}
                              placeholder="Filter..."
                              style={{
                                width: "100%",
                                marginTop: 4,
                                padding: "2px 4px",
                                border: "1px solid var(--color-gray-200)",
                                borderRadius: 3,
                                fontSize: 11,
                                color: "var(--color-gray-700)",
                                background: "#ffffff",
                                outline: "none",
                                boxSizing: "border-box",
                              }}
                            />
                          )}
                        </>
                      )}
                      {header.column.getCanResize() && (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          onPointerDown={(e) => e.stopPropagation()}
                          style={{
                            position: "absolute",
                            right: 0,
                            top: 0,
                            height: "100%",
                            width: 4,
                            cursor: "col-resize",
                            userSelect: "none",
                            touchAction: "none",
                            background: header.column.getIsResizing() ? "#3b82f6" : "transparent",
                          }}
                          onMouseEnter={(e) => {
                            if (!header.column.getIsResizing()) {
                              e.currentTarget.style.background = "var(--color-gray-300)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!header.column.getIsResizing()) {
                              e.currentTarget.style.background = "transparent";
                            }
                          }}
                        />
                      )}
                    </th>
                  );
                })}
                {/* Add column button header — always rendered to keep layout stable */}
                <th
                  style={{
                    width: 32,
                    padding: "6px 4px",
                    borderBottom: "1px solid var(--color-gray-200)",
                    background: "var(--color-gray-50)",
                    position: "sticky",
                    top: 0,
                    zIndex: 2,
                  }}
                >
                  <div style={{ position: "relative" }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAddColumnPicker((prev) => !prev);
                      }}
                      style={{
                        width: 20,
                        height: 20,
                        border: "1px solid var(--color-gray-200)",
                        borderRadius: 4,
                        background: "#ffffff",
                        color: "var(--color-gray-400)",
                        fontSize: 14,
                        lineHeight: "18px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 0,
                      }}
                      title="Add column"
                    >
                      +
                    </button>
                    {showAddColumnPicker && (
                      <ColumnTypePicker
                        onSelect={(type) => {
                          addColumnWithType({ type });
                          setShowAddColumnPicker(false);
                        }}
                        onClose={() => setShowAddColumnPicker(false)}
                        style={{ top: "100%", right: 0, marginTop: 4 }}
                      />
                    )}
                  </div>
                </th>
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => {
                  const isRowNum = cell.column.id === "_rowNum";

                  return (
                    <td
                      key={cell.id}
                      style={{
                        width: cell.column.getSize(),
                        padding: isRowNum ? "5px 4px" : 0,
                        borderBottom: "1px solid var(--color-gray-100)",
                        borderRight: "1px solid var(--color-gray-100)",
                        background: isRowNum ? "var(--color-gray-50)" : "transparent",
                        color: isRowNum ? "var(--color-gray-400)" : undefined,
                        fontSize: isRowNum ? 11 : undefined,
                        fontWeight: isRowNum ? 500 : undefined,
                        textAlign: isRowNum ? "center" : undefined,
                        overflow: "hidden",
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
                {/* Spacer for add-column button column — always rendered to keep layout stable */}
                <td style={{ borderBottom: "1px solid var(--color-gray-100)" }} />
              </tr>
            ))}
          </tbody>
        </table>

        {/* Add row button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            addRow();
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "6px 12px",
            border: "none",
            background: "transparent",
            color: "var(--color-gray-400)",
            fontSize: 12,
            cursor: "pointer",
            width: "100%",
            borderTop: "1px solid var(--color-gray-100)",
          }}
          title="Add row"
        >
          <span style={{ fontSize: 14, lineHeight: "14px" }}>+</span>
          Add row
        </button>
      </div>
    </div>
  );
}

export function DataTableEditor({
  tableId,
  title,
  isEditing,
  isSelected,
  tldrawEditor,
  w,
  h,
  onEscape,
  initialData,
  pendingRows,
}: DataTableEditorProps) {
  // Build initial Liveblocks storage from AI-provided data (or fall back to defaults).
  // initialStorage only applies when the room is first created — existing rooms keep their data.
  const initialRecords = useMemo(() => {
    if (!initialData) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const entries: [string, any][] = [["meta", DEFAULT_META]];
      // Pre-populate empty cell keys so edits persist in Liveblocks
      for (let r = 0; r < DEFAULT_META.rowCount; r++) {
        for (let c = 0; c < DEFAULT_META.columns.length; c++) {
          entries.push([`cell:${r}:${c}`, ""]);
        }
      }
      return entries;
    }
    // Support both string[] and {name, type}[] column formats
    const cols: ColumnConfig[] = initialData.columns.map((col) => {
      if (typeof col === "string") return { name: col, type: "text" as ColumnType };
      return { name: col.name, type: (col.type || "text") as ColumnType };
    });

    // For select columns, auto-create options from unique row values
    cols.forEach((col, colIdx) => {
      if (col.type === "select" || col.type === "multiSelect") {
        const uniqueValues = new Set<string>();
        initialData.rows.forEach((row) => {
          const val = row[colIdx]?.trim();
          if (val) uniqueValues.add(val);
        });
        col.options = Array.from(uniqueValues).map((label) => ({
          label,
          color: getRandomOptionColor(),
        }));
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entries: [string, any][] = [
      ["meta", { columns: cols, rowCount: initialData.rows.length }],
    ];
    initialData.rows.forEach((row, rowIdx) => {
      row.forEach((cell, colIdx) => {
        entries.push([`cell:${rowIdx}:${colIdx}`, cell]);
      });
    });
    return entries;
  }, [initialData]);

  if (!tableId) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          color: "var(--color-gray-400)",
          fontSize: 13,
        }}
      >
        No table ID
      </div>
    );
  }

  const roomId = `table-${tableId}`;

  return (
    <RoomProvider
      id={roomId}
      initialPresence={{ presence: null }}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      initialStorage={{
        records: new LiveMap(initialRecords) as any,
      }}
    >
      <Suspense
        fallback={
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
            }}
          >
            <div
              style={{
                padding: "10px 14px 6px",
                borderBottom: "1px solid var(--color-gray-100)",
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <IconTable css={{ width: 16, height: 16, flexShrink: 0, color: 'var(--color-gray-400)' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-gray-700)" }}>{title}</span>
              </div>
            </div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 12, color: "var(--color-gray-400)" }}>Loading table...</span>
            </div>
          </div>
        }
      >
        <DataTableGrid title={title} isEditing={isEditing} isSelected={isSelected} tldrawEditor={tldrawEditor} onEscape={onEscape} pendingRows={pendingRows} />
      </Suspense>
    </RoomProvider>
  );
}
