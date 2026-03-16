import { useRef, useEffect, useState, useCallback } from 'react';
import { useMemoTableCtx } from '../../App.jsx';
import { useQuizSession } from '../../hooks/useQuizSession.js';
import StatsBar from './StatsBar.jsx';
import QuizPrompt from './QuizPrompt.jsx';
import QuizCube from './QuizCube.jsx';
import ZhuyinFilter from './ZhuyinFilter.jsx';

export default function RecognitionTab() {
  const { memoTable } = useMemoTableCtx();
  const [filter, setFilter] = useState(null); // null = 全部
  const { current, stats, phase, lastCorrect, submitAnswer, nextQuestion, resetStats } = useQuizSession(memoTable, filter);
  const cubeRef = useRef(null);

  // Start first question on mount
  useEffect(() => { nextQuestion(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Highlight cube whenever question changes
  useEffect(() => {
    if (current?.pair) cubeRef.current?.highlightPair(current.pair);
  }, [current?.pair]);

  // When filter changes: reset stats and jump to new question immediately
  const handleFilterChange = useCallback((z) => {
    setFilter(z);
    resetStats();
  }, [resetStats]);

  // Trigger nextQuestion whenever filter changes (after state update)
  useEffect(() => {
    nextQuestion();
  }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <ZhuyinFilter filter={filter} onChange={handleFilterChange} />
      <div className="quiz-wrap">
        <StatsBar stats={stats} onReset={resetStats} />
        <QuizPrompt
          current={current}
          phase={phase}
          lastCorrect={lastCorrect}
          onSubmit={submitAnswer}
          onNext={nextQuestion}
        />
      </div>
      {/* <QuizCube ref={cubeRef} /> */}
    </div>
  );
}
