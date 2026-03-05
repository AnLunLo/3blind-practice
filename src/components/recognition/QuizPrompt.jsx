import { useState, useEffect, useRef } from 'react';

export default function QuizPrompt({ current, phase, lastCorrect, onSubmit, onNext }) {
  const [input, setInput] = useState('');
  const inputRef = useRef(null);
  const nextBtnRef = useRef(null);

  // Reset input and focus when new question arrives
  useEffect(() => {
    if (phase === 'question') {
      setInput('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    // 答題後：若答對，自動 focus 下一題按鈕，讓 Enter 可以直接觸發
    if (phase === 'answered' && lastCorrect) {
      setTimeout(() => nextBtnRef.current?.focus(), 50);
    }
  }, [current, phase, lastCorrect]);

  function handleKey(e) {
    if (e.key !== 'Enter') return;
    if (phase === 'question' && input.trim()) onSubmit(input);
  }

  const inputClass = [
    'word-input',
    phase === 'answered' ? (lastCorrect ? 'correct' : 'wrong') : '',
  ].join(' ').trim();

  return (
    <div>
      <div className="prompt-label">這組代號對應的名詞是？</div>
      <div className="zhuyin-pair">{current?.pair ?? '—'}</div>
      <input
        ref={inputRef}
        className={inputClass}
        value={input}
        placeholder="輸入名詞"
        autoComplete="off"
        disabled={phase === 'answered'}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKey}
      />
      <div className="result-area">
        {phase === 'answered' && lastCorrect && (
          <div className="result-correct">✓ 正確！</div>
        )}
        {phase === 'answered' && !lastCorrect && (
          <div className="result-wrong">
            ✗ 答案是：<span className="result-answer">{current?.word}</span>
          </div>
        )}
      </div>
      <div>
        {phase === 'question' ? (
          <button className="btn-confirm" disabled={!input.trim()} onClick={() => onSubmit(input)}>
            確認
          </button>
        ) : (
          <button ref={nextBtnRef} className="btn-next" onClick={onNext}>下一題 →</button>
        )}
      </div>
    </div>
  );
}
