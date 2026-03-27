import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { COLORS } from './constants';

// Zhuyin sticker labels: "x,y,z" → { faceIndex: label }
// Face indices: 0=+x(R), 1=-x(L), 2=+y(U), 3=-y(D), 4=+z(F), 5=-z(B)
const STICKER_LABELS = {
  // Corners
  '1,1,1':    { 0: 'ㄖ', 2: 'ㄈ', 4: 'ㄌ' },    // UFR
  '-1,1,1':   { 1: 'ㄒ', 2: 'ㄅ', 4: 'ㄉ' },    // UFL
  '1,1,-1':   { 0: 'ㄕ', 2: 'ㄇ', 5: 'ㄋ' },    // UBR
  '-1,1,-1':  { 1: 'ㄑ', 2: 'ㄆ', 5: 'ㄊ' },    // UBL
  '1,-1,1':   { 0: 'ㄗ', 3: 'ㄩ', 4: 'ㄐ' },    // DFR
  '-1,-1,1':  { 1: 'ㄓ', 3: 'ㄙ', 4: 'ㄍ' },    // DFL
  '1,-1,-1':  { 0: 'ㄘ', 3: 'ㄨ', 5: 'ㄏ' },    // DBR
  '-1,-1,-1': { 1: 'ㄔ', 3: 'ㄧ', 5: 'ㄎ' },    // DBL
  // Edges
  '0,1,1':    { 2: 'ㄅ', 4: 'ㄉ' },              // UF
  '0,1,-1':   { 2: 'ㄇ', 5: 'ㄋ' },              // UB
  '1,1,0':    { 0: 'ㄌ', 2: 'ㄈ' },              // UR
  '-1,1,0':   { 1: 'ㄊ', 2: 'ㄆ' },              // UL
  '1,0,1':    { 0: 'ㄓ', 4: 'ㄔ' },              // FR
  '-1,0,1':   { 1: 'ㄎ', 4: 'ㄍ' },              // FL
  '1,0,-1':   { 0: 'ㄒ', 5: 'ㄑ' },              // BR
  '-1,0,-1':  { 1: 'ㄏ', 5: 'ㄐ' },              // BL
  '0,-1,1':   { 3: 'ㄙ', 4: 'ㄕ' },              // DF
  '1,-1,0':   { 0: 'ㄘ', 3: 'ㄩ' },              // DR
  '0,-1,-1':  { 3: 'ㄨ', 5: 'ㄗ' },              // DB
  '-1,-1,0':  { 1: 'ㄖ', 3: 'ㄧ' },              // DL
};
import { parseAlgorithm, getMoveRotation } from './algorithmParser';

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export class CubeEngine {
  constructor(container, onStateChange) {
    this.container = container;
    this.onStateChange = onStateChange || (() => {});
    this.cubies = [];
    this.originalPositions = [];
    this.algorithm = [];
    this.scramble = [];
    this.currentStep = 0;
    this.isPlaying = false;
    this.animating = false;
    this.baseDuration = 300;
    this.speedMultiplier = 1;
    this._disposed = false;

    this._initScene();
    this._createCore();
    this._createCubies();
    this._animate();
  }

  // ========== Scene Setup ==========

  _initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x6a6a6a);

    const w = this.container.clientWidth;
    const h = this.container.clientHeight;

    this.camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 100);
    this.defaultCamPos = new THREE.Vector3(5.5, 4, 5.5);
    this.camera.position.copy(this.defaultCamPos);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h);
    this.container.appendChild(this.renderer.domElement);

    // Lights
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.65));
    const dir1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dir1.position.set(5, 10, 7);
    this.scene.add(dir1);
    const dir2 = new THREE.DirectionalLight(0xffffff, 0.25);
    dir2.position.set(-3, -2, -5);
    this.scene.add(dir2);

    // Orbit controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enablePan = false;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 15;
    this.controls.target.set(0, 0, 0);
  }

  resize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  // ========== Cube Creation ==========

  _makeMat(color, label) {
    if (!label || color === COLORS.X) {
      return new THREE.MeshStandardMaterial({
        color,
        roughness: color === COLORS.X ? 0.9 : 0.3,
        metalness: 0,
      });
    }
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const hex = '#' + color.toString(16).padStart(6, '0');
    ctx.fillStyle = hex;
    ctx.fillRect(0, 0, 128, 128);
    const r = (color >> 16) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = color & 0xff;
    const bright = (r * 299 + g * 587 + b * 114) / 1000;
    ctx.font = 'bold 64px sans-serif';
    ctx.fillStyle = bright > 128 ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.75)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 64, 64);
    const texture = new THREE.CanvasTexture(canvas);
    return new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.3,
      metalness: 0,
    });
  }

  _createCore() {
    const geo = new THREE.BoxGeometry(2.12, 2.12, 2.12);
    const mat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    this.core = new THREE.Mesh(geo, mat);
    this.scene.add(this.core);
  }

  _createCubies() {
    const size = 0.93;
    const C = COLORS;
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          if (x === 0 && y === 0 && z === 0) continue;
          const posKey = `${x},${y},${z}`;
          const labels = STICKER_LABELS[posKey] || {};
          const materials = [
            this._makeMat(x === 1 ? C.R : C.X, labels[0]),
            this._makeMat(x === -1 ? C.O : C.X, labels[1]),
            this._makeMat(y === 1 ? C.W : C.X, labels[2]),
            this._makeMat(y === -1 ? C.Y : C.X, labels[3]),
            this._makeMat(z === 1 ? C.G : C.X, labels[4]),
            this._makeMat(z === -1 ? C.B : C.X, labels[5]),
          ];
          let geo;
          try {
            geo = new RoundedBoxGeometry(size, size, size, 4, 0.04);
          } catch {
            geo = new THREE.BoxGeometry(size, size, size);
          }
          const mesh = new THREE.Mesh(geo, materials);
          mesh.position.set(x, y, z);
          this.scene.add(mesh);
          this.cubies.push(mesh);
          this.originalPositions.push({ x, y, z });
        }
      }
    }
  }

  _resetCube() {
    for (let i = 0; i < this.cubies.length; i++) {
      const c = this.cubies[i];
      if (c.parent !== this.scene) this.scene.attach(c);
      const p = this.originalPositions[i];
      c.position.set(p.x, p.y, p.z);
      c.quaternion.identity();
    }
    for (const move of this.scramble) {
      this._applyMoveInstant(move);
    }
    // Apply inverse of algorithm so the cube starts unsolved;
    // playing forward will solve it
    for (let i = this.algorithm.length - 1; i >= 0; i--) {
      this._applyMoveInstant(this.algorithm[i], true);
    }
  }

  // ========== Move Execution ==========

  _getCubiesInLayers(axis, values) {
    const result = [];
    for (const c of this.cubies) {
      for (const v of values) {
        if (Math.abs(c.position[axis] - v) < 0.15) {
          result.push(c);
          break;
        }
      }
    }
    return result;
  }

  _applyMoveInstant(move, reverse = false) {
    const rot = getMoveRotation(move);
    if (!rot) return;
    const angle = reverse ? -rot.angle : rot.angle;
    const cubies = this._getCubiesInLayers(rot.axis, rot.layers);
    const pivot = new THREE.Object3D();
    this.scene.add(pivot);
    for (const c of cubies) pivot.attach(c);
    pivot.rotation[rot.axis] = angle;
    pivot.updateMatrixWorld(true);
    for (const c of cubies) {
      this.scene.attach(c);
      c.position.x = Math.round(c.position.x);
      c.position.y = Math.round(c.position.y);
      c.position.z = Math.round(c.position.z);
    }
    this.scene.remove(pivot);
  }

  _animateMove(move, reverse = false) {
    return new Promise((resolve) => {
      const rot = getMoveRotation(move);
      if (!rot) { resolve(); return; }
      const angle = reverse ? -rot.angle : rot.angle;
      const cubies = this._getCubiesInLayers(rot.axis, rot.layers);
      const pivot = new THREE.Object3D();
      this.scene.add(pivot);
      for (const c of cubies) pivot.attach(c);

      const duration = this.baseDuration / this.speedMultiplier;
      const start = performance.now();

      const tick = (now) => {
        if (this._disposed) { resolve(); return; }
        const t = Math.min((now - start) / duration, 1);
        pivot.rotation[rot.axis] = angle * easeInOutCubic(t);
        if (t < 1) {
          requestAnimationFrame(tick);
        } else {
          pivot.updateMatrixWorld(true);
          for (const c of cubies) {
            this.scene.attach(c);
            c.position.x = Math.round(c.position.x);
            c.position.y = Math.round(c.position.y);
            c.position.z = Math.round(c.position.z);
          }
          this.scene.remove(pivot);
          resolve();
        }
      };
      requestAnimationFrame(tick);
    });
  }

  // ========== Playback Controls ==========

  async stepForward() {
    if (this.animating || this.currentStep >= this.algorithm.length) return;
    this.animating = true;
    await this._animateMove(this.algorithm[this.currentStep]);
    this.currentStep++;
    this.animating = false;
    this.onStateChange(this.getState());
  }

  async stepBackward() {
    if (this.animating || this.currentStep <= 0) return;
    this.animating = true;
    await this._animateMove(this.algorithm[this.currentStep - 1], true);
    this.currentStep--;
    this.animating = false;
    this.onStateChange(this.getState());
  }

  goToStep(step) {
    if (this.animating) return;
    step = Math.max(0, Math.min(step, this.algorithm.length));
    this._resetCube();
    for (let i = 0; i < step; i++) {
      this._applyMoveInstant(this.algorithm[i]);
    }
    this.currentStep = step;
    this.onStateChange(this.getState());
  }

  async play() {
    if (this.isPlaying) return;
    if (this.currentStep >= this.algorithm.length) {
      this.goToStep(0);
    }
    this.isPlaying = true;
    this.onStateChange(this.getState());
    while (this.isPlaying && this.currentStep < this.algorithm.length) {
      await this.stepForward();
    }
    this.isPlaying = false;
    this.onStateChange(this.getState());
  }

  pause() {
    this.isPlaying = false;
    this.onStateChange(this.getState());
  }

  togglePlay() {
    if (this.isPlaying) this.pause();
    else this.play();
  }

  skipToStart() {
    this.pause();
    this.goToStep(0);
  }

  skipToEnd() {
    this.pause();
    this.goToStep(this.algorithm.length);
  }

  resetView() {
    this.camera.position.copy(this.defaultCamPos);
    this.camera.lookAt(0, 0, 0);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  // ========== Public API ==========

  setAlgorithm(str) {
    this.pause();
    this.algorithm = parseAlgorithm(str);
    this.currentStep = 0;
    this._resetCube();
    this.onStateChange(this.getState());
  }

  setScramble(str) {
    this.pause();
    this.scramble = parseAlgorithm(str);
    this.currentStep = 0;
    this._resetCube();
    this.onStateChange(this.getState());
  }

  setSpeed(multiplier) {
    this.speedMultiplier = multiplier;
  }

  getState() {
    return {
      currentStep: this.currentStep,
      totalSteps: this.algorithm.length,
      isPlaying: this.isPlaying,
      algorithm: this.algorithm,
    };
  }

  // ========== Render Loop ==========

  _animate() {
    if (this._disposed) return;
    requestAnimationFrame(() => this._animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this._disposed = true;
    this.isPlaying = false;
    this.controls.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
