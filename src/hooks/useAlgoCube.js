/**
 * useAlgoCube.js
 *
 * Three.js hook for the algorithm player cube.
 * - Fully opaque solved cube, dimmed by default (same style as quiz cube).
 * - loadCase(pair, type, algoStr): sets up the scrambled state (inverse of algo),
 *   then highlights the 3 involved stickers (buffer + 2 targets).
 * - Animated face rotation via a temporary pivot Group.
 * - Playback: play / pause / stepForward / stepBack / reset.
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import * as THREE from 'three';
import { MOVES, invertSequence, inverseMove } from '../lib/cubeMoveLogic.js';
import { parseAlgo } from '../lib/algoParser.js';
import { FACE_COLOR_HEX, FI } from '../data/constants.js';
import { CORNERS, EDGES } from '../data/pieces.js';

// ── Easing ───────────────────────────────────────────────────────────────────
function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// ── Build sticker map from pieces data ───────────────────────────────────────
// Maps zhuyin char → [{ cx, cy, cz, faceIdx, kind }]
function buildStickerMap() {
  const map = {};
  const add = (pieces, kind) => {
    pieces.forEach(p => {
      const cx = p.id.includes('R') ? 1 : p.id.includes('L') ? -1 : 0;
      const cy = p.id.includes('U') ? 1 : p.id.includes('D') ? -1 : 0;
      const cz = p.id.includes('F') ? 1 : p.id.includes('B') ? -1 : 0;
      p.z.forEach((zh, si) => {
        if (!map[zh]) map[zh] = [];
        map[zh].push({ cx, cy, cz, faceIdx: FI[p.faces[si]], kind });
      });
    });
  };
  add(CORNERS, 'corner');
  add(EDGES,   'edge');
  return map;
}

// ── Build 26 cubies (all stickers dimmed initially) ───────────────────────────
function buildAlgoCubies() {
  const group = new THREE.Group();
  const cubies = [];

  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        if (!x && !y && !z) continue;

        const isCentre = (x===0&&y===0)||(x===0&&z===0)||(y===0&&z===0);
        const geo  = new THREE.BoxGeometry(0.93, 0.93, 0.93);

        // asgn[i] = face letter if face i is an external sticker, else null
        const asgn = [
          x === 1  ? 'R' : null,  // face 0 = +X
          x === -1 ? 'L' : null,  // face 1 = −X
          y === 1  ? 'U' : null,  // face 2 = +Y
          y === -1 ? 'D' : null,  // face 3 = −Y
          z === 1  ? 'F' : null,  // face 4 = +Z
          z === -1 ? 'B' : null,  // face 5 = −Z
        ];

        const mats = asgn.map(face => {
          if (!face) {
            // Inner face — fully dark
            return new THREE.MeshStandardMaterial({
              color: 0x181818, transparent: false, roughness: 0.6,
            });
          }
          if (isCentre) {
            // Centre pieces always fully visible
            return new THREE.MeshStandardMaterial({
              color: FACE_COLOR_HEX[face], transparent: false, roughness: 0.3,
            });
          }
          // Non-centre sticker — fully visible
          return new THREE.MeshStandardMaterial({
            color: FACE_COLOR_HEX[face],
            transparent: false, opacity: 1.0, roughness: 0.3,
          });
        });

        const mesh = new THREE.Mesh(geo, mats);
        mesh.position.set(x * 1.02, y * 1.02, z * 1.02);
        group.add(mesh);

        if (!isCentre) {
          cubies.push({ mesh, cx: x, cy: y, cz: z, mats, asgn });
        }
      }
    }
  }

  return { group, cubies };
}

// ─────────────────────────────────────────────────────────────────────────────

export function useAlgoCube() {
  const canvasRef = useRef(null);

  // All mutable Three.js state — never triggers re-renders
  const s = useRef({
    renderer: null,
    scene: null,
    camera: null,
    group: null,
    cubies: [],
    animFrame: null,

    // Drag
    rotX: 0.5, rotY: 0.0,
    dragging: false, mouseDown: false,
    prevX: 0, prevY: 0,
    winMM: null, winMU: null,

    // Face-rotation animation
    activePivot: null,
    // { pivot, affectedCubies, axis, targetAngle, startTime, speedMs, posTransform }

    // Playback
    moveQueue: [],
    currentStep: 0,
    playing: false,
    speedMs: 500,
    onStateChange: null,

    // Sticker map (built once)
    stickerMap: null,
  });

  // React state — only updated to trigger UI re-renders
  const [playerState, setPlayerState] = useState({
    moves: [], currentStep: 0, playing: false, speedMs: 500,
  });

  function notifyStateChange() {
    const { moveQueue, currentStep, playing, speedMs } = s.current;
    setPlayerState({ moves: moveQueue, currentStep, playing, speedMs });
  }

  // ── Scene setup ────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const wrap = canvas.parentElement;

    const W = wrap.clientWidth || 320;
    const H = Math.round(W * 0.72);
    canvas.width  = W;
    canvas.height = H;
    canvas.style.height = H + 'px';

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 100);
    camera.position.set(4.2, 3.6, 4.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const { group, cubies } = buildAlgoCubies();
    scene.add(group);
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dl = new THREE.DirectionalLight(0xffffff, 0.9);
    dl.position.set(5, 8, 5);
    scene.add(dl);

    s.current.renderer = renderer;
    s.current.scene    = scene;
    s.current.camera   = camera;
    s.current.group    = group;
    s.current.cubies   = cubies;
    s.current.stickerMap = buildStickerMap();

    // ── Drag handlers ────────────────────────────────────────────────────────
    function getXY(e) {
      const src = e.touches ? e.touches[0] : e;
      return [src.clientX, src.clientY];
    }
    function onMD(e) {
      s.current.mouseDown = true;
      s.current.dragging  = false;
      const [x, y] = getXY(e);
      s.current.prevX = x; s.current.prevY = y;
    }
    function onMM(e) {
      if (!s.current.mouseDown) return;
      const src = e.touches ? e.touches[0] : e;
      const dx = src.clientX - s.current.prevX;
      const dy = src.clientY - s.current.prevY;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) s.current.dragging = true;
      if (!s.current.dragging) return;
      s.current.rotY += dx * 0.012;
      s.current.rotX += dy * 0.012;
      s.current.prevX = src.clientX;
      s.current.prevY = src.clientY;
    }
    function onMU() {
      s.current.mouseDown = false;
      s.current.dragging  = false;
    }

    canvas.addEventListener('mousedown', onMD);
    canvas.addEventListener('mousemove', onMM);
    canvas.addEventListener('mouseup',   onMU);
    canvas.addEventListener('touchstart', e => { onMD(e); e.preventDefault(); }, { passive: false });
    canvas.addEventListener('touchmove',  e => { onMM(e); e.preventDefault(); }, { passive: false });
    canvas.addEventListener('touchend',   e => { onMU();  e.preventDefault(); }, { passive: false });

    const winMM = e => onMM(e);
    const winMU = () => { s.current.mouseDown = false; s.current.dragging = false; };
    window.addEventListener('mousemove', winMM);
    window.addEventListener('mouseup',   winMU);
    s.current.winMM = winMM;
    s.current.winMU = winMU;

    // ── Main render loop ─────────────────────────────────────────────────────
    function animate(ts) {
      s.current.animFrame = requestAnimationFrame(animate);
      s.current.group.rotation.x = s.current.rotX;
      s.current.group.rotation.y = s.current.rotY;

      const ap = s.current.activePivot;
      if (ap) {
        const t = Math.min((ts - ap.startTime) / ap.speedMs, 1);
        ap.pivot.rotation[ap.axis] = ap.targetAngle * easeInOut(t);
        if (t >= 1) {
          finalizePivot();
          advanceQueue();
        }
      }

      renderer.render(scene, camera);
    }
    animate(0);

    return () => {
      cancelAnimationFrame(s.current.animFrame);
      window.removeEventListener('mousemove', s.current.winMM);
      window.removeEventListener('mouseup',   s.current.winMU);
      renderer.dispose();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Face rotation helpers ─────────────────────────────────────────────────

  function startMove(moveStr) {
    const def = MOVES[moveStr];
    if (!def) { advanceQueue(); return; }

    const { group, cubies, speedMs } = s.current;
    const affected = cubies.filter(def.filter);

    const pivot = new THREE.Group();
    group.add(pivot);
    affected.forEach(c => pivot.attach(c.mesh));

    s.current.activePivot = {
      pivot,
      affectedCubies: affected,
      axis: def.axis,
      targetAngle: def.angle,
      startTime: performance.now(),
      speedMs,
      posTransform: def.pos,
    };
  }

  function finalizePivot() {
    const ap = s.current.activePivot;
    if (!ap) return;
    const { pivot, affectedCubies, posTransform } = ap;
    const { group } = s.current;

    affectedCubies.forEach(c => {
      group.attach(c.mesh); // preserve world position/rotation
      const [nx, ny, nz] = posTransform(c.cx, c.cy, c.cz);
      c.cx = Math.round(nx);
      c.cy = Math.round(ny);
      c.cz = Math.round(nz);
    });

    group.remove(pivot);
    s.current.activePivot = null;
  }

  function advanceQueue() {
    const sc = s.current;
    if (sc.playing && sc.currentStep < sc.moveQueue.length) {
      const move = sc.moveQueue[sc.currentStep];
      sc.currentStep++;
      notifyStateChange();
      startMove(move);
    } else {
      sc.playing = false;
      notifyStateChange();
    }
  }

  // ── Instant move (no animation) ───────────────────────────────────────────
  function applyInstant(moves) {
    const { group, cubies, renderer, scene, camera } = s.current;
    for (const m of moves) {
      const def = MOVES[m];
      if (!def) continue;
      const affected = cubies.filter(def.filter);
      const pivot = new THREE.Group();
      group.add(pivot);
      affected.forEach(c => pivot.attach(c.mesh));
      pivot.rotation[def.axis] = def.angle;
      affected.forEach(c => {
        group.attach(c.mesh);
        const [nx, ny, nz] = def.pos(c.cx, c.cy, c.cz);
        c.cx = Math.round(nx);
        c.cy = Math.round(ny);
        c.cz = Math.round(nz);
      });
      group.remove(pivot);
    }
    renderer.render(scene, camera);
  }

  // ── Highlight the 3 involved sticker positions ────────────────────────────
  // pair: e.g. "ㄅㄆ", type: 'corner'|'edge'
  // Highlighted stickers → normal face colour
  // All other stickers   → near-black (0x111111)
  function highlightInvolvedStickers(pair, type) {
    const { cubies, stickerMap } = s.current;

    // corner buffer = UFR → U face = ㄈ
    // edge   buffer = UF  → U face = ㄅ
    const bufferChar = type === 'corner' ? 'ㄈ' : 'ㄅ';

    // Build set of (cx,cy,cz,faceIdx) keys to highlight
    const highlighted = new Set();
    const addChar = (ch) => {
      const entries = stickerMap[ch] || [];
      entries
        .filter(e => e.kind === type)
        .forEach(e => highlighted.add(`${e.cx},${e.cy},${e.cz},${e.faceIdx}`));
    };

    addChar(bufferChar);
    for (const ch of pair) addChar(ch);

    // Apply colours to all non-centre cubies
    cubies.forEach(({ cx, cy, cz, mats, asgn }) => {
      asgn.forEach((face, i) => {
        if (!face) return; // inner face — skip
        const key = `${cx},${cy},${cz},${i}`;
        if (highlighted.has(key)) {
          // Show normal sticker colour
          mats[i].color.setHex(FACE_COLOR_HEX[face]);
          mats[i].emissive.setHex(0x000000);
        } else {
          // Near-black dim (transparent stays false, no opacity tricks)
          mats[i].color.setHex(0x111111);
          mats[i].emissive.setHex(0x000000);
        }
      });
    });
  }

  // ── Reset cube to solved state (all stickers dimmed) ─────────────────────
  const resetCube = useCallback(() => {
    // Dispose old cubies and rebuild
    const sc = s.current;
    if (!sc.renderer) return;

    // Remove old group from scene
    if (sc.group) sc.scene.remove(sc.group);

    // Cancel any in-progress animation
    sc.activePivot = null;
    sc.playing = false;
    sc.moveQueue = [];
    sc.currentStep = 0;

    // Build fresh
    const { group, cubies } = buildAlgoCubies();
    sc.scene.add(group);
    sc.group  = group;
    sc.cubies = cubies;

    sc.renderer.render(sc.scene, sc.camera);
  }, []);

  // ── Public API ────────────────────────────────────────────────────────────

  const loadCase = useCallback((pair, type, algoStr) => {
    resetCube();
    const moves = parseAlgo(algoStr);
    if (!moves.length) return;

    const inverse = invertSequence(moves);
    applyInstant(inverse);
    highlightInvolvedStickers(pair, type);

    s.current.moveQueue   = moves;
    s.current.currentStep = 0;
    s.current.playing     = false;
    notifyStateChange();
  }, [resetCube]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Highlight only (no scrambling) ───────────────────────────────────────
  // Resets cube to solved state then dims all stickers except the 3 involved.
  const highlightOnly = useCallback((pair, type) => {
    const sc = s.current;
    if (!sc.renderer) return;
    resetCube();
    highlightInvolvedStickers(pair, type);
    sc.renderer.render(sc.scene, sc.camera);
  }, [resetCube]); // eslint-disable-line react-hooks/exhaustive-deps

  const play = useCallback(() => {
    const sc = s.current;
    if (sc.activePivot) return; // already animating
    if (sc.currentStep >= sc.moveQueue.length) return; // finished
    sc.playing = true;
    notifyStateChange();
    const move = sc.moveQueue[sc.currentStep];
    sc.currentStep++;
    notifyStateChange();
    startMove(move);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pause = useCallback(() => {
    s.current.playing = false;
    notifyStateChange();
  }, []);

  const stepForward = useCallback(() => {
    const sc = s.current;
    if (sc.activePivot || sc.currentStep >= sc.moveQueue.length) return;
    // playing=false → advanceQueue will stop after this single move
    sc.playing = false;
    const move = sc.moveQueue[sc.currentStep];
    sc.currentStep++;
    notifyStateChange();
    startMove(move);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const stepBack = useCallback(() => {
    const sc = s.current;
    if (sc.activePivot || sc.currentStep <= 0) return;
    // playing=false → advanceQueue will stop after the inverse move
    sc.playing = false;
    sc.currentStep--;
    notifyStateChange();
    const move = sc.moveQueue[sc.currentStep];
    startMove(inverseMove(move));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setSpeed = useCallback((ms) => {
    s.current.speedMs = ms;
    setPlayerState(prev => ({ ...prev, speedMs: ms }));
  }, []);

  return {
    canvasRef,
    loadCase,
    highlightOnly,
    play,
    pause,
    stepForward,
    stepBack,
    resetCube,
    setSpeed,
    state: playerState,
  };
}
