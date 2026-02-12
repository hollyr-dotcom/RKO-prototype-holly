import type { ColumnType } from "./types";
import {
  IconTextT,
  IconNumber,
  IconSelect,
  IconListBullets,
  IconCalendarBlank,
  IconUser,
  IconLink,
  IconFormula,
  IconArrowRightTowardLine,
  IconArrowsDownUp,
} from "@mirohq/design-system-icons";

/** Icons for each column type, using @mirohq/design-system-icons */
export function ColumnTypeIcon({
  type,
  size = 16,
}: {
  type: ColumnType;
  size?: number;
}) {
  const iconCss = { width: size, height: size, flexShrink: 0 };

  switch (type) {
    case "text":
      return <IconTextT css={iconCss} />;

    case "number":
      return <IconNumber css={iconCss} />;

    case "select":
      return <IconSelect css={iconCss} />;

    case "multiSelect":
      return <IconListBullets css={iconCss} />;

    case "date":
      return <IconCalendarBlank css={iconCss} />;

    case "person":
      return <IconUser css={iconCss} />;

    case "link":
      return <IconLink css={iconCss} />;

    case "formula":
      return <IconFormula css={iconCss} />;

    case "relatesTo":
      return <IconArrowRightTowardLine css={iconCss} />;

    case "rollup":
      return <IconArrowsDownUp css={iconCss} />;

    default:
      return null;
  }
}
