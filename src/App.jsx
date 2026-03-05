import { createContext, useContext, useState } from 'react';
import { useMemoTable } from './hooks/useMemoTable.js';
import Header from './components/Header.jsx';
import Nav from './components/Nav.jsx';
import RecognitionTab from './components/recognition/RecognitionTab.jsx';
import IdentifyTab from './components/identify/IdentifyTab.jsx';
import PracticeTab from './components/practice/PracticeTab.jsx';
import RefTab from './components/ref/RefTab.jsx';

export const MemoTableContext = createContext(null);
export function useMemoTableCtx() { return useContext(MemoTableContext); }

const TABS = ['recognition', 'identify', 'practice', 'ref'];

export default function App() {
  const [activeTab, setActiveTab] = useState('recognition');
  const memoTableCtx = useMemoTable();

  return (
    <MemoTableContext.Provider value={memoTableCtx}>
      <div className="app">
        <Header />
        <Nav activeTab={activeTab} onTabChange={setActiveTab} />
        <main>
          {/* display:none keeps Three.js canvases alive across tab switches */}
          {TABS.map(tab => (
            <div key={tab} style={{ display: activeTab === tab ? '' : 'none' }}>
              {tab === 'recognition' && <RecognitionTab />}
              {tab === 'identify'    && <IdentifyTab />}
              {tab === 'practice'    && <PracticeTab />}
              {tab === 'ref'         && <RefTab />}
            </div>
          ))}
        </main>
      </div>
    </MemoTableContext.Provider>
  );
}
