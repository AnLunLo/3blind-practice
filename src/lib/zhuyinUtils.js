import { CORNERS, EDGES, CORNER_BUFFER, EDGE_BUFFER } from '../data/pieces.js';

/**
 * Build the full question pool from CORNERS + EDGES zhuyin combinations.
 * Returns [{pair, word}] for all pairs that exist in memoTable.
 */
export function getAllPairs(memoTable) {
  const pool = [], seen = new Set();
  function addPieces(pieces) {
    pieces.forEach(p => {
      for (let i = 0; i < p.z.length; i++) {
        for (let j = 0; j < p.z.length; j++) {
          if (i === j) continue;
          const key = p.z[i] + p.z[j];
          if (seen.has(key)) continue;
          seen.add(key);
          const word = memoTable[key];
          if (word) pool.push({ pair: key, word });
        }
      }
    });
  }
  addPieces(CORNERS);
  addPieces(EDGES);
  return pool;
}

/**
 * Get the ordered sequence of zhuyin chars for a piece type,
 * excluding the buffer piece.
 */
export function getSeq(pieces, buf) {
  return pieces.filter(p => p.id !== buf).map(p => p.z[0]);
}

/**
 * Group a sequence of zhuyin chars into pairs and look up mnemonic words.
 * Returns [{a, b, word}]
 */
export function makePairs(seq, memoTable) {
  const r = [];
  for (let i = 0; i < seq.length; i += 2) {
    const a = seq[i], b = seq[i + 1] || '';
    r.push({ a, b, word: memoTable[a + b] || memoTable[b + a] || '' });
  }
  return r;
}

/**
 * Format milliseconds to "Xm YY.Zs"
 */
export function fmtTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = String(s % 60).padStart(2, '0');
  const tenth = Math.floor((ms % 1000) / 100);
  return `${m ? m + 'm ' : ''}${sec}.${tenth}s`;
}

/**
 * Build a map of zhuyin char → { corner, edge } sticker info.
 * Used by the Identify tab to know which pieces a char appears on.
 */
export function buildCharMap() {
  const FI = { R: 0, L: 1, U: 2, D: 3, F: 4, B: 5 };
  const charMap = {};

  function getPos(id) {
    return {
      cx: id.includes('R') ? 1 : id.includes('L') ? -1 : 0,
      cy: id.includes('U') ? 1 : id.includes('D') ? -1 : 0,
      cz: id.includes('F') ? 1 : id.includes('B') ? -1 : 0,
    };
  }

  CORNERS.forEach(p => {
    p.z.forEach((zh, si) => {
      if (!charMap[zh]) charMap[zh] = {};
      const { cx, cy, cz } = getPos(p.id);
      charMap[zh].corner = {
        char: zh, kind: 'corner', pieceId: p.id,
        faceName: p.faces[si], faceIdx: FI[p.faces[si]],
        cx, cy, cz,
      };
    });
  });

  EDGES.forEach(p => {
    p.z.forEach((zh, si) => {
      if (!charMap[zh]) charMap[zh] = {};
      const { cx, cy, cz } = getPos(p.id);
      charMap[zh].edge = {
        char: zh, kind: 'edge', pieceId: p.id,
        faceName: p.faces[si], faceIdx: FI[p.faces[si]],
        cx, cy, cz,
      };
    });
  });

  return charMap;
}

/**
 * Build the pool of identify quiz questions:
 * only chars that appear in both a corner and an edge piece.
 */
export function getIdentifyPool() {
  const charMap = buildCharMap();
  return Object.entries(charMap)
    .filter(([, v]) => v.corner && v.edge)
    .map(([ch, v]) => ({ char: ch, targets: [v.corner, v.edge] }));
}
