import { useRef, useEffect } from 'react';
import { useIdentifySession } from '../../hooks/useIdentifySession.js';
import StatsBar from '../recognition/StatsBar.jsx';
import IdentifyPrompt from './IdentifyPrompt.jsx';
import IdentifyCube from './IdentifyCube.jsx';

export default function IdentifyTab() {
  const { current, done, answered, stats, handleClick, nextQuestion, resetStats } = useIdentifySession();
  const cubeRef = useRef(null);

  useEffect(() => { nextQuestion(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function onNext() {
    cubeRef.current?.resetColors();
    nextQuestion();
  }

  return (
    <div>
      <StatsBar stats={stats} onReset={resetStats} />
      <IdentifyPrompt current={current} done={done} />
      <IdentifyCube ref={cubeRef} onStickerClick={handleClick} />
      <div style={{ textAlign: 'center', paddingBottom: '24px' }}>
        {answered && (
          <button className="btn-next" onClick={onNext}>下一題 →</button>
        )}
      </div>
    </div>
  );
}
