import { useState, useCallback } from 'react';
import { getAllPairs } from '../lib/zhuyinUtils.js';

function normalize(s) {
  return s.trim().replace(/\s+/g, '');
}

/**
 * @param {object} memoTable
 * @param {string|null} filter — 篩選的注音字（null = 全部）
 */
export function useQuizSession(memoTable, filter) {
  const [current, setCurrent] = useState(null);
  const [stats, setStats] = useState({ c: 0, w: 0 });
  const [phase, setPhase] = useState('question'); // 'question' | 'answered'
  const [lastCorrect, setLastCorrect] = useState(null);

  const nextQuestion = useCallback(() => {
    let pool = getAllPairs(memoTable);
    // 若有篩選，只保留 pair 包含該注音字的題目
    if (filter) pool = pool.filter(({ pair }) => pair.includes(filter));
    if (!pool.length) { setCurrent(null); return; }
    let item;
    do { item = pool[Math.floor(Math.random() * pool.length)]; }
    while (pool.length > 1 && current && item.pair === current.pair);
    setCurrent(item);
    setPhase('question');
    setLastCorrect(null);
  }, [memoTable, filter, current]);

  const submitAnswer = useCallback((userInput) => {
    if (!current || phase !== 'question') return;
    const ok = normalize(userInput) === normalize(current.word);
    setLastCorrect(ok);
    setStats(prev => ({ c: prev.c + (ok ? 1 : 0), w: prev.w + (ok ? 0 : 1) }));
    setPhase('answered');
  }, [current, phase]);

  const resetStats = useCallback(() => {
    setStats({ c: 0, w: 0 });
  }, []);

  return { current, stats, phase, lastCorrect, submitAnswer, nextQuestion, resetStats };
}
