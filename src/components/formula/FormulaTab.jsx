import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useMemoTableCtx } from '../../App.jsx';
import { ZHUYIN_ORDER, SPEED_OPTIONS } from '../../data/constants.js';
import { CORNER_ALGS } from '../../data/cornerAlgs.js';
import { EDGE_ALGS } from '../../data/edgeAlgs.js';
import { CubeEngine } from '../../data/CubeEngine';
import { moveToString } from '../../data/algorithmParser';

// --- 輔助函數移至外部 ---

// 輔助函數：將公式反轉 (例如 R U' -> U R')
function reverseAlgorithm(alg) {
  if (!alg) return "";
  // 1. 先將字串拆解成陣列並反轉順序
  const moves = alg.split(' ').filter(m => m.trim().length > 0);
  
  return moves.reverse().map(move => {
    // 如果動作包含 '2'，逆動作保持不變 (例如 L2' 逆動作還是 L2')
    if (move.includes("2")) {
      return move;
    }
    // 如果動作包含撇號，移除它 (例如 F' -> F)
    if (move.endsWith("'")) {
      return move.slice(0, -1);
    }
    // 如果是單純動作，加上撇號 (例如 L -> L')
    return move + "'";
  }).join(' ');
}

// 簡易解析器：處理 Setup 與 Commutator
function expandAlgorithm(algStr) {
  if (!algStr) return "";

  // 1. 處理 Setup Move (S : [A, B])
  if (algStr.includes(':')) {
    const parts = algStr.split(':');
    const setup = parts[0].trim();
    const commutator = parts[1].trim();
    
    const expandedComm = expandAlgorithm(commutator);
    const invSetup = reverseAlgorithm(setup);
    
    return `${setup} ${expandedComm} ${invSetup}`;
  }

  // 2. 處理 Commutator ([A, B])
  if (algStr.startsWith('[') && algStr.endsWith(']')) {
    const inner = algStr.slice(1, -1);
    const parts = inner.split(',').map(s => s.trim());
    if (parts.length !== 2) return inner;
    const [A, B] = parts;
    return `${A} ${B} ${reverseAlgorithm(A)} ${reverseAlgorithm(B)}`;
  }

  return algStr;
}

export default function FormulaTab() {
  const viewportRef = useRef(null);
  const engineRef = useRef(null);
  const { memoTable } = useMemoTableCtx();
  
  const [section, setSection] = useState('corner');
  const [sectionChosen, setSectionChosen] = useState(false);
  const [filter, setFilter] = useState(null);
  const [selected, setSelected] = useState(null);

  const [state, setState] = useState({
    currentStep: 0,
    totalSteps: 0,
    isPlaying: false,
    algorithm: [],
  });

  const data = section === 'corner' ? CORNER_ALGS : EDGE_ALGS;

  // 引擎初始化與更新邏輯
  useEffect(() => {
    if (!selected || !viewportRef.current) return;

    if (!engineRef.current) {
      const engine = new CubeEngine(viewportRef.current, (newState) => {
        setState(newState);
      });
      engineRef.current = engine;
      window.cubeApp = engine;

      const handleResize = () => engine.resize();
      window.addEventListener('resize', handleResize);
    }

    // 載入並展開公式
    const rawAlg = data[selected];
    const fullAlg = expandAlgorithm(rawAlg);
    engineRef.current.setAlgorithm(fullAlg);

    return () => {
      // 當取消選擇公式時，徹底清理引擎以釋放資源並避免下次掛載錯誤
      if (!selected && engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
        delete window.cubeApp;
        window.removeEventListener('resize', () => engineRef.current?.resize());
      }
    };
  }, [selected, data]);

  // 子組件：顯示步驟
  function MoveDisplay({ algorithm, currentStep }) {
    return (
      <div className="move-display">
        {algorithm.map((move, i) => (
          <span key={i} className={i < currentStep ? 'done' : i === currentStep ? 'current' : 'pending'}>
            {moveToString(move)}
          </span>
        ))}
      </div>
    );
  }

  // 子組件：播放控制器
  function PlaybackControls({ engine, state }) {
    const [speedIndex, setSpeedIndex] = useState(1);
    const { currentStep, totalSteps, isPlaying } = state;

    const cycleSpeed = useCallback(() => {
      setSpeedIndex((prev) => {
        const next = (prev + 1) % SPEED_OPTIONS.length;
        engine.current?.setSpeed(SPEED_OPTIONS[next]);
        return next;
      });
    }, [engine]);

    return (
      <div className="controls">
        <MoveDisplay algorithm={state.algorithm} currentStep={currentStep} />
        <div className="progress-row">
          <input
            type="range"
            min={0}
            max={totalSteps}
            value={currentStep}
            onChange={(e) => engine.current?.goToStep(parseInt(e.target.value))}
          />
          <button className="speed-btn" onClick={cycleSpeed}>
            {SPEED_OPTIONS[speedIndex]}x
          </button>
        </div>
        <div className="btn-row">
            <button className="play-btn" onClick={() => engine.current?.togglePlay()}>
                {isPlaying ? '暫停' : '播放'}
            </button>
        </div>
      </div>
    );
  }

  const firstChars = useMemo(() => {
    const chars = new Set(Object.keys(data).map(k => k[0]));
    return ZHUYIN_ORDER.filter(z => chars.has(z));
  }, [data]);

  const pairs = useMemo(() => {
    return Object.keys(data).filter(k => !filter || k[0] === filter);
  }, [data, filter]);

  function switchSection(s) {
    setSection(s);
    setFilter(null);
    setSelected(null);
    setSectionChosen(true);
  }

  function handlePairClick(pair) {
    setSelected(selected === pair ? null : pair);
  }

  return (
    <div>
      <h2 style={{ fontFamily: "'Crimson Pro', serif", fontSize: '20px', color: 'var(--gold)', marginBottom: '16px' }}>
        執行公式
      </h2>

      <div className="formula-toggle">
        <button
          className={`formula-toggle-btn${section === 'corner' ? ' active' : ''}`}
          onClick={() => switchSection('corner')}
        >
          角
        </button>
        <button
          className={`formula-toggle-btn${section === 'edge' ? ' active' : ''}`}
          onClick={() => switchSection('edge')}
        >
          邊
        </button>
      </div>

      {sectionChosen && (
        <>
          <div className="zhuyin-filter">
            {firstChars.map(z => (
              <button
                key={z}
                className={`zf-btn${filter === z ? ' active' : ''}`}
                onClick={() => { setFilter(z); setSelected(null); }}
              >
                {z}
              </button>
            ))}
          </div>

          <div className="formula-pairs-grid">
            {pairs.map(pair => (
              <button
                key={pair}
                className={`formula-pair-btn${selected === pair ? ' active' : ''}`}
                onClick={() => handlePairClick(pair)}
              >
                {pair}
              </button>
            ))}
          </div>
        </>
      )}

      {selected && (
        <div className="formula-detail">
          <div className="formula-detail-pair">{selected}</div>
          {memoTable[selected] && (
            <div className="formula-detail-word">{memoTable[selected]}</div>
          )}
          <div className="formula-detail-alg">{data[selected]}</div>
          <div className="cube-container">
            <div className="viewport" ref={viewportRef} />
            <PlaybackControls engine={engineRef} state={state} />
          </div>
        </div>
      )}
    </div>
  );
}