import { useState, useCallback } from 'react';
import { buildCharMap } from '../lib/zhuyinUtils.js';

/**
 * Practice session: show a word, user must click all 4 sticker positions
 * corresponding to the pair (2 chars × corner+edge each = 4 targets).
 *
 * @param {object} memoTable
 */
export function usePracticeSession(memoTable) {
  const [current, setCurrent] = useState(null);
  // done[i] = true when the i-th target has been correctly clicked
  const [done, setDone] = useState([false, false, false, false]);
  const [answered, setAnswered] = useState(false);
  const [stats, setStats] = useState({ c: 0, w: 0 });

  const nextQuestion = useCallback(() => {
    const charMap = buildCharMap();
    const entries = Object.entries(memoTable);
    if (!entries.length) return;

    // Keep trying until we find a pair whose both chars have corner + edge
    let pair, word, targets;
    let attempts = 0;
    do {
      const [p, w] = entries[Math.floor(Math.random() * entries.length)];
      const [a, b] = [...p];
      const ca = charMap[a], cb = charMap[b];
      if (ca?.corner && ca?.edge && cb?.corner && cb?.edge) {
        pair = p;
        word = w;
        // targets order: a-corner, a-edge, b-corner, b-edge
        targets = [ca.corner, ca.edge, cb.corner, cb.edge];
      }
      attempts++;
    } while (!targets && attempts < 200);

    if (!targets) return;

    // avoid repeating the same word
    if (current && pair === current.pair && attempts < 100) {
      nextQuestion();
      return;
    }

    setCurrent({ pair, word, targets });
    setDone([false, false, false, false]);
    setAnswered(false);
  }, [memoTable, current]);

  /**
   * Returns { hit, hitIdx, faceName }
   * Used by the cube hook to flash colours imperatively.
   */
  const handleClick = useCallback((cubiePos, faceIndex) => {
    if (!current || answered) return { hit: false, hitIdx: -1, faceName: null };

    let hitIdx = -1;
    for (let i = 0; i < 4; i++) {
      if (done[i]) continue;
      const t = current.targets[i];
      if (cubiePos.cx === t.cx && cubiePos.cy === t.cy &&
          cubiePos.cz === t.cz && faceIndex === t.faceIdx) {
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

    const allDone = newDone.every(Boolean);
    if (allDone) setAnswered(true);

    return { hit: true, hitIdx, faceName: current.targets[hitIdx].faceName };
  }, [current, done, answered]);

  const resetStats = useCallback(() => setStats({ c: 0, w: 0 }), []);

  return { current, done, answered, stats, handleClick, nextQuestion, resetStats };
}
