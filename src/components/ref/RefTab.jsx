import { useState, useMemo } from 'react';
import { useMemoTableCtx } from '../../App.jsx';
import { ZHUYIN_ORDER } from '../../data/constants.js';
import { MEMO_DATA } from '../../data/memoData.js';
import RefGroup from './RefGroup.jsx';
import RefCard from './RefCard.jsx';

export default function RefTab() {
  const { memoTable, updateEntry, resetEntry, resetAll, hasOverride, overrideCount } = useMemoTableCtx();
  const [search, setSearch] = useState('');

  // Build groups for accordion
  const groups = useMemo(() => {
    const g = {};
    ZHUYIN_ORDER.forEach(z => { g[z] = []; });
    for (const key of Object.keys(MEMO_DATA)) {
      const first = key[0];
      if (g[first]) g[first].push({ key });
    }
    return g;
  }, []);

  // Search results: match pair key or word
  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.trim();
    return Object.keys(memoTable)
      .filter(key => key.includes(q) || memoTable[key].includes(q))
      .map(key => ({ key, word: memoTable[key] }));
  }, [search, memoTable]);

  const isSearching = search.trim().length > 0;

  return (
    <div>
      <h2 style={{ fontFamily: "'Crimson Pro', serif", fontSize: '20px', color: 'var(--gold)', marginBottom: '16px' }}>
        位置編碼參考表
      </h2>

      <div className="ref-search-bar">
        <input
          className="ref-search-input"
          placeholder="🔍 搜尋注音或記憶詞..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {overrideCount > 0 && (
          <button
            className="ref-reset-all-btn"
            onClick={resetAll}
            title={`重置全部 ${overrideCount} 筆自訂`}
          >
            全部重置（{overrideCount}）
          </button>
        )}
      </div>

      {isSearching ? (
        <div className="ref-search-results">
          <div className="ref-search-label">搜尋結果（{searchResults.length} 筆）</div>
          {searchResults.length === 0 ? (
            <div style={{ color: '#bbb', fontSize: '13px', padding: '12px 0' }}>找不到符合的項目</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {searchResults.map(({ key }) => (
                <RefCard
                  key={key}
                  pair={key}
                  word={memoTable[key]}
                  hasOverride={hasOverride(key)}
                  onSave={updateEntry}
                  onReset={resetEntry}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div id="ref-accordion">
          {ZHUYIN_ORDER.map(z => {
            const items = groups[z];
            if (!items || !items.length) return null;
            return (
              <RefGroup
                key={z}
                initial={z}
                items={items}
                memoTable={memoTable}
                hasOverride={hasOverride}
                onSave={updateEntry}
                onReset={resetEntry}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
