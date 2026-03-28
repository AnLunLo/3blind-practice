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
// 引擎初始化與更新邏輯
  useEffect(() => {
    // 1. 當 selected 被清空（切換父項目或注音時），清理並釋放舊引擎
    if (!selected) {
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null; // 關鍵：重置 ref，讓下次選中時能觸發重新建立
        delete window.cubeApp;
      }
      return; 
    }

    if (!viewportRef.current) return;

    // 2. 確保引擎存在 (如果是重新選中，上方已經清空了，這裡就會重新建立並綁定新 DOM)
    if (!engineRef.current) {
      const engine = new CubeEngine(viewportRef.current, (newState) => {
        setState(newState);
      });
      engineRef.current = engine;
      window.cubeApp = engine;

      const handleResize = () => engine.resize();
      window.addEventListener('resize', handleResize);
      
      // 建議：將 resize 的清理綁定在引擎實例上，或者確保 engine.dispose() 內部有處理
    }

    // 3. 載入並展開公式
    const rawAlg = data[selected];
    const fullAlg = expandAlgorithm(rawAlg);
    engineRef.current.setAlgorithm(fullAlg);
    
  }, [selected, data]);

  // 4. 新增一個獨立的 useEffect 處理組件銷毀
  useEffect(() => {
    return () => {
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
        delete window.cubeApp;
      }
    };
  }, []); // 只有在 FormulaTab 徹底消失時執行
  
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

  // 定義內聯 SVG 圖標，確保一定能顯示
  const icons = {
    undo: <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/></svg>,
    prev: <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>,
    next: <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6 18l8.5-6L6 6zm9-12h2v12h-2z"/></svg>,
    play: <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>,
    pause: <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>,
    first: <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M18.41 16.59L13.82 12l4.59-4.59L17 6l-6 6 6 6zM6 6h2v12H6z"/></svg>,
    last: <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M5.59 7.41L10.18 12l-4.59 4.59L7 18l6-6-6-6zM16 6h2v12h-2z"/></svg>
  };

  return (
    <div className="algo-panel"> {/* 使用你 css 裡的 algo-panel 容器 */}
      <div className="move-display">
        <MoveDisplay algorithm={state.algorithm} currentStep={currentStep} />
      </div>

      <div className="algo-speed-row">
        <input
          type="range"
          className="algo-speed-slider"
          min={0}
          max={totalSteps}
          value={currentStep}
          onChange={(e) => engine.current?.goToStep(parseInt(e.target.value))}
        />
        <button className="speed-btn" onClick={cycleSpeed}>
          {SPEED_OPTIONS[speedIndex]}x
        </button>
      </div>
      <div className="button-group">
        {/* 復原/回到起點，使用引擎內建的 skipToStart() 會自動處理暫停與跳轉 */}
        <button className="ctrl-btn" onClick={() => engine.current?.skipToStart()}>{icons.undo}</button>
        <button className="ctrl-btn" onClick={() => engine.current?.skipToStart()}>{icons.first}</button>
        
        {/* 單步後退：先暫停播放，再觸發後退動畫 */}
        <button className="ctrl-btn" onClick={() => { 
          engine.current?.pause(); 
          engine.current?.stepBackward(); 
        }}>{icons.prev}</button>
        
        {/* 播放/暫停鍵維持原樣 */}
        <button className="ctrl-btn play-btn" onClick={() => engine.current?.togglePlay()}>
          {isPlaying ? icons.pause : icons.play}
        </button>

        {/* 單步前進：先暫停播放，再觸發前進動畫 */}
        <button className="ctrl-btn" onClick={() => { 
          engine.current?.pause(); 
          engine.current?.stepForward(); 
        }}>{icons.next}</button>
        
        {/* 跳到結尾，使用引擎內建的 skipToEnd() */}
        <button className="ctrl-btn" onClick={() => engine.current?.skipToEnd()}>{icons.last}</button>
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