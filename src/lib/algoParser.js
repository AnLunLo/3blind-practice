/**
 * algoParser.js
 *
 * Parses algorithm strings into flat move arrays.
 *
 * Supported notation:
 *   - Flat moves:       R U R' U'  →  ['R','U',"R'","U'"]
 *   - Commutator [A,B]: expands to  A B A' B'
 *   - Conjugate  [A:B]: expands to  A B A'
 *   - Nested:    [A : [B , C]]
 *
 * Example:
 *   parseAlgo("[R' D R U' : [R' D' R , U']]")
 *   → ["R'","D","R","U'","R'","D'","R","U'","R'","D","R","U","U","R'","D'","R"]
 */

import { invertSequence } from './cubeMoveLogic.js';

/**
 * Tokenise an algorithm string into flat move tokens and bracket characters.
 * e.g. "[R' D R : U']" → ['[', "R'", 'D', 'R', ':', "U'", ']']
 */
function tokenise(str) {
  const tokens = [];
  let i = 0;
  while (i < str.length) {
    const ch = str[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (ch === '[' || ch === ']' || ch === ',' || ch === ':') {
      tokens.push(ch); i++; continue;
    }
    // Move token: letter optionally followed by ' and/or 2
    // Handles: R, R', R2, R2' (treated as R2)
    if (/[RUFLDBrufldbesxyzME]/.test(ch)) {
      let tok = ch; i++;
      if (str[i] === 'w') { tok += 'w'; i++; } // wide moves (ignored for now)
      if (str[i] === '2') { tok += '2'; i++; }
      if (str[i] === "'") { tok += "'"; i++; }
      tokens.push(tok);
      continue;
    }
    i++; // skip unknown characters
  }
  return tokens;
}

/**
 * Recursive parser that operates on the token array.
 * Returns { moves: string[], consumed: number }
 */
function parseTokens(tokens, start) {
  const moves = [];
  let i = start;

  while (i < tokens.length) {
    const tok = tokens[i];

    if (tok === '[') {
      // Parse bracketed expression
      const result = parseBracket(tokens, i);
      moves.push(...result.moves);
      i = result.end;
    } else if (tok === ']' || tok === ',' || tok === ':') {
      // Stop — caller handles these
      break;
    } else {
      // Plain move token — only include supported moves
      moves.push(tok);
      i++;
    }
  }

  return { moves, end: i };
}

/**
 * Parse a bracketed group starting at tokens[start] (which should be '[').
 * Returns { moves: string[], end: number } where end points past the ']'.
 */
function parseBracket(tokens, start) {
  // start points to '['
  let i = start + 1;

  // Parse left-hand side (up to ',' or ':')
  const left = parseTokens(tokens, i);
  i = left.end;

  const sep = tokens[i]; // ',' or ':'
  i++; // skip separator

  // Parse right-hand side (up to ']')
  const right = parseTokens(tokens, i);
  i = right.end;

  // Skip closing ']'
  if (tokens[i] === ']') i++;

  let moves;
  if (sep === ',') {
    // Commutator [A, B] = A B A' B'
    moves = [
      ...left.moves,
      ...right.moves,
      ...invertSequence(left.moves),
      ...invertSequence(right.moves),
    ];
  } else {
    // Conjugate [A : B] = A B A'
    moves = [
      ...left.moves,
      ...right.moves,
      ...invertSequence(left.moves),
    ];
  }

  return { moves, end: i };
}

/**
 * Parse an algorithm string (flat or commutator notation) into a flat
 * array of move strings supported by MOVES in cubeMoveLogic.js.
 *
 * Unknown/unsupported tokens (wide moves, slice moves, etc.) are filtered out.
 *
 * @param {string} str
 * @returns {string[]}
 */
export function parseAlgo(str) {
  if (!str || !str.trim()) return [];
  const tokens = tokenise(str.trim());
  const { moves } = parseTokens(tokens, 0);
  // Filter to only RUFLDB × normal/'/2 (18 moves)
  const VALID = new Set([
    'R',"R'",'R2','L',"L'",'L2',
    'U',"U'",'U2','D',"D'",'D2',
    'F',"F'",'F2','B',"B'",'B2',
  ]);
  return moves.filter(m => VALID.has(m));
}
