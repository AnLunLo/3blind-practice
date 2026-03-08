import { useEffect } from 'react';
import { useAlgoCube } from '../../hooks/useAlgoCube.js';

/**
 * FormulaCubePanel
 *
 * 在公式 tab 中顯示：
 *   - Three.js 方塊（已解狀態，pair/buffer 3 個貼紙高亮，其餘暗黑）
 *   - 播放控制列（按鈕已佈局，功能待實作）
 *
 * Props:
 *   pair    — 注音對，e.g. "ㄅㄆ"
 *   section — 'corner' | 'edge'
 *   algoStr — 公式字串，e.g. "[R' D R U' : [R' D' R , U']]"
 */
export default function FormulaCubePanel({ pair, section, algoStr }) {
  const { canvasRef, highlightOnly, state } = useAlgoCube();
  const { moves, currentStep, playing, speedMs } = state;
  const total   = moves.length;
  const atStart = currentStep === 0;
  const atEnd   = currentStep >= total;

  // 當 pair 或 section 改變（含首次掛載），高亮三個相關貼紙
  // 80ms 延遲讓 Three.js 場景先完成初始化
  useEffect(() => {
    const id = setTimeout(() => {
      highlightOnly(pair, section);
    }, 80);
    return () => clearTimeout(id);
  }, [pair, section]); // eslint-disable-line react-hooks/exhaustive-deps

  // 速度 slider 顯示值（1–10）
  const sliderVal = Math.round((speedMs - 150) / 83 + 1);

  return (
    <div className="formula-player">

      {/* ── 方塊 canvas ── */}
      <div className="formula-cube-wrap">
        <canvas ref={canvasRef} className="formula-cube-canvas" />
      </div>

      {/* ── 播放控制列 ── */}
      <div className="formula-player-controls">
        <button className="fpc-btn" disabled title="重置">↺</button>
        <button className="fpc-btn" disabled={atStart} title="退一步">◀</button>
        <button className="fpc-btn fpc-play" disabled title={playing ? '暫停' : '播放'}>
          {playing ? '⏸' : '▶'}
        </button>
        <button className="fpc-btn" disabled={atEnd} title="進一步">▶|</button>
        <span className="fpc-counter">{currentStep} / {total || '—'}</span>
      </div>

      {/* ── 速度滑桿 ── */}
      <div className="formula-player-speed">
        <span className="fpc-speed-label">速度</span>
        <span className="fpc-speed-hint">快</span>
        <input
          type="range" min="1" max="10" step="1"
          value={sliderVal}
          onChange={() => {}}  /* 功能待接 */
          className="fpc-speed-slider"
        />
        <span className="fpc-speed-hint">慢</span>
      </div>

      {/* ── 移動清單（待有資料再顯示）── */}
      {moves.length > 0 && (
        <div className="fpc-move-list">
          {moves.map((m, i) => (
            <span
              key={i}
              className={`fpc-move-chip${i === currentStep - 1 ? ' done' : ''}${i === currentStep ? ' active' : ''}`}
            >
              {m}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
