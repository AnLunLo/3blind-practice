import { useEffect } from 'react';
import { useAlgoCube } from '../../hooks/useAlgoCube.js';

/**
 * FormulaCubePanel
 *
 * Props:
 *   pair    — 注音對，e.g. "ㄅㄆ"
 *   section — 'corner' | 'edge'
 *   algoStr — 公式字串，e.g. "[R' D R U' : [R' D' R , U']]"
 *
 * 行為：
 *   - 選 pair 時立即顯示「未還原狀態」（套用公式反向）並高亮三個貼紙
 *   - ↺  重置回未還原狀態
 *   - ◀  退一步
 *   - ▶  播放 / 暫停
 *   - ▶| 進一步
 */
export default function FormulaCubePanel({ pair, section, algoStr }) {
  const { canvasRef, loadCase, play, pause, stepForward, stepBack, state } = useAlgoCube();
  const { moves, currentStep, playing, speedMs } = state;
  const total   = moves.length;
  const atStart = currentStep === 0;
  const atEnd   = currentStep >= total;

  // 當 pair / section 變動（含首次掛載），載入未還原狀態
  // 80ms 延遲讓 Three.js 場景完成初始化
  useEffect(() => {
    const id = setTimeout(() => {
      loadCase(pair, section, algoStr);
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
        <button
          className="fpc-btn"
          onClick={() => loadCase(pair, section, algoStr)}
          title="重置為未還原狀態"
        >↺</button>
        <button
          className="fpc-btn"
          onClick={stepBack}
          disabled={atStart}
          title="退一步"
        >◀</button>
        <button
          className="fpc-btn fpc-play"
          onClick={() => playing ? pause() : play()}
          disabled={atEnd}
          title={playing ? '暫停' : '播放'}
        >{playing ? '⏸' : '▶'}</button>
        <button
          className="fpc-btn"
          onClick={stepForward}
          disabled={atEnd}
          title="進一步"
        >▶|</button>
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

      {/* ── 移動清單 ── */}
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
