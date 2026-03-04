export default function MemoPhase({ timerDisplay, cornerPairs, edgePairs, onStop }) {
  return (
    <div>
      <div className="timer-box">
        <div className="timer-label">記憶計時</div>
        <div className="timer-value">{timerDisplay}</div>
      </div>
      <div>
        <div className="seq-label">角塊序列</div>
        <div className="pair-grid">
          {cornerPairs.map((p, i) => (
            <div key={i} className="pair-card">
              <div className="pair-zh">{p.a}{p.b}</div>
              {p.word && <div className="pair-word">{p.word}</div>}
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="seq-label">邊塊序列</div>
        <div className="pair-grid">
          {edgePairs.map((p, i) => (
            <div key={i} className="pair-card">
              <div className="pair-zh">{p.a}{p.b}</div>
              {p.word && <div className="pair-word">{p.word}</div>}
            </div>
          ))}
        </div>
      </div>
      <button className="btn-danger" onClick={onStop} style={{ marginTop: '8px' }}>
        記好了，遮住答案 →
      </button>
    </div>
  );
}
