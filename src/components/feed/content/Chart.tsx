"use client";

import type { FeedItem } from "@/types/feed";
import { GenericVisualPreview } from "../visuals/GenericVisualPreview";

type ChartItem = Extract<FeedItem, { type: "chart" }>;

export function ChartContent({ item }: { item: ChartItem }) {
  const { chartType, title, data } = item.payload;

  const previewType = chartType === "bar" ? "BarChartPreview"
    : chartType === "line" ? "LineChartPreview"
    : chartType === "donut" || chartType === "pie" ? "DonutChartPreview"
    : "BarChartPreview";

  return (
    <div className="px-6 pb-6">
      <GenericVisualPreview type={previewType} data={{ title, ...data }} />
    </div>
  );
}
