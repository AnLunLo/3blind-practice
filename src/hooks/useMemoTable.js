import { useState, useCallback, useMemo } from 'react';
import { MEMO_DATA } from '../data/memoData.js';

const LS_KEY = 'bld-memo-overrides';

function loadOverrides() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveOverrides(overrides) {
  if (Object.keys(overrides).length === 0) {
    localStorage.removeItem(LS_KEY);
  } else {
    localStorage.setItem(LS_KEY, JSON.stringify(overrides));
  }
}

export function useMemoTable() {
  const [overrides, setOverrides] = useState(loadOverrides);

  const memoTable = useMemo(() => ({ ...MEMO_DATA, ...overrides }), [overrides]);

  const updateEntry = useCallback((pair, word) => {
    setOverrides(prev => {
      const next = { ...prev };
      // If the word matches the default, remove override (no need to store it)
      if (word === MEMO_DATA[pair]) {
        delete next[pair];
      } else {
        next[pair] = word;
      }
      saveOverrides(next);
      return next;
    });
  }, []);

  const resetEntry = useCallback((pair) => {
    setOverrides(prev => {
      const next = { ...prev };
      delete next[pair];
      saveOverrides(next);
      return next;
    });
  }, []);

  const resetAll = useCallback(() => {
    setOverrides({});
    localStorage.removeItem(LS_KEY);
  }, []);

  const hasOverride = useCallback((pair) => pair in overrides, [overrides]);

  const overrideCount = Object.keys(overrides).length;

  return { memoTable, updateEntry, resetEntry, resetAll, hasOverride, overrideCount };
}
