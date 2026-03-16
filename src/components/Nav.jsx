const TABS = [
  { id: 'practice',    icon: '◐', label: '基礎練習' },
  { id: 'recognition', icon: '◈', label: '編碼練習' },
  // { id: 'identify',    icon: '◎', label: '指認' },
  { id: 'ref',         icon: '≡', label: '公式表' },
  { id: 'formula',    icon: '⊛', label: '公式展示' },
];

export default function Nav({ activeTab, onTabChange }) {
  return (
    <nav>
      {TABS.map(t => (
        <button
          key={t.id}
          className={`nav-btn${activeTab === t.id ? ' active' : ''}`}
          onClick={() => onTabChange(t.id)}
        >
          <span className="icon">{t.icon}</span>
          {t.label}
        </button>
      ))}
    </nav>
  );
}
