// import { ZHUYIN_ORDER } from '../../data/constants.js';

// export default function ZhuyinFilter({ filter, onChange }) {
//   return (
//     <div className="zhuyin-filter">
//       <button
//         className={`zf-btn${filter === null ? ' active' : ''}`}
//         onClick={() => onChange(null)}
//       >
//         全部
//       </button>
//       {ZHUYIN_ORDER.map(z => (
//         <button
//           key={z}
//           className={`zf-btn${filter === z ? ' active' : ''}`}
//           onClick={() => onChange(z)}
//         >
//           {z}
//         </button>
//       ))}
//     </div>
//   );
// }
import { ZHUYIN_ORDER } from '../../data/constants.js';

// 將 filter 改名為 filters (陣列)，預設值給空陣列 []
export default function ZhuyinFilter({ filters = [], onChange }) {
  
  // 處理點擊個別注音的邏輯
  const handleToggle = (z) => {
    if (filters.includes(z)) {
      // 如果已經在陣列中，就把它過濾掉 (移除)
      onChange(filters.filter(item => item !== z));
    } else {
      // 如果不在陣列中，就把它加進去
      onChange([...filters, z]);
    }
  };

  return (
    <div className="zhuyin-filter">
      <button
        // 當陣列為空時，代表沒有套用任何篩選，也就是「全部」被啟用
        className={`zf-btn${filters.length === 0 ? ' active' : ''}`}
        onClick={() => onChange([])} 
      >
        全部
      </button>
      
      {ZHUYIN_ORDER.map(z => (
        <button
          key={z}
          // 檢查該注音是否在 filters 陣列中來決定 active 狀態
          className={`zf-btn${filters.includes(z) ? ' active' : ''}`}
          onClick={() => handleToggle(z)}
        >
          {z}
        </button>
      ))}
    </div>
  );
}