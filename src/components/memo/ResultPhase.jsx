import { fmtTime } from '../../lib/zhuyinUtils.js';

export default function ResultPhase({ finalMs, result, onRetry }) {
  if (!result) return null;
  return (
    <div>
      <div className="time-display">記憶時間：<span>{fmtTime(finalMs)}</span></div>
      <div>
        <div className="seq-label">角塊結果</div>
        <div className="diff-row">
          {result.cornerDiff.map((item, i) => (
            <span key={i} className={`diff-chip ${item.ok ? 'ok' : 'bad'}`}>{item.z}</span>
          ))}
        </div>
        <div style={{ marginBottom: '16px' }} />
      </div>
      <div>
        <div className="seq-label">邊塊結果</div>
        <div className="diff-row">
          {result.edgeDiff.map((item, i) => (
            <span key={i} className={`diff-chip ${item.ok ? 'ok' : 'bad'}`}>{item.z}</span>
          ))}
        </div>
        <div style={{ marginBottom: '20px' }} />
      </div>
      <button className="btn-primary" onClick={onRetry}>再練一次 ⟳</button>
    </div>
  );
}
