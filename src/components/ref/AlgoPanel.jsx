import { useEffect, useRef } from 'react';
import { ALGO_DATA } from '../../data/algoData.js';
import { useAlgoCube } from '../../hooks/useAlgoCube.js';

/**
 * AlgoPanel — algorithm player panel shown below the RefTab.
 * Appears when the user clicks ▶ on a RefCard.
 *
 * Props:
 *   pair    — e.g. "ㄅㄆ"
 *   word    — memo word, e.g. "薄片"
 *   onClose — callback to close the panel
 */
export default function AlgoPanel({ pair, word, onClose }) {
  const entry = ALGO_DATA[pair];
  const { canvasRef, loadCase, play, pause, stepForward, stepBack, resetCube, setSpeed, state } = useAlgoCube();

  const panelRef = useRef(null);

  // Load the case whenever pair changes (after canvas is mounted)
  useEffect(() => {
    if (!entry) return;
    // Small delay to let the canvas mount and Three.js initialise
    const id = setTimeout(() => {
      loadCase(pair, entry.type, entry.algo);
    }, 80);
    return () => clearTimeout(id);
  }, [pair]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll panel into view
  useEffect(() => {
    panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [pair]);

  const { moves, currentStep, playing, speedMs } = state;
  const total    = moves.length;
  const atStart  = currentStep === 0;
  const atEnd    = currentStep >= total;

  function handleReset() {
    if (entry) loadCase(pair, entry.type, entry.algo);
  }

  function handleSpeedChange(e) {
    // slider value: 1 (fast) – 10 (slow) → map to 150ms – 900ms
    const raw = Number(e.target.value);
    setSpeed(Math.round(150 + (raw - 1) * 83));
  }

  // Inverse-map speedMs back to slider value for display
  const sliderVal = Math.round((speedMs - 150) / 83 + 1);

  if (!entry) {
    return (
      <div className="algo-panel" ref={panelRef}>
        <div className="algo-panel-header">
          <span className="algo-panel-pair">{pair}</span>
          <span className="algo-panel-word">{word}</span>
          <button className="algo-close-btn" onClick={onClose}>✕</button>
        </div>
        <p style={{ color: 'var(--muted)', fontSize: '13px', padding: '12px 0' }}>
          此公式對尚無收錄還原算法。
        </p>
      </div>
    );
  }

  return (
    <div className="algo-panel" ref={panelRef}>
      {/* Header */}
      <div className="algo-panel-header">
        <span className="algo-panel-pair">{pair}</span>
        <span className="algo-panel-word">{word}</span>
        <button className="algo-close-btn" onClick={onClose} title="關閉">✕</button>
      </div>

      {/* Algorithm text */}
      <div className="algo-notation">{entry.algo}</div>

      {/* 3D Cube */}
      <div className="algo-cube-wrap">
        <canvas ref={canvasRef} className="algo-cube-canvas" />
      </div>

      {/* Controls */}
      <div className="algo-controls">
        <button
          className="algo-ctrl-btn"
          onClick={handleReset}
          title="重置"
        >↺</button>

        <button
          className="algo-ctrl-btn"
          onClick={stepBack}
          disabled={atStart}
          title="退一步"
        >◀</button>

        <button
          className="algo-ctrl-btn algo-ctrl-play"
          onClick={playing ? pause : play}
          disabled={!playing && atEnd}
          title={playing ? '暫停' : '播放'}
        >
          {playing ? '⏸' : '▶'}
        </button>

        <button
          className="algo-ctrl-btn"
          onClick={stepForward}
          disabled={atEnd}
          title="進一步"
        >▶|</button>

        <span className="algo-step-counter">
          {currentStep} / {total}
        </span>
      </div>

      {/* Speed slider */}
      <div className="algo-speed-row">
        <span className="algo-speed-label">速度</span>
        <span className="algo-speed-hint">快</span>
        <input
          type="range" min="1" max="10" step="1"
          value={sliderVal}
          onChange={handleSpeedChange}
          className="algo-speed-slider"
        />
        <span className="algo-speed-hint">慢</span>
      </div>

      {/* Move list */}
      {moves.length > 0 && (
        <div className="algo-move-list">
          {moves.map((m, i) => (
            <span
              key={i}
              className={`algo-move-chip${i === currentStep - 1 ? ' done' : ''}${i === currentStep ? ' active' : ''}`}
            >
              {m}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
