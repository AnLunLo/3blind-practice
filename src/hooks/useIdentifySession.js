import { useState, useCallback } from 'react';
import { getIdentifyPool } from '../lib/zhuyinUtils.js';

export function useIdentifySession() {
  const [current, setCurrent] = useState(null);
  const [done, setDone] = useState([false, false]);
  const [answered, setAnswered] = useState(false);
  const [stats, setStats] = useState({ c: 0, w: 0 });

  const nextQuestion = useCallback(() => {
    const pool = getIdentifyPool();
    if (!pool.length) return;
    let item;
    do { item = pool[Math.floor(Math.random() * pool.length)]; }
    while (pool.length > 1 && current && item.char === current.char);
    setCurrent(item);
    setDone([false, false]);
    setAnswered(false);
  }, [current]);

  /**
   * handleClick returns { hit: boolean, hitIdx: number, faceName: string | null }
   * The cube hook reads this result to update material colors imperatively.
   */
  const handleClick = useCallback((cubiePos, faceIndex) => {
    if (!current || answered) return { hit: false, hitIdx: -1, faceName: null };

    const targets = current.targets;
    let hitIdx = -1;

    for (let i = 0; i < 2; i++) {
      if (done[i]) continue;
      const t = targets[i];
      if (cubiePos.cx === t.cx && cubiePos.cy === t.cy && cubiePos.cz === t.cz && faceIndex === t.faceIdx) {
        hitIdx = i;
        break;
      }
    }

    if (hitIdx === -1) {
      setStats(prev => ({ ...prev, w: prev.w + 1 }));
      return { hit: false, hitIdx: -1, faceName: null };
    }

    const newDone = [...done];
    newDone[hitIdx] = true;
    setDone(newDone);
    setStats(prev => ({ ...prev, c: prev.c + 1 }));

    const allDone = newDone[0] && newDone[1];
    if (allDone) setAnswered(true);

    return { hit: true, hitIdx, faceName: targets[hitIdx].faceName };
  }, [current, done, answered]);

  const resetStats = useCallback(() => setStats({ c: 0, w: 0 }), []);

  return { current, done, answered, stats, handleClick, nextQuestion, resetStats };
}
