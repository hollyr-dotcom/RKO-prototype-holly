import { IconFormula } from "@mirohq/design-system-icons";

interface FormulaCellProps {
  value: string;
  formula?: string;
}

export function FormulaCell({ value, formula }: FormulaCellProps) {
  return (
    <div
      style={{
        padding: "5px 8px",
        fontSize: 12,
        color: value ? "#1f2937" : "#d1d5db",
        minHeight: 28,
        lineHeight: "18px",
        display: "flex",
        alignItems: "center",
        gap: 4,
        fontVariantNumeric: "tabular-nums",
      }}
      title={formula ? `Formula: ${formula}` : undefined}
    >
      {value ? (
        <>
          <IconFormula css={{ width: 10, height: 10, flexShrink: 0, opacity: 0.4 }} />
          <span>{value}</span>
        </>
      ) : (
        <span style={{ color: "#d1d5db", fontStyle: "italic", fontSize: 11 }}>
          Formula
        </span>
      )}
    </div>
  );
}
