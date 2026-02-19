// Dimension tokens for the toolbar layout
export const TOOLBAR_HEIGHT = 60;
export const CELL_W = 50;
export const CELL_H = 42;
export const ICON_SIZE = 26;
export const CONTAINER_RADIUS = 24;
export const CONTAINER_PADDING = 8;
export const CHAT_INPUT_WIDTH = 246;
export const CHAT_INPUT_WIDTH_FOCUSED = 420 - CONTAINER_PADDING * 2; // 404 (420px inclusive of container padding)
export const DISCONNECTED_GAP = 16;
export const DIVIDER_SLOT_WIDTH = 18;
export const DIVIDER_HEIGHT = 44;

export const SPRING = {
  type: "spring" as const,
  stiffness: 400,
  damping: 12,
  mass: 0.8,
};

export const SPRING_DAMPED = {
  type: "spring" as const,
  stiffness: 300,
  damping: 26,
  mass: 1.2,
};
