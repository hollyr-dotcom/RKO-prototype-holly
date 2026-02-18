// Feed item types for the Space Activity Feed

export type FeedItemType =
  | "agent-opportunity"
  | "agent-completed"
  | "collaboration-request"
  | "workflow-change"
  | "alert-fyi"
  | "key-metric"
  | "chart"
  | "decision"
  | "approval"
  | "team-announcement"
  | "live-session"
  | "competitor-threat"
  | "feedback-request"
  | "budget-request"
  | "budget-notification";

export interface Reaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface FeedAction {
  id: string;
  label: string;
  variant: "primary" | "secondary" | "ghost";
}

export interface ArtifactPreview {
  type:
    | "canvas"
    | "document"
    | "table"
    | "frame"
    | "slides"
    | "kanban"
    | "timeline"
    | "prototype"
    | "journey-map"
    | "diagram"
    | "flow"
    | "activity";
  id: string;
  name: string;
}

export interface FeedSource {
  userId: string;
  isAgent: boolean;
}

export interface VisualPreview {
  type: string;
  data: Record<string, unknown>;
}

export interface FeedItemBase {
  id: string;
  type: FeedItemType;
  spaceId: string;
  spaceName?: string;
  canvasId?: string;
  source: FeedSource;
  title: string;
  body: string;
  timestamp: string;
  isRead: boolean;
  priority: "high" | "medium" | "low";
  reactions: Reaction[];
  viewCount?: number;
  actions: FeedAction[];
  visualPreview?: VisualPreview;
}

// Type-specific payloads

export interface AgentOpportunityPayload {
  // Optional visualization data - each card can have its own bespoke visual
  forecast?: {
    days: Array<{
      day: string;
      condition: "rain" | "storm" | "cloudy" | "sunny";
    }>;
  };
  capacity?: {
    venue: number;
    expected: number;
    overflow: number;
  };
  capacityConflict?: {
    venue: number;
    expected: number;
    overflow: number;
  };
  confidence?: number;
  convergence?: {
    sources: Array<{ label: string; color: string }>;
    target: { label: string; color: string };
  };
  stalled?: {
    days: number;
  };
  invitationStall?: {
    invitations: number;
    days: number;
  };
}

export interface AgentCompletedPayload {
  artifact: ArtifactPreview;
  completionSummary: string;
  timeSpent?: string;
  changesCount?: number;
  // Visual-specific optional fields
  matrixGrid?: {
    rows: number;
    cols: number;
    label: string;
  };
  workstreamBars?: {
    streams: Array<{ label: string; progress: number }>;
    blockers: number;
  };
  scheduleGrid?: {
    sessions: number;
    tracks: number;
  };
  travelMap?: {
    attendees: number;
    hotels: number;
    transfers: number;
  };
}

export interface CollaborationRequestPayload {
  requestType: "feedback" | "decision" | "input" | "review";
  dueDate?: string;
  mentionedUsers: string[];
  artifact?: ArtifactPreview;
  // Visual-specific optional fields
  reviewChecklist?: {
    sections: Array<{ label: string; status: "reviewed" | "pending" | "flagged" }>;
  };
  optionCards?: {
    options: Array<{ label: string; color: string }>;
  };
  decisionFork?: {
    optionA: string;
    optionB: string;
  };
  feedbackSteps?: {
    steps: Array<{ label: string; complete: boolean }>;
  };
  speakerSlots?: {
    confirmed: number;
    tentative: number;
    total: number;
  };
  vendorCompare?: {
    vendors: Array<{ name: string; score: number }>;
  };
  surveyDimensions?: {
    dimensions: Array<{ label: string; color: string }>;
  };
}

export interface WorkflowChangePayload {
  fromStatus: string;
  toStatus: string;
  implication: string;
  artifact?: ArtifactPreview;
  // Visual-specific optional fields
  reviewPipeline?: {
    stages: Array<{ label: string; active: boolean }>;
  };
  approvalStamp?: {
    icon: "budget" | "strategy" | "identity" | "cfo";
  };
  signedSeal?: {
    documentType: string;
  };
}

export interface AlertFYIPayload {
  alertType?: "weather" | "travel" | "general";
  forecast?: {
    days: Array<{
      day: string;
      condition: "rain" | "storm" | "cloudy" | "sunny";
    }>;
  };
}

export interface KeyMetricPayload {
  metric: string;
  value: string;
  trend: "up" | "down" | "flat";
  changePercent: number;
  period: string;
}

export interface ChartPayload {
  chartType: "bar" | "line" | "donut" | "pie";
  title: string;
  data: Record<string, unknown>;
}

export interface DecisionPayload {
  status: "needed" | "made";
  options?: string[];
  chosenOption?: string;
  deadline?: string;
  decidedBy?: string;
}

export interface ApprovalPayload {
  status: "needed" | "given" | "rejected";
  approver?: string;
  subject: string;
  conditions?: string[];
}

export interface TeamAnnouncementPayload {
  person: {
    name: string;
    role: string;
    department: string;
    startDate?: string;
  };
  announcementType: "new-hire" | "promotion" | "departure";
}

export interface LiveSessionPayload {
  sessionType: "workshop" | "review" | "standup" | "brainstorm";
  participants: string[];
  startedAt: string;
  artifact?: ArtifactPreview;
}

export interface CompetitorThreatPayload {
  competitor: string;
  threatLevel: "high" | "medium" | "low";
  summary: string;
}

export interface FeedbackRequestPayload {
  requestType: "feedback" | "review" | "input";
  artifact?: ArtifactPreview;
  dueDate?: string;
  from: string;
}

export interface BudgetRequestPayload {
  amount: string;
  category: string;
  status: "pending" | "approved" | "rejected";
  requestedBy: string;
}

export interface BudgetNotificationPayload {
  category: string;
  currentSpend: string;
  budget: string;
  percentUsed: number;
  alert?: string;
}

// Discriminated union
export type FeedItem =
  | (FeedItemBase & { type: "agent-opportunity"; payload: AgentOpportunityPayload })
  | (FeedItemBase & { type: "agent-completed"; payload: AgentCompletedPayload })
  | (FeedItemBase & { type: "collaboration-request"; payload: CollaborationRequestPayload })
  | (FeedItemBase & { type: "workflow-change"; payload: WorkflowChangePayload })
  | (FeedItemBase & { type: "alert-fyi"; payload: AlertFYIPayload })
  | (FeedItemBase & { type: "key-metric"; payload: KeyMetricPayload })
  | (FeedItemBase & { type: "chart"; payload: ChartPayload })
  | (FeedItemBase & { type: "decision"; payload: DecisionPayload })
  | (FeedItemBase & { type: "approval"; payload: ApprovalPayload })
  | (FeedItemBase & { type: "team-announcement"; payload: TeamAnnouncementPayload })
  | (FeedItemBase & { type: "live-session"; payload: LiveSessionPayload })
  | (FeedItemBase & { type: "competitor-threat"; payload: CompetitorThreatPayload })
  | (FeedItemBase & { type: "feedback-request"; payload: FeedbackRequestPayload })
  | (FeedItemBase & { type: "budget-request"; payload: BudgetRequestPayload })
  | (FeedItemBase & { type: "budget-notification"; payload: BudgetNotificationPayload });
