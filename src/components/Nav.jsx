const TABS = [
  { id: 'recognition', icon: '◈', label: '辨識' },
  { id: 'identify',    icon: '◎', label: '指認' },
  { id: 'practice',    icon: '◐', label: '練習' },
  { id: 'ref',         icon: '≡', label: '參考表' },
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
