import { useRef } from 'react';

export default function InputPhase({ cornerSeq, edgeSeq, onCheck }) {
  const cornerRef = useRef(null);
  const edgeRef = useRef(null);

  function handleCheck() {
    onCheck(cornerRef.current.value, edgeRef.current.value);
  }

  return (
    <div>
      <div style={{ color: '#bbb', fontSize: '14px', marginBottom: '20px', textAlign: 'center' }}>
        輸入你記憶的注音序列：
      </div>
      <div className="memo-input-wrap">
        <label className="memo-input-label">角塊（{cornerSeq.length} 個注音）</label>
        <input ref={cornerRef} className="memo-input" autoComplete="off" autoFocus />
      </div>
      <div className="memo-input-wrap">
        <label className="memo-input-label">邊塊（{edgeSeq.length} 個注音）</label>
        <input ref={edgeRef} className="memo-input" autoComplete="off" />
      </div>
      <button className="btn-primary" onClick={handleCheck}>驗證答案</button>
    </div>
  );
}
