import type { ColumnConfig, SelectOption } from "./types";
import { TextCell } from "./cells/TextCell";
import { NumberCell } from "./cells/NumberCell";
import { DateCell } from "./cells/DateCell";
import { LinkCell } from "./cells/LinkCell";
import { SelectCell } from "./cells/SelectCell";
import { MultiSelectCell } from "./cells/MultiSelectCell";
import { PersonCell } from "./cells/PersonCell";
import { FormulaCell } from "./cells/FormulaCell";
import { RelatesToCell } from "./cells/RelatesToCell";
import { RollupCell } from "./cells/RollupCell";

interface CellRendererProps {
  column: ColumnConfig;
  value: string;
  rowIndex: number;
  colIndex: number;
  isEditing: boolean;
  onSave: (rowIndex: number, colIndex: number, value: string) => void;
  onUpdateOptions?: (colIndex: number, options: SelectOption[]) => void;
}

export function CellRenderer({
  column,
  value,
  rowIndex,
  colIndex,
  isEditing,
  onSave,
  onUpdateOptions,
}: CellRendererProps) {
  switch (column.type) {
    case "number":
      return (
        <NumberCell
          value={value}
          rowIndex={rowIndex}
          colIndex={colIndex}
          isEditing={isEditing}
          onSave={onSave}
        />
      );

    case "date":
      return (
        <DateCell
          value={value}
          rowIndex={rowIndex}
          colIndex={colIndex}
          isEditing={isEditing}
          onSave={onSave}
        />
      );

    case "link":
      return (
        <LinkCell
          value={value}
          rowIndex={rowIndex}
          colIndex={colIndex}
          isEditing={isEditing}
          onSave={onSave}
        />
      );

    case "select":
      return (
        <SelectCell
          value={value}
          rowIndex={rowIndex}
          colIndex={colIndex}
          isEditing={isEditing}
          options={column.options ?? []}
          onSave={onSave}
          onUpdateOptions={onUpdateOptions}
        />
      );

    case "multiSelect":
      return (
        <MultiSelectCell
          value={value}
          rowIndex={rowIndex}
          colIndex={colIndex}
          isEditing={isEditing}
          options={column.options ?? []}
          onSave={onSave}
          onUpdateOptions={onUpdateOptions}
        />
      );

    case "person":
      return (
        <PersonCell
          value={value}
          rowIndex={rowIndex}
          colIndex={colIndex}
          isEditing={isEditing}
          onSave={onSave}
        />
      );

    case "formula":
      return <FormulaCell value={value} formula={column.formula} />;

    case "relatesTo":
      return (
        <RelatesToCell value={value} relatedTableId={column.relatedTableId} />
      );

    case "rollup":
      return <RollupCell value={value} />;

    case "text":
    default:
      return (
        <TextCell
          value={value}
          rowIndex={rowIndex}
          colIndex={colIndex}
          isEditing={isEditing}
          onSave={onSave}
        />
      );
  }
}
