/**
 * Module-level page transition direction tracker.
 * Pages set direction before router.push(), layout reads it during render.
 */

let _direction = 1;

/** Set the navigation direction: 1 = down (home→tasks), -1 = up (tasks→home) */
export function setPageTransitionDirection(d: number) {
  _direction = d;
}

/** Read the current navigation direction */
export function getPageTransitionDirection() {
  return _direction;
}
