export const FACE_COLOR = {
  U: '#f0f0f0',
  D: '#ffd200',
  F: '#2d9e4f',
  B: '#457b9d',
  R: '#e63946',
  L: '#ff7b1c',
};

export const FACE_COLOR_HEX = {
  U: 0xf0f0f0,
  D: 0xffd200,
  F: 0x2d9e4f,
  B: 0x457b9d,
  R: 0xe63946,
  L: 0xff7b1c,
};

// BoxGeometry face indices: +x=0(R), -x=1(L), +y=2(U), -y=3(D), +z=4(F), -z=5(B)
export const FI = { R: 0, L: 1, U: 2, D: 3, F: 4, B: 5 };

export const ZHUYIN_ORDER = [
  'ㄅ','ㄆ','ㄇ','ㄈ','ㄉ','ㄊ','ㄋ','ㄌ',
  'ㄍ','ㄎ','ㄏ','ㄐ','ㄑ','ㄒ','ㄓ','ㄔ',
  'ㄕ','ㄖ','ㄗ','ㄘ','ㄙ','ㄧ','ㄨ','ㄩ',
];


export const COLORS = {
  R: 0xb71234, // Red - right (+X)
  O: 0xff5800, // Orange - left (-X)
  W: 0xffffff, // White - top (+Y)
  Y: 0xffd500, // Yellow - bottom (-Y)
  G: 0x009b48, // Green - front (+Z)
  B: 0x0046ad, // Blue - back (-Z)
  X: 0x111111, // Internal
};

// Each move: axis to rotate around, which layer(s), angle in radians
// Angles derived from standard Singmaster notation
export const MOVE_MAP = {
  R: { axis: 'x', layer: 1, angle: -Math.PI / 2 },
  L: { axis: 'x', layer: -1, angle: Math.PI / 2 },
  U: { axis: 'y', layer: 1, angle: -Math.PI / 2 },
  D: { axis: 'y', layer: -1, angle: Math.PI / 2 },
  F: { axis: 'z', layer: 1, angle: -Math.PI / 2 },
  B: { axis: 'z', layer: -1, angle: Math.PI / 2 },
  M: { axis: 'x', layer: 0, angle: Math.PI / 2 },
  E: { axis: 'y', layer: 0, angle: Math.PI / 2 },
  S: { axis: 'z', layer: 0, angle: -Math.PI / 2 },
  x: { axis: 'x', layer: null, angle: -Math.PI / 2 },
  y: { axis: 'y', layer: null, angle: -Math.PI / 2 },
  z: { axis: 'z', layer: null, angle: -Math.PI / 2 },
};

export const SPEED_OPTIONS = [0.5, 1, 2, 4];
