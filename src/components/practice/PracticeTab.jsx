import { useRef, useEffect } from 'react';
import { forwardRef, useImperativeHandle } from 'react';
import { useMemoTableCtx } from '../../App.jsx';
import { usePracticeSession } from '../../hooks/usePracticeSession.js';
import { useCube } from '../../hooks/useCube.js';
import StatsBar from '../recognition/StatsBar.jsx';
import PracticePrompt from './PracticePrompt.jsx';

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
  const { current, done, answered, stats, handleClick, nextQuestion, resetStats } = usePracticeSession(memoTable);
  const cubeRef = useRef(null);

  useEffect(() => { nextQuestion(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function onNext() {
    cubeRef.current?.resetColors();
    nextQuestion();
  }

  return (
    <div>
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
