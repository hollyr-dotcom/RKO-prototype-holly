/** People present in each space — avatars shown in the header meta row */
export const SPACE_MEMBERS: Record<string, { avatars: string[]; count: number }> = {
  "space-ff26": {
    avatars: ["/avatars/sarah-chen.png", "/avatars/kyra-osei.png", "/avatars/marcus-chen.png"],
    count: 6,
  },
  "space-firstflex": {
    avatars: ["/avatars/priya-sharma.png", "/avatars/jordan-lee.png"],
    count: 4,
  },
  "space-1on1-james": {
    avatars: ["/avatars/james-rodriguez.png"],
    count: 2,
  },
  "space-1on1-amara": {
    avatars: ["/avatars/amara-okafor.png"],
    count: 2,
  },
  "space-1on1-daniel": {
    avatars: ["/avatars/daniel-park.png"],
    count: 2,
  },
};
