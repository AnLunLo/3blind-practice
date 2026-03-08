/**
 * Algorithm data for the 3BLD algorithm player.
 * key:  注音對 (zhuyin pair)
 * type: 'corner' | 'edge'
 * algo: algorithm string in commutator notation or flat notation
 *
 * Corner buffer = UFR (sticker ㄈ on U face)
 * Edge   buffer = UF  (sticker ㄅ on U face)
 *
 * Add more entries here as needed.
 */
export const ALGO_DATA = {
  // ── Corner pairs (buffer = UFR) ──────────────────────────────
  "ㄅㄆ": { type: 'corner', algo: "[R' D R U' : [R' D' R , U']]" },
};
