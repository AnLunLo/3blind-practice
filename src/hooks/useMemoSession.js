import { useState, useRef, useCallback, useEffect } from 'react';
import { CORNERS, EDGES, CORNER_BUFFER, EDGE_BUFFER } from '../data/pieces.js';
import { getSeq, makePairs, fmtTime } from '../lib/zhuyinUtils.js';

export function useMemoSession(memoTable) {
  const [phase, setPhase] = useState('memo'); // 'memo' | 'input' | 'result'
  const [timerDisplay, setTimerDisplay] = useState('00.0s');
  const [finalMs, setFinalMs] = useState(0);
  const [result, setResult] = useState(null); // { cornerDiff, edgeDiff }

  const msRef = useRef(0);
  const intervalRef = useRef(null);

  const cornerSeq = getSeq(CORNERS, CORNER_BUFFER);
  const edgeSeq = getSeq(EDGES, EDGE_BUFFER);
  const cornerPairs = makePairs(cornerSeq, memoTable);
  const edgePairs = makePairs(edgeSeq, memoTable);

  const startTimer = useCallback(() => {
    clearInterval(intervalRef.current);
    msRef.current = 0;
    setTimerDisplay('00.0s');
    intervalRef.current = setInterval(() => {
      msRef.current += 100;
      setTimerDisplay(fmtTime(msRef.current));
    }, 100);
  }, []);

  const stopMemo = useCallback(() => {
    clearInterval(intervalRef.current);
    setFinalMs(msRef.current);
    setPhase('input');
  }, []);

  const checkMemo = useCallback((cornerInput, edgeInput) => {
    const tokens = s => [...s.replace(/\s/g, '')];
    const cornerDiff = cornerSeq.map((z, i) => ({ z, ok: tokens(cornerInput)[i] === z }));
    const edgeDiff = edgeSeq.map((z, i) => ({ z, ok: tokens(edgeInput)[i] === z }));
    setResult({ cornerDiff, edgeDiff });
    setPhase('result');
  }, [cornerSeq, edgeSeq]);

  const retry = useCallback(() => {
    setResult(null);
    setPhase('memo');
  }, []);

  // Start timer whenever we enter memo phase
  useEffect(() => {
    if (phase === 'memo') startTimer();
    return () => clearInterval(intervalRef.current);
  }, [phase, startTimer]);

  return {
    phase,
    timerDisplay,
    finalMs,
    result,
    cornerPairs,
    edgePairs,
    cornerSeq,
    edgeSeq,
    stopMemo,
    checkMemo,
    retry,
  };
}
