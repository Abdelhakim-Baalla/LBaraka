// Motion language (Emil Kowalski rules, adapted to React Native):
// entering -> ease-out, on-screen movement -> ease-in-out, UI < 300ms,
// press feedback scale 0.97 @ 160ms, entrances never from scale(0),
// group entrances staggered 30-80ms, transform/opacity only.
export const motion = {
  pressScale: 0.97,
  pressMs: 160,
  enterMs: 240,
  modalMs: 320,
  staggerMs: 60,
  // RN Easing equivalents of the strong custom curves
  easeOut: 'ease-out' as const,
  easeInOut: 'ease-in-out' as const,
} as const;
