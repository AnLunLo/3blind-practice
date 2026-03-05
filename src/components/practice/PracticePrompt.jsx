/**
 * Shows the word to identify, and the 4-target progress.
 * targets order: [a-corner, a-edge, b-corner, b-edge]
 */
export default function PracticePrompt({ current, done }) {
  if (!current) return (
    <div className="quiz-wrap">
      <div className="zhuyin-pair" style={{ fontSize: '48px' }}>—</div>
    </div>
  );

  const { pair, word, targets } = current;
  const [a, b] = [...pair];

  // Group: char A (done[0]=corner, done[1]=edge), char B (done[2]=corner, done[3]=edge)
  const groups = [
    { ch: a, kinds: ['角', '邊'], doneIdxs: [0, 1] },
    { ch: b, kinds: ['角', '邊'], doneIdxs: [2, 3] },
  ];

  return (
    <div className="quiz-wrap">
      <div className="prompt-label">這個名詞代表的貼紙在哪裡？</div>
      <div className="zhuyin-pair" style={{ fontSize: '56px', marginBottom: '16px' }}>
        {word}
      </div>
      <div style={{ fontSize: '13px', color: '#bbb', marginBottom: '20px' }}>
        點出方塊上所有對應的貼紙（共 4 個）
      </div>

      {/* Progress indicators */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '24px' }}>
        {groups.map(({ ch, kinds, doneIdxs }) => (
          <div key={ch} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '22px', color: 'var(--gold)', marginBottom: '6px' }}>{ch}</div>
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
              {kinds.map((kind, ki) => {
                const isDone = done[doneIdxs[ki]];
                return (
                  <div key={kind} style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '700',
                    background: isDone ? '#142014' : 'var(--bg3)',
                    border: `1px solid ${isDone ? 'var(--green)' : 'var(--border2)'}`,
                    color: isDone ? 'var(--green)' : '#888',
                  }}>
                    {isDone ? '✓' : '◯'} {kind}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
