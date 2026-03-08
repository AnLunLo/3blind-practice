import { useState, useRef, useEffect } from 'react';
import { ALGO_DATA } from '../../data/algoData.js';

export default function RefCard({ pair, word, hasOverride, onSave, onReset, onAlgoClick }) {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState(word);
  const inputRef = useRef(null);
  const hasAlgo = !!ALGO_DATA[pair];

  // Sync input when word changes externally
  useEffect(() => { setInputVal(word); }, [word]);

  useEffect(() => {
    if (editing) setTimeout(() => inputRef.current?.focus(), 20);
  }, [editing]);

  function save() {
    const trimmed = inputVal.trim();
    if (trimmed && trimmed !== word) onSave(pair, trimmed);
    setEditing(false);
  }

  function cancel() {
    setInputVal(word);
    setEditing(false);
  }

  function handleKey(e) {
    if (e.key === 'Enter') save();
    if (e.key === 'Escape') cancel();
  }

  return (
    <div className={`ref-card${hasOverride ? ' has-override' : ''}`}>
      <span className="ref-id">{pair}</span>

      <div className="ref-inline-edit" style={{ flex: 1 }}>
        {editing ? (
          <>
            <input
              ref={inputRef}
              className="ref-inline-input"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={handleKey}
              onBlur={save}
            />
            {hasOverride && (
              <button
                className="ref-editor-reset"
                onMouseDown={e => { e.preventDefault(); onReset(pair); setEditing(false); }}
                title="重置為預設"
              >↺</button>
            )}
          </>
        ) : (
          <>
            <span
              className="ref-inline-word"
              onClick={() => setEditing(true)}
              title="點擊編輯"
            >
              {word}
            </span>
            <button
              className="ref-card-edit-btn"
              onClick={() => setEditing(true)}
              title="編輯"
            >✏</button>
          </>
        )}
      </div>

      {/* Algorithm player button — only shown if this pair has an algorithm */}
      {hasAlgo && onAlgoClick && (
        <button
          className="ref-algo-btn"
          onClick={() => onAlgoClick(pair, word)}
          title="展示還原公式動畫"
        >▶</button>
      )}
    </div>
  );
}
