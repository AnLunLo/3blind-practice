export default function IdentifyPrompt({ current, done }) {
  const labels = ['角塊', '邊塊'];
  return (
    <div className="quiz-wrap">
      <div className="prompt-label">這個注音代號在方塊上的哪個位置？</div>
      <div className="zhuyin-pair">{current?.char ?? '—'}</div>
      <div style={{ color: '#bbb', fontSize: '13px', marginBottom: '6px' }}>
        請點出角塊與邊塊各一個貼片
      </div>
      <div style={{ minHeight: '44px', marginBottom: '10px', fontSize: '16px' }}>
        {current?.targets.map((t, i) => (
          done[i]
            ? <div key={i} className="result-correct">✓ {labels[i]} — {t.pieceId} ({t.faceName}面)</div>
            : <div key={i} style={{ color: '#bbb', fontSize: '13px', margin: '2px 0' }}>◯ {labels[i]} — 尚未指出</div>
        ))}
      </div>
    </div>
  );
}
