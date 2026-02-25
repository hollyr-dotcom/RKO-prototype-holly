/**
 * Sidebar widget data for 1:1 spaces.
 *
 * Each space maps to the props for three widget types:
 *   - goals:     GoalsWidget (OKR/objective tracker)
 *   - stats:     StatsWidget (two stat cards side by side)
 *   - decisions: AwaitingDecisionWidget (pending decisions list)
 */

import type { GoalItem, StatItem, DecisionItem } from "@/components/sidebar-widgets";

export interface SpaceSidebarData {
  goals: GoalItem[];
  stats: [StatItem, StatItem];
  decisions: DecisionItem[];
}

export const SIDEBAR_WIDGET_DATA: Record<string, SpaceSidebarData> = {
  /* ── James Rodriguez — VP Engineering ─────────────────────────── */
  "space-1on1-james": {
    goals: [
      {
        title: "Reduce engineering team attrition to below 8% annualised",
        type: "objective",
        progress: 45,
      },
      {
        title: "Complete Core Banking Phase 2 system integration by April",
        type: "objective",
        progress: 38,
      },
      {
        title: "Improve platform P95 latency to under 200ms across all APIs",
        type: "key-result",
        progress: 62,
      },
    ],
    stats: [
      {
        label: "Budget",
        value: "78%",
        change: "+6pts vs Jan",
        changeColor: "green",
      },
      {
        label: "Headcount",
        value: "92%",
        change: "2",
        changeColor: "neutral",
        secondary: "open reqs",
      },
    ],
    decisions: [
      {
        avatarInitials: "JR",
        title: "Core Banking Phase 2 staffing — reassign 2 seniors from PayGrid",
        description: "Approve reallocation or hire contractors?",
        badge: "Critical path",
        badgeColor: "red",
      },
      {
        avatarInitials: "JR",
        title: "Platform Lead role — promote Li Wei internally or external hire",
        description: "Backfill needed before March 14 departure",
        badge: "£140K+ impact",
        badgeColor: "orange",
      },
    ],
  },

  /* ── Amara Okafor — Head of Design ────────────────────────────── */
  "space-1on1-amara": {
    goals: [
      {
        title: "Increase design system adoption from 67% to 85% by Q3",
        type: "objective",
        progress: 67,
      },
      {
        title: "Establish embedded design model across product squads",
        type: "objective",
        progress: 22,
      },
      {
        title: "Deliver Brand Refresh identity concepts for board sign-off",
        type: "key-result",
        progress: 75,
      },
    ],
    stats: [
      {
        label: "Budget",
        value: "91%",
        change: "Renewal due",
        changeColor: "red",
      },
      {
        label: "Capacity",
        value: "112%",
        change: "1",
        changeColor: "red",
        secondary: "over",
        arrow: "up",
      },
    ],
    decisions: [
      {
        avatarInitials: "AO",
        title: "Hire senior product designer vs UX researcher for Q2 headcount",
        description: "One open position — competing needs",
        badge: "Embedded Finance blocked",
        badgeColor: "red",
      },
      {
        avatarInitials: "AO",
        title: "Approve embedded design model pilot — PayGrid and KYC squads",
        description: "8-week trial with engineering leads",
        badge: "Org change",
        badgeColor: "blue",
      },
    ],
  },

  /* ── Daniel Park — Engineering Lead ───────────────────────────── */
  "space-1on1-daniel": {
    goals: [
      {
        title: "Restore sprint completion rate from 72% back to 85% target",
        type: "objective",
        progress: 72,
      },
      {
        title: "Eliminate single points of failure — cross-train 3 critical systems",
        type: "objective",
        progress: 15,
      },
      {
        title: "Deliver auth API refactor for KYC Phase 2 dependency by March 15",
        type: "key-result",
        progress: 40,
      },
    ],
    stats: [
      {
        label: "Budget",
        value: "85%",
        change: "Load test spike",
        changeColor: "neutral",
      },
      {
        label: "Velocity",
        value: "72%",
        change: "-12%",
        changeColor: "red",
        secondary: "3 sprints",
        arrow: "down",
      },
    ],
    decisions: [
      {
        avatarInitials: "DP",
        title: "Embedded Finance API — monolith optimisation vs microservices",
        description: "Architecture decision needed this sprint",
        badge: "12-week impact",
        badgeColor: "orange",
      },
      {
        avatarInitials: "DP",
        title: "QCon London — approve conference attendance for 4 engineers",
        description: "£7.2K total cost, March 24-26",
        badge: "£7.2K",
        badgeColor: "orange",
      },
    ],
  },
};
