import { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { buildCubies, highlightPair, resetColors, flashWrong, lightGreen } from '../lib/cubeGeometry.js';

/**
 * useCube — wraps the full Three.js cube lifecycle.
 *
 * @param {object} options
 * @param {'quiz'|'identify'} options.mode
 * @param {function} [options.onStickerClick] — identify mode only.
 *   Called with (cubiePos:{cx,cy,cz}, faceIndex).
 *   Should return {hit, hitIdx, faceName}.
 */
export function useCube({ mode, onStickerClick } = {}) {
  const canvasRef = useRef(null);

  // All mutable Three.js state lives here — never triggers re-renders
  const s = useRef({
    renderer: null,
    scene: null,
    camera: null,
    group: null,
    cubies: [],
    animFrame: null,
    rotX: 0.5,
    rotY: 0.0,
    dragging: false,
    mouseDown: false,
    prevX: 0,
    prevY: 0,
    windowMM: null,
    windowMU: null,
  });

  // Stable ref for the click callback — avoids stale closure in event listeners
  const onClickRef = useRef(onStickerClick);
  useEffect(() => { onClickRef.current = onStickerClick; }, [onStickerClick]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const wrap = canvas.parentElement;

    const W = wrap.clientWidth || 320;
    const H = Math.round(W * 0.72);
    canvas.width = W;
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

    const { group, cubies } = buildCubies();
    scene.add(group);
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dl = new THREE.DirectionalLight(0xffffff, 0.9);
    dl.position.set(5, 8, 5);
    scene.add(dl);

    s.current.renderer = renderer;
    s.current.scene = scene;
    s.current.camera = camera;
    s.current.group = group;
    s.current.cubies = cubies;

    // ── Drag ──────────────────────────────────────
    function getXY(e) {
      const src = e.touches ? e.touches[0] : e;
      return [src.clientX, src.clientY];
    }

    function onMD(e) {
      s.current.mouseDown = true;
      s.current.dragging = false;
      const [x, y] = getXY(e);
      s.current.prevX = x;
      s.current.prevY = y;
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

    function onMU(e) {
      if (!s.current.mouseDown) return;
      s.current.mouseDown = false;
      if (s.current.dragging) { s.current.dragging = false; return; }

      // Click handling — identify mode only
      if (mode !== 'identify' || !onClickRef.current) return;

      const rect = canvas.getBoundingClientRect();
      const src = e.changedTouches ? e.changedTouches[0] : e;
      const mouse = new THREE.Vector2(
        ((src.clientX - rect.left) / rect.width) * 2 - 1,
        -((src.clientY - rect.top) / rect.height) * 2 + 1,
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, s.current.camera);

      const hits = raycaster.intersectObjects(s.current.cubies.map(c => c.mesh));
      if (!hits.length) return;

      const hit = hits[0];
      const faceIndex = Math.floor(hit.faceIndex / 2);
      const cubie = s.current.cubies.find(c => c.mesh === hit.object);
      if (!cubie) return;

      const result = onClickRef.current({ cx: cubie.cx, cy: cubie.cy, cz: cubie.cz }, faceIndex);
      if (!result) return;

      if (result.hit) {
        lightGreen(cubie.mats[faceIndex], result.faceName);
      } else {
        const origHex = cubie.mats[faceIndex].color.getHex();
        const origOp = cubie.mats[faceIndex].opacity;
        flashWrong(cubie.mats[faceIndex], origHex, origOp);
      }
    }

    // Canvas listeners
    canvas.addEventListener('mousedown', onMD);
    canvas.addEventListener('mousemove', onMM);
    canvas.addEventListener('mouseup', onMU);
    canvas.addEventListener('touchstart', e => { onMD(e); e.preventDefault(); }, { passive: false });
    canvas.addEventListener('touchmove', e => { onMM(e); e.preventDefault(); }, { passive: false });
    canvas.addEventListener('touchend', e => { onMU(e); e.preventDefault(); }, { passive: false });

    // Window listeners (for drag outside canvas)
    const winMM = e => onMM(e);
    const winMU = e => { s.current.mouseDown = false; s.current.dragging = false; };
    window.addEventListener('mousemove', winMM);
    window.addEventListener('mouseup', winMU);
    s.current.windowMM = winMM;
    s.current.windowMU = winMU;

    // ── Animate ───────────────────────────────────
    function animate() {
      s.current.animFrame = requestAnimationFrame(animate);
      s.current.group.rotation.x = s.current.rotX;
      s.current.group.rotation.y = s.current.rotY;
      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(s.current.animFrame);
      window.removeEventListener('mousemove', winMM);
      window.removeEventListener('mouseup', winMU);
      renderer.dispose();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Imperative handles ────────────────────────
  const highlight = useCallback((pair) => {
    if (s.current.cubies.length) highlightPair(s.current.cubies, pair);
  }, []);

  const reset = useCallback(() => {
    if (s.current.cubies.length) resetColors(s.current.cubies);
  }, []);

  return { canvasRef, highlightPair: highlight, resetColors: reset };
}
