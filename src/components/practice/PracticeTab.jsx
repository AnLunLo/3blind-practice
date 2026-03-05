import { useRef, useEffect, useState } from 'react';
import { forwardRef, useImperativeHandle } from 'react';
import { useMemoTableCtx } from '../../App.jsx';
import { usePracticeSession } from '../../hooks/usePracticeSession.js';
import { useCube } from '../../hooks/useCube.js';
import StatsBar from '../recognition/StatsBar.jsx';
import PracticePrompt from './PracticePrompt.jsx';
import ZhuyinFilter from '../recognition/ZhuyinFilter.jsx';

// Cube wrapper — same as IdentifyCube
const PracticeCube = forwardRef(function PracticeCube({ onStickerClick }, ref) {
  const { canvasRef, resetColors } = useCube({ mode: 'identify', onStickerClick });
  useImperativeHandle(ref, () => ({ resetColors }), [resetColors]);
  return (
    <div className="id-cube-wrap">
      <canvas ref={canvasRef} className="id-cube-canvas" />
    </div>
  );
});

export default function PracticeTab() {
  const { memoTable } = useMemoTableCtx();
  const [filter, setFilter] = useState(null);
  const { current, done, answered, stats, handleClick, nextQuestion, resetStats } = usePracticeSession(memoTable, filter);
  const cubeRef = useRef(null);

  useEffect(() => { nextQuestion(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function onFilterChange(f) {
    setFilter(f);
    resetStats();
    cubeRef.current?.resetColors();
    // nextQuestion will re-run via the effect below
  }

  // Re-draw a new question whenever filter changes
  useEffect(() => {
    if (current !== null) {
      cubeRef.current?.resetColors();
      nextQuestion();
    }
  }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  function onNext() {
    cubeRef.current?.resetColors();
    nextQuestion();
  }

  return (
    <div>
      <ZhuyinFilter filter={filter} onChange={onFilterChange} />
      <StatsBar stats={stats} onReset={resetStats} />
      <PracticePrompt current={current} done={done} />
      <PracticeCube ref={cubeRef} onStickerClick={handleClick} />
      <div style={{ textAlign: 'center', paddingBottom: '24px' }}>
        {answered && (
          <button className="btn-next" onClick={onNext}>下一題 →</button>
        )}
      </div>
    </div>
  );
}
