import { forwardRef, useImperativeHandle } from 'react';
import { useCube } from '../../hooks/useCube.js';

const IdentifyCube = forwardRef(function IdentifyCube({ onStickerClick }, ref) {
  const { canvasRef, resetColors } = useCube({ mode: 'identify', onStickerClick });
  useImperativeHandle(ref, () => ({ resetColors }), [resetColors]);

  return (
    <div className="id-cube-wrap">
      <canvas ref={canvasRef} className="id-cube-canvas" />
    </div>
  );
});

export default IdentifyCube;
