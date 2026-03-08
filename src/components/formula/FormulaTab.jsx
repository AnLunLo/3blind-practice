import { useState, useMemo } from 'react';
import { useMemoTableCtx } from '../../App.jsx';
import { ZHUYIN_ORDER } from '../../data/constants.js';
import { CORNER_ALGS } from '../../data/cornerAlgs.js';
import { EDGE_ALGS } from '../../data/edgeAlgs.js';
import FormulaCubePanel from './FormulaCubePanel.jsx';

export default function FormulaTab() {
  const { memoTable } = useMemoTableCtx();
  const [section, setSection] = useState('corner');
  const [sectionChosen, setSectionChosen] = useState(false);
  const [filter, setFilter] = useState(null);
  const [selected, setSelected] = useState(null);

  const data = section === 'corner' ? CORNER_ALGS : EDGE_ALGS;

  const firstChars = useMemo(() => {
    const chars = new Set(Object.keys(data).map(k => k[0]));
    return ZHUYIN_ORDER.filter(z => chars.has(z));
  }, [data]);

  const pairs = useMemo(() => {
    return Object.keys(data).filter(k => !filter || k[0] === filter);
  }, [data, filter]);

  function switchSection(s) {
    setSection(s);
    setFilter(null);
    setSelected(null);
    setSectionChosen(true);
  }

  function handlePairClick(pair) {
    setSelected(selected === pair ? null : pair);
  }

  return (
    <div>
      <h2 style={{ fontFamily: "'Crimson Pro', serif", fontSize: '20px', color: 'var(--gold)', marginBottom: '16px' }}>
        執行公式
      </h2>

      <div className="formula-toggle">
        <button
          className={`formula-toggle-btn${section === 'corner' ? ' active' : ''}`}
          onClick={() => switchSection('corner')}
        >
          角
        </button>
        <button
          className={`formula-toggle-btn${section === 'edge' ? ' active' : ''}`}
          onClick={() => switchSection('edge')}
        >
          邊
        </button>
      </div>

      {sectionChosen && (
        <>
          <div className="zhuyin-filter">
            {firstChars.map(z => (
              <button
                key={z}
                className={`zf-btn${filter === z ? ' active' : ''}`}
                onClick={() => { setFilter(z); setSelected(null); }}
              >
                {z}
              </button>
            ))}
          </div>

          <div className="formula-pairs-grid">
            {pairs.map(pair => (
              <button
                key={pair}
                className={`formula-pair-btn${selected === pair ? ' active' : ''}`}
                onClick={() => handlePairClick(pair)}
              >
                {pair}
              </button>
            ))}
          </div>
        </>
      )}

      {selected && (
        <div className="formula-detail">
          <div className="formula-detail-pair">{selected}</div>
          {memoTable[selected] && (
            <div className="formula-detail-word">{memoTable[selected]}</div>
          )}
          <div className="formula-detail-alg">{data[selected]}</div>

          {/* 方塊播放器（獨立 component，確保 hook 合規） */}
          <FormulaCubePanel
            pair={selected}
            section={section}
            algoStr={data[selected]}
          />
        </div>
      )}
    </div>
  );
}
