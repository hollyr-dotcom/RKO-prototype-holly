"use client";

import type { FeedItem } from "@/types/feed";
import { FeedArtifactPreview } from "../FeedArtifactPreview";
import { ReviewPipeline, ApprovalStamp, ContractSigned } from "../visuals/WorkflowVisuals";

type WorkflowChangeItem = Extract<FeedItem, { type: "workflow-change" }>;

interface WorkflowChangeProps {
  item: WorkflowChangeItem;
}

export function WorkflowChangeContent({ item }: WorkflowChangeProps) {
  const { fromStatus, toStatus, implication, artifact, reviewPipeline, approvalStamp, signedSeal } = item.payload;

  return (
    <div className="pb-6">
      {/* Show artifact preview if present (document/board reference), OR bespoke visual if no artifact */}
      <div className="px-6">
        {artifact && <FeedArtifactPreview artifact={artifact} variant="compact" />}
        {!artifact && reviewPipeline && <ReviewPipeline stages={reviewPipeline.stages} />}
        {!artifact && approvalStamp && <ApprovalStamp icon={approvalStamp.icon} />}
        {!artifact && signedSeal && <ContractSigned documentType={signedSeal.documentType} />}
      </div>

      {/* Full-width transition banner (existing, kept as-is) */}
      <div className="rounded-xl overflow-hidden mx-6 mt-3">
        <div className="flex items-center bg-gradient-to-r from-gray-100 to-green-50 px-6 py-3">
          <span className="text-xs font-medium text-gray-500">
            {fromStatus}
          </span>
          <div className="flex-1 mx-3 h-px relative">
            {/* Gradient line */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: "linear-gradient(to right, #9ca3af, #22c55e)",
              }}
            />
            {/* Arrow head */}
            <svg
              className="absolute -right-1 top-1/2 -translate-y-1/2"
              width="8"
              height="8"
              viewBox="0 0 8 8"
            >
              <path d="M0 0 L8 4 L0 8" fill="#22c55e" />
            </svg>
          </div>
          <span className="text-xs font-semibold text-green-700">
            {toStatus}
          </span>
        </div>
      </div>

      {/* Implication as subtle annotation */}
      {implication && (
        <p className="px-6 mt-2 text-xs text-gray-500 leading-relaxed line-clamp-2">
          {implication}
        </p>
      )}
    </div>
  );
}
