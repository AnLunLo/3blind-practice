import { forwardRef, useImperativeHandle } from 'react';
import { useCube } from '../../hooks/useCube.js';

const QuizCube = forwardRef(function QuizCube(_, ref) {
  const { canvasRef, highlightPair } = useCube({ mode: 'quiz' });
  useImperativeHandle(ref, () => ({ highlightPair }), [highlightPair]);

  return (
    <div className="quiz-cube-wrap">
      <canvas ref={canvasRef} className="quiz-cube-canvas" />
    </div>
  );
});

export default QuizCube;
