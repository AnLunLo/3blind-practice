import { MOVE_MAP } from './constants';

export function parseAlgorithm(str) {
  if (!str || !str.trim()) return [];
  const tokens = str.trim().replace(/[()[\]]/g, '').split(/\s+/);
  const moves = [];

  for (const token of tokens) {
    if (!token) continue;
    let face = '';
    let modifier = '';
    let wide = false;
    let i = 0;

    const ch = token[i];
    if (MOVE_MAP[ch]) {
      face = ch;
      i++;
    } else if ('rludfb'.includes(ch)) {
      face = ch.toUpperCase();
      wide = true;
      i++;
    } else {
      continue;
    }

    if (token[i] === 'w') {
      wide = true;
      i++;
    }

    const rest = token.substring(i);
    if (rest === "'" || rest === '\u2019') modifier = "'";
    else if (rest === '2' || rest === "2'" || rest === "2\u2019") modifier = '2';

    moves.push({ face, modifier, wide });
  }
  return moves;
}

export function getMoveRotation(move) {
  const def = MOVE_MAP[move.face];
  if (!def) return null;

  let angle = def.angle;
  if (move.modifier === "'") angle = -angle;
  else if (move.modifier === '2') angle = angle * 2;

  let layers;
  if (def.layer === null) {
    layers = [-1, 0, 1];
  } else if (move.wide && 'RLUDFB'.includes(move.face)) {
    layers = def.layer === 1 ? [0, 1] : def.layer === -1 ? [-1, 0] : [def.layer];
  } else {
    layers = [def.layer];
  }

  return { axis: def.axis, layers, angle };
}

export function moveToString(move) {
  return move.face + (move.wide ? 'w' : '') + move.modifier;
}
