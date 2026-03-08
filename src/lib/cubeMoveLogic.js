/**
 * cubeMoveLogic.js
 *
 * Defines all 18 basic moves (R U F L D B × normal / ' / 2).
 * Each entry: { axis, angle, filter(cubie→bool), pos(x,y,z→[nx,ny,nz]) }
 *
 * Verified transforms (right-hand coordinate system, same as Three.js):
 *   R  = clockwise from +X → rotate −90° around X → (x,y,z)→(x, z,−y)
 *   L  = clockwise from −X → rotate +90° around X → (x,y,z)→(x,−z, y)
 *   U  = clockwise from +Y → rotate −90° around Y → (x,y,z)→( z,y,−x)
 *   D  = clockwise from −Y → rotate +90° around Y → (x,y,z)→(−z,y, x)
 *   F  = clockwise from +Z → rotate −90° around Z → (x,y,z)→( y,−x,z)
 *   B  = clockwise from −Z → rotate +90° around Z → (x,y,z)→(−y, x,z)
 */

const PI  = Math.PI;
const PI2 = Math.PI / 2;

export const MOVES = {
  // ── R / L ──────────────────────────────────────────────────
  'R':  { axis: 'x', angle: -PI2, filter: c => c.cx === 1,  pos: (x,y,z) => [ x,  z, -y] },
  "R'": { axis: 'x', angle: +PI2, filter: c => c.cx === 1,  pos: (x,y,z) => [ x, -z,  y] },
  'R2': { axis: 'x', angle: -PI,  filter: c => c.cx === 1,  pos: (x,y,z) => [ x, -y, -z] },
  'L':  { axis: 'x', angle: +PI2, filter: c => c.cx === -1, pos: (x,y,z) => [ x, -z,  y] },
  "L'": { axis: 'x', angle: -PI2, filter: c => c.cx === -1, pos: (x,y,z) => [ x,  z, -y] },
  'L2': { axis: 'x', angle: +PI,  filter: c => c.cx === -1, pos: (x,y,z) => [ x, -y, -z] },

  // ── U / D ──────────────────────────────────────────────────
  'U':  { axis: 'y', angle: -PI2, filter: c => c.cy === 1,  pos: (x,y,z) => [ z,  y, -x] },
  "U'": { axis: 'y', angle: +PI2, filter: c => c.cy === 1,  pos: (x,y,z) => [-z,  y,  x] },
  'U2': { axis: 'y', angle: -PI,  filter: c => c.cy === 1,  pos: (x,y,z) => [-x,  y, -z] },
  'D':  { axis: 'y', angle: +PI2, filter: c => c.cy === -1, pos: (x,y,z) => [-z,  y,  x] },
  "D'": { axis: 'y', angle: -PI2, filter: c => c.cy === -1, pos: (x,y,z) => [ z,  y, -x] },
  'D2': { axis: 'y', angle: +PI,  filter: c => c.cy === -1, pos: (x,y,z) => [-x,  y, -z] },

  // ── F / B ──────────────────────────────────────────────────
  'F':  { axis: 'z', angle: -PI2, filter: c => c.cz === 1,  pos: (x,y,z) => [ y, -x,  z] },
  "F'": { axis: 'z', angle: +PI2, filter: c => c.cz === 1,  pos: (x,y,z) => [-y,  x,  z] },
  'F2': { axis: 'z', angle: -PI,  filter: c => c.cz === 1,  pos: (x,y,z) => [-x, -y,  z] },
  'B':  { axis: 'z', angle: +PI2, filter: c => c.cz === -1, pos: (x,y,z) => [-y,  x,  z] },
  "B'": { axis: 'z', angle: -PI2, filter: c => c.cz === -1, pos: (x,y,z) => [ y, -x,  z] },
  'B2': { axis: 'z', angle: +PI,  filter: c => c.cz === -1, pos: (x,y,z) => [-x, -y,  z] },
};

/** Return the inverse move string: R→R', R'→R, R2→R2 */
export function inverseMove(m) {
  if (m.endsWith('2')) return m;           // 180° is self-inverse
  if (m.endsWith("'")) return m.slice(0, -1); // R' → R
  return m + "'";                           // R → R'
}

/** Reverse a move array and invert each move: [A,B,C] → [C',B',A'] */
export function invertSequence(moves) {
  return [...moves].reverse().map(inverseMove);
}
