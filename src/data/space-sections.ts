/**
 * Space section definitions for the Home sidebar.
 *
 * Groups the 13 spaces into categories a CPTO would use to organise
 * their portfolio view. Each section has a label and an ordered list
 * of space IDs.
 */

export type SpaceSection = {
  label: string;
  spaceIds: string[];
};

export const SPACE_SECTIONS: SpaceSection[] = [
  {
    label: "Portfolio",
    spaceIds: [
      "space-paygrid",
      "space-firstflex",
      "space-core",
      "space-embed",
    ],
  },
  {
    label: "Programs",
    spaceIds: [
      "space-launch-q3",
      "space-brand",
      "space-kyc",
      "space-claims",
    ],
  },
  {
    label: "Operations",
    spaceIds: [
      "space-roadmaps",
      "space-epd",
      "space-revenueops",
      "space-org27",
    ],
  },
  {
    label: "Events",
    spaceIds: [
      "space-ff26",
    ],
  },
];
