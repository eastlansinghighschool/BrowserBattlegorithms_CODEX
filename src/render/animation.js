export function easeInOutQuad(t) {
  let normalized = t / 0.5;
  if (normalized < 1) {
    return 0.5 * normalized * normalized;
  }
  normalized -= 1;
  return -0.5 * (normalized * (normalized - 2) - 1);
}
