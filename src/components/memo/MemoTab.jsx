import { useMemoTableCtx } from '../../App.jsx';
import { useMemoSession } from '../../hooks/useMemoSession.js';
import MemoPhase from './MemoPhase.jsx';
import InputPhase from './InputPhase.jsx';
import ResultPhase from './ResultPhase.jsx';

export default function MemoTab() {
  const { memoTable } = useMemoTableCtx();
  const { phase, timerDisplay, finalMs, result, cornerPairs, edgePairs, cornerSeq, edgeSeq, stopMemo, checkMemo, retry } = useMemoSession(memoTable);

  return (
    <div>
      {phase === 'memo' && (
        <MemoPhase
          timerDisplay={timerDisplay}
          cornerPairs={cornerPairs}
          edgePairs={edgePairs}
          onStop={stopMemo}
        />
      )}
      {phase === 'input' && (
        <InputPhase
          cornerSeq={cornerSeq}
          edgeSeq={edgeSeq}
          onCheck={checkMemo}
        />
      )}
      {phase === 'result' && (
        <ResultPhase
          finalMs={finalMs}
          result={result}
          onRetry={retry}
        />
      )}
    </div>
  );
}
