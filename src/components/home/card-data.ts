import type { FeedItemType } from "@/types/feed";

export interface FanCardData {
  id: string;
  title: string;
  /** Feed item type — drives the header icon */
  type: FeedItemType;
  /** Space name shown as context label */
  spaceName: string;
  /** Source user avatar URL (if human) */
  avatar?: string;
  /** Source user name (if human) */
  sourceName?: string;
  /** Whether the source is an AI agent */
  isAgent: boolean;
  /** Shiny effect on hover: "holographic" = rainbow, "gold" = warm gold shimmer */
  shiny?: "holographic" | "gold";
}

export interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  text: string;
  delay: number;
}

export const attentionCards: FanCardData[] = [
  {
    id: "feed-core-01",
    title: "FirstFlex and PayGrid are competing for the same team capacity",
    type: "agent-opportunity",
    spaceName: "Core Banking Migration",
    isAgent: true,
  },
  {
    id: "feed-roadmap-talktrack-01",
    title: "Marcus shared the FlexFund Q2 roadmap Talktrack for your sign-off",
    type: "talktrack",
    spaceName: "Roadmaps",
    avatar: "/avatars/marcus-chen.png",
    sourceName: "Marcus Chen",
    isAgent: false,
    shiny: "holographic",
  },
  {
    id: "feed-decision-01",
    title: "Full rollout approved across all risk tiers",
    type: "decision",
    spaceName: "KYC Onboarding",
    isAgent: false,
    avatar: "/avatars/sarah-chen.png",
    sourceName: "Sarah Chen",
    shiny: "gold",
  },
  {
    id: "feed-pq3-01",
    title: "Timeline conflict — PayGrid API and mobile release share engineering",
    type: "agent-opportunity",
    spaceName: "PayGrid",
    isAgent: true,
  },
];

export const teamCards: FanCardData[] = [
  {
    id: "feed-ff-04",
    title: "Screening timeout fix deployed to production",
    type: "agent-completed",
    spaceName: "FlexFund",
    isAgent: true,
  },
  {
    id: "feed-decision-01",
    title: "Full rollout approved across all risk tiers",
    type: "decision",
    spaceName: "KYC Onboarding",
    isAgent: false,
    avatar: "/avatars/sarah-chen.png",
    sourceName: "Sarah Chen",
    shiny: "gold",
  },
  {
    id: "feed-team-marcus",
    title: "Marcus Chen promoted to VP of Product — EPD Leadership",
    type: "team-announcement",
    spaceName: "EPD Leadership",
    isAgent: false,
    avatar: "/avatars/marcus-chen.png",
    sourceName: "Marcus Chen",
  },
];

export const cardChat: Record<string, ChatMessage[]> = {
  "feed-core-01": [
    { id: "m1", role: "assistant", text: "I've flagged a resource conflict — both FirstFlex and PayGrid are pulling from the same engineering capacity this sprint.", delay: 400 },
    { id: "m2", role: "assistant", text: "**Impact:** If unresolved, PayGrid API delivery slips by 2 weeks, which cascades into the mobile release.", delay: 1600 },
    { id: "m3", role: "assistant", text: "I'd recommend a quick prioritisation call with Priya and Marcus. Want me to set that up?", delay: 3000 },
  ],
  "feed-roadmap-talktrack-01": [
    { id: "m1", role: "assistant", text: "Marcus has prepared a talk track walking through the Q2 roadmap priorities. He's requesting your sign-off before the all-hands on Friday.", delay: 400 },
    { id: "m2", role: "assistant", text: "**Key items covered:**\n• FlexFund growth targets — 30% ARR increase\n• PayGrid enterprise rollout — 6 markets\n• Core Banking migration Phase 2", delay: 1600 },
    { id: "m3", role: "assistant", text: "The deck is 12 minutes long. Would you like me to summarise the key decision points first?", delay: 3000 },
  ],
  "feed-pq3-01": [
    { id: "m1", role: "assistant", text: "The PayGrid API sprint and mobile release are both scheduled for the same week, and they share 3 senior engineers.", delay: 400 },
    { id: "m2", role: "assistant", text: "**Options:**\n• Stagger the releases by 1 week (lowest risk)\n• Bring in a contractor for the mobile work\n• Descope 2 API endpoints to the following sprint", delay: 1600 },
    { id: "m3", role: "assistant", text: "Priya flagged this as urgent — she needs a decision by Wednesday. Want me to schedule a 15-min sync?", delay: 3000 },
  ],
  "feed-ff-04": [
    { id: "m1", role: "assistant", text: "The screening timeout fix has been deployed to production. Response times are back within SLA.", delay: 400 },
    { id: "m2", role: "assistant", text: "**Results:** P95 latency dropped from 4.2s to 0.8s. No errors in the last 2 hours.", delay: 1600 },
    { id: "m3", role: "assistant", text: "The engineering team also identified a related issue in the batch processor — they've added it to the next sprint.", delay: 3000 },
  ],
  "feed-decision-01": [
    { id: "m1", role: "assistant", text: "Sarah Chen approved the full rollout across all risk tiers. The decision was based on pilot results showing 4 of 5 targets met.", delay: 400 },
    { id: "m2", role: "assistant", text: "**Conditions:**\n• Weekly monitoring for the first 4 weeks\n• Auto-rollback threshold set at 5% error rate\n• Compliance sign-off confirmed", delay: 1600 },
    { id: "m3", role: "assistant", text: "Implementation starts Monday. Want me to flag this to the engineering leads?", delay: 3000 },
  ],
  "feed-team-marcus": [
    { id: "m1", role: "assistant", text: "Marcus Chen has been promoted to VP of Product within the EPD Leadership team.", delay: 400 },
    { id: "m2", role: "assistant", text: "He'll be taking on broader responsibility for the consumer product portfolio, including FirstFlex and the new youth banking initiative.", delay: 1600 },
    { id: "m3", role: "assistant", text: "This was announced internally today. Would you like me to draft a congratulatory note?", delay: 3000 },
  ],
};
