export const CORNERS = [
  { id: 'UFR', z: ['ㄈ', 'ㄌ', 'ㄖ'], faces: ['U', 'F', 'R'] },
  { id: 'UFL', z: ['ㄅ', 'ㄉ', 'ㄒ'], faces: ['U', 'F', 'L'] },
  { id: 'UBR', z: ['ㄇ', 'ㄋ', 'ㄕ'], faces: ['U', 'B', 'R'] },
  { id: 'UBL', z: ['ㄆ', 'ㄊ', 'ㄑ'], faces: ['U', 'B', 'L'] },
  { id: 'DFR', z: ['ㄩ', 'ㄐ', 'ㄗ'], faces: ['D', 'F', 'R'] },
  { id: 'DFL', z: ['ㄙ', 'ㄍ', 'ㄓ'], faces: ['D', 'F', 'L'] },
  { id: 'DBR', z: ['ㄨ', 'ㄏ', 'ㄘ'], faces: ['D', 'B', 'R'] },
  { id: 'DBL', z: ['ㄧ', 'ㄎ', 'ㄔ'], faces: ['D', 'B', 'L'] },
];

export const EDGES = [
  { id: 'UF', z: ['ㄅ', 'ㄉ'], faces: ['U', 'F'] },
  { id: 'UB', z: ['ㄇ', 'ㄋ'], faces: ['U', 'B'] },
  { id: 'UR', z: ['ㄈ', 'ㄌ'], faces: ['U', 'R'] },
  { id: 'UL', z: ['ㄆ', 'ㄊ'], faces: ['U', 'L'] },
  { id: 'FR', z: ['ㄔ', 'ㄓ'], faces: ['F', 'R'] },
  { id: 'FL', z: ['ㄍ', 'ㄎ'], faces: ['F', 'L'] },
  { id: 'BR', z: ['ㄑ', 'ㄒ'], faces: ['B', 'R'] },
  { id: 'BL', z: ['ㄐ', 'ㄏ'], faces: ['B', 'L'] },
  { id: 'DF', z: ['ㄙ', 'ㄕ'], faces: ['D', 'F'] },
  { id: 'DR', z: ['ㄩ', 'ㄘ'], faces: ['D', 'R'] },
  { id: 'DB', z: ['ㄨ', 'ㄗ'], faces: ['D', 'B'] },
  { id: 'DL', z: ['ㄧ', 'ㄖ'], faces: ['D', 'L'] },
];

export const CORNER_BUFFER = 'UFR';
export const EDGE_BUFFER = 'UF';
