import * as THREE from 'three';
import { CORNERS, EDGES } from '../data/pieces.js';
import { FACE_COLOR_HEX, FI } from '../data/constants.js';

// Module-level singleton — built once, reused by both cube instances
let STICKER_MAP = null;

/**
 * Build map: zhuyin_char → [{cx, cy, cz, face, faceIdx}]
 */
export function buildStickerMap() {
  if (STICKER_MAP) return STICKER_MAP;
  STICKER_MAP = {};

  const allPieces = [
    ...CORNERS.map(p => ({ ...p, kind: 'corner' })),
    ...EDGES.map(p => ({ ...p, kind: 'edge' })),
  ];

  allPieces.forEach(p => {
    p.z.forEach((zh, si) => {
      const face = p.faces[si];
      const id = p.id;
      const cx = id.includes('R') ? 1 : id.includes('L') ? -1 : 0;
      const cy = id.includes('U') ? 1 : id.includes('D') ? -1 : 0;
      const cz = id.includes('F') ? 1 : id.includes('B') ? -1 : 0;
      if (!STICKER_MAP[zh]) STICKER_MAP[zh] = [];
      STICKER_MAP[zh].push({ cx, cy, cz, face, faceIdx: FI[face] });
    });
  });

  return STICKER_MAP;
}

/**
 * Build all 26 cubies for a Three.js scene.
 * Returns { group, cubies }
 * cubies: [{mesh, cx, cy, cz, mats, asgn}] — non-center pieces only
 */
export function buildCubies() {
  const group = new THREE.Group();
  const cubies = [];

  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        if (!x && !y && !z) continue;
        const isCenterPiece = (x === 0 && y === 0) || (x === 0 && z === 0) || (y === 0 && z === 0);
        const geo = new THREE.BoxGeometry(0.93, 0.93, 0.93);
        const mats = Array(6).fill(null).map(() =>
          new THREE.MeshStandardMaterial({ color: 0x181818, transparent: true, opacity: 0.15, roughness: 0.6 })
        );
        const asgn = [
          x === 1 ? 'R' : null,
          x === -1 ? 'L' : null,
          y === 1 ? 'U' : null,
          y === -1 ? 'D' : null,
          z === 1 ? 'F' : null,
          z === -1 ? 'B' : null,
        ];
        asgn.forEach((face, i) => {
          if (!face) return;
          if (isCenterPiece) {
            mats[i] = new THREE.MeshStandardMaterial({
              color: FACE_COLOR_HEX[face], transparent: false, opacity: 1.0, roughness: 0.3,
            });
          } else {
            mats[i] = new THREE.MeshStandardMaterial({
              color: FACE_COLOR_HEX[face], transparent: true, opacity: 0.22, roughness: 0.4,
            });
          }
        });
        const mesh = new THREE.Mesh(geo, mats);
        mesh.position.set(x * 1.02, y * 1.02, z * 1.02);
        group.add(mesh);
        if (!isCenterPiece) cubies.push({ mesh, cx: x, cy: y, cz: z, mats, asgn });
      }
    }
  }

  return { group, cubies };
}

/**
 * Highlight all stickers for a zhuyin pair on the quiz cube.
 * Dims all other stickers.
 */
export function highlightPair(cubies, pair) {
  const stickerMap = buildStickerMap();
  const highlighted = new Set();

  for (const ch of pair) {
    const stickers = stickerMap[ch] || [];
    stickers.forEach(s => highlighted.add(`${s.cx},${s.cy},${s.cz},${s.faceIdx}`));
  }

  cubies.forEach(({ cx, cy, cz, mats, asgn }) => {
    asgn.forEach((face, i) => {
      if (!face) return;
      const key = `${cx},${cy},${cz},${i}`;
      const isHit = highlighted.has(key);
      mats[i].color.setHex(isHit ? FACE_COLOR_HEX[face] : 0x111111);
      mats[i].opacity = isHit ? 1.0 : 0.15;
      mats[i].emissive = isHit
        ? new THREE.Color(FACE_COLOR_HEX[face]).multiplyScalar(0.3)
        : new THREE.Color(0x000000);
    });
  });
}

/**
 * Reset all non-center cubies to their dim default state.
 */
export function resetColors(cubies) {
  cubies.forEach(({ mats, asgn }) => {
    asgn.forEach((face, i) => {
      if (!face) return;
      mats[i].color.setHex(FACE_COLOR_HEX[face]);
      mats[i].opacity = 0.22;
      if (mats[i].emissive) mats[i].emissive.set(0x000000);
    });
  });
}

/**
 * Flash a sticker red (wrong answer) then restore.
 */
export function flashWrong(mat, originalHex, originalOpacity) {
  mat.color.setHex(0xff3333);
  mat.opacity = 1.0;
  mat.emissive = new THREE.Color(0xff3333).multiplyScalar(0.5);
  setTimeout(() => {
    mat.color.setHex(originalHex);
    mat.opacity = originalOpacity;
    mat.emissive.set(0x000000);
  }, 400);
}

/**
 * Light up a sticker green (correct answer).
 */
export function lightGreen(mat, faceName) {
  mat.color.setHex(FACE_COLOR_HEX[faceName]);
  mat.opacity = 1.0;
  mat.emissive = new THREE.Color(0x44ff88).multiplyScalar(0.5);
}
