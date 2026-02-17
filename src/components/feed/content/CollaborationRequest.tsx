"use client";

import type { FeedItem } from "@/types/feed";
import { FeedArtifactPreview } from "../FeedArtifactPreview";
import {
  ReviewChecklist,
  OptionCards,
  DecisionFork,
  FeedbackSteps,
  SpeakerSlots,
  VendorCompare,
  SurveyDimensions
} from "../visuals/CollaborationVisuals";

type CollaborationRequestItem = Extract<
  FeedItem,
  { type: "collaboration-request" }
>;

interface CollaborationRequestProps {
  item: CollaborationRequestItem;
}

export function CollaborationRequestContent({
  item,
}: CollaborationRequestProps) {
  const {
    artifact,
    reviewChecklist,
    optionCards,
    decisionFork,
    feedbackSteps,
    speakerSlots,
    vendorCompare,
    surveyDimensions
  } = item.payload;

  return (
    <div className="px-6 pb-6">
      {/* Show artifact preview if present (document/board reference) */}
      {artifact && <FeedArtifactPreview artifact={artifact} variant="compact" />}

      {/* Only show bespoke visual if no artifact */}
      {!artifact && reviewChecklist && <ReviewChecklist sections={reviewChecklist.sections} />}
      {!artifact && optionCards && <OptionCards options={optionCards.options} />}
      {!artifact && decisionFork && <DecisionFork optionA={decisionFork.optionA} optionB={decisionFork.optionB} />}
      {!artifact && feedbackSteps && <FeedbackSteps steps={feedbackSteps.steps} />}
      {!artifact && speakerSlots && <SpeakerSlots confirmed={speakerSlots.confirmed} tentative={speakerSlots.tentative} total={speakerSlots.total} />}
      {!artifact && vendorCompare && <VendorCompare vendors={vendorCompare.vendors} />}
      {!artifact && surveyDimensions && <SurveyDimensions dimensions={surveyDimensions.dimensions} />}
    </div>
  );
}
