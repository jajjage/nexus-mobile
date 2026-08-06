/**
 * Compares two semantic version strings (e.g. "1.69.0" vs "1.0.1").
 * Returns:
 *  -1 if v1 < v2
 *   0 if v1 === v2
 *   1 if v1 > v2
 */
export function compareSemver(v1: string, v2: string): number {
  const p1 = v1.replace(/^v/, '').split('.').map((x) => parseInt(x, 10) || 0);
  const p2 = v2.replace(/^v/, '').split('.').map((x) => parseInt(x, 10) || 0);

  const len = Math.max(p1.length, p2.length);
  for (let i = 0; i < len; i++) {
    const n1 = p1[i] || 0;
    const n2 = p2[i] || 0;
    if (n1 < n2) return -1;
    if (n1 > n2) return 1;
  }
  return 0;
}

export function isVersionLower(current: string, target: string): boolean {
  return compareSemver(current, target) < 0;
}
