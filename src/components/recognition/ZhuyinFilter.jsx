import { ZHUYIN_ORDER } from '../../data/constants.js';

export default function ZhuyinFilter({ filter, onChange }) {
  return (
    <div className="zhuyin-filter">
      <button
        className={`zf-btn${filter === null ? ' active' : ''}`}
        onClick={() => onChange(null)}
      >
        全部
      </button>
      {ZHUYIN_ORDER.map(z => (
        <button
          key={z}
          className={`zf-btn${filter === z ? ' active' : ''}`}
          onClick={() => onChange(z)}
        >
          {z}
        </button>
      ))}
    </div>
  );
}
