export const FIRSTFLEX_WIDGETS = {
  raci: {
    title: "RACI",
    members: [
      { name: "Sarah Chen", avatar: "/avatars/sarah-chen.png", role: "R", roleColor: "coral" as const },
      { name: "Priya Sharma", avatar: "/avatars/priya-sharma.png", role: "R", roleColor: "coral" as const },
      { name: "Marcus Chen", avatar: "/avatars/marcus-chen.png", role: "R", roleColor: "coral" as const },
      { name: "Jordan Lee", avatar: "/avatars/jordan-lee.png", role: "A", roleColor: "lavender" as const },
      { name: "Amy Chen", avatar: "/avatars/amy-chen.png", role: "A", roleColor: "lavender" as const },
      { name: "David Kim", avatar: "/avatars/david-kim.png", role: "A", roleColor: "lavender" as const },
    ],
  },
  nextMilestone: {
    title: "Next Milestone",
    name: "Solutions Review",
    date: "May 21st",
  },
  lastMilestone: {
    title: "Last Milestone",
    name: "Early Concepts Review",
    date: "May 21st",
  },
};

export const FF26_WIDGETS = {
  countdown: {
    title: "Countdown to FF26  🎉",
    targetDate: "2026-03-21T09:00:00Z",
  },
  attendees: {
    title: "Attendees",
    stats: [
      { value: 321, label: "Confirmed", highlight: true },
      { value: 21, label: "Maybe" },
      { value: 12, label: "Can't attend" },
    ],
  },
  staff: {
    title: "Staff",
    members: [
      { name: "Sarah Chen", avatar: "/avatars/sarah-chen.png", role: "R", roleColor: "coral" as const },
      { name: "Kyra Osei", avatar: "/avatars/kyra-osei.png", role: "R", roleColor: "coral" as const },
      { name: "Marcus Chen", avatar: "/avatars/marcus-chen.png", role: "R", roleColor: "coral" as const },
      { name: "Priya Sharma", avatar: "/avatars/priya-sharma.png", role: "A", roleColor: "lavender" as const },
      { name: "Jordan Lee", avatar: "/avatars/jordan-lee.png", role: "A", roleColor: "lavender" as const },
      { name: "Amy Chen", avatar: "/avatars/amy-chen.png", role: "A", roleColor: "lavender" as const },
    ],
  },
  vibeCheck: {
    title: "Vibe check",
    responses: [
      { avatar: "/avatars/sarah-chen.png", position: 35, offsetY: -12 },
      { avatar: "/avatars/kyra-osei.png", position: 45, offsetY: 6 },
      { avatar: "/avatars/marcus-chen.png", position: 58, offsetY: -4 },
      { avatar: "/avatars/jordan-lee.png", position: 78, offsetY: 1 },
    ],
  },
};
