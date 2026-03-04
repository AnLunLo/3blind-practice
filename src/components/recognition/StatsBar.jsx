export default function StatsBar({ stats, onReset }) {
  return (
    <div className="stats-bar">
      <span className="stat-c">✓ <span>{stats.c}</span></span>
      <span className="stat-w">✗ <span>{stats.w}</span></span>
      <button
        onClick={onReset}
        style={{ background: 'none', border: 'none', color: 'var(--muted2)', fontSize: '11px', padding: '0', cursor: 'pointer' }}
        title="重置計數"
      >↺</button>
    </div>
  );
}
