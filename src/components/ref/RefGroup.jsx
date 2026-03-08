import { useState } from 'react';
import RefCard from './RefCard.jsx';

export default function RefGroup({ initial, items, memoTable, hasOverride, onSave, onReset, onAlgoClick }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="ref-group">
      <button className="ref-group-header" onClick={() => setOpen(o => !o)}>
        <span>{initial}（{items.length} 筆）</span>
        <span className="arrow" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s', fontSize: '10px', color: 'var(--muted)' }}>▼</span>
      </button>
      {open && (
        <div className="ref-group-body">
          <div className="ref-grid">
            {items.map(({ key }) => (
              <RefCard
                key={key}
                pair={key}
                word={memoTable[key]}
                defaultWord={undefined}
                hasOverride={hasOverride(key)}
                onSave={onSave}
                onReset={onReset}
                onAlgoClick={onAlgoClick}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
