# BLD Trainer

3×3 魔方盲解練習工具，基於 3-style 注音方案。

## 功能

### ◈ 辨識
給定一個注音代號組合（例如 `ㄅㄆ`），輸入對應的記憶詞（例如「薄片」）。答題時方塊會同步標示對應貼片位置。

### ◎ 指認
給定一個注音字，在 3D 方塊上點出該字對應的角塊貼片與邊塊貼片。

### ◉ Memo
模擬完整記憶流程：查看整串角塊與邊塊序列（含記憶詞）→ 計時 → 遮住答案 → 輸入序列 → 逐字對比結果。

### ≡ 參考表
所有注音配對與記憶詞的完整索引，支援搜尋與**自訂編輯**。

---

## 快速開始

```bash
# 安裝相依套件
npm install

# 啟動開發伺服器
npm run dev

# 建置正式版本
npm run build
```

Node.js 18+ 即可，無需其他環境設定。

---

## 自訂參考表

在「參考表」tab 中：

1. **搜尋**：輸入注音字或關鍵詞，即時篩選符合條目
2. **編輯**：點擊任意記憶詞（或 ✏ 圖示）即可直接修改，按 Enter 或失焦儲存，Esc 取消
3. **重置單筆**：已自訂的條目會顯示 ★ 標記，點擊 ↺ 可回復預設詞
4. **重置全部**：頁面右上角的「全部重置」按鈕，清除所有自訂

自訂資料儲存在瀏覽器的 `localStorage`，key 為 `bld-memo-overrides`，只儲存與預設不同的條目。

---

## 注音方案

本工具採用以下角塊/邊塊 buffer：

| 類型 | Buffer |
|------|--------|
| 角塊 | UFR    |
| 邊塊 | UF     |

### 角塊配對

| 位置 | U 面 | 第二面 | 第三面 |
|------|------|--------|--------|
| UFR  | ㄈ   | ㄌ     | ㄖ     |
| UFL  | ㄅ   | ㄉ     | ㄒ     |
| UBR  | ㄇ   | ㄋ     | ㄕ     |
| UBL  | ㄆ   | ㄊ     | ㄑ     |
| DFR  | ㄩ   | ㄐ     | ㄗ     |
| DFL  | ㄙ   | ㄍ     | ㄓ     |
| DBR  | ㄨ   | ㄏ     | ㄘ     |
| DBL  | ㄧ   | ㄎ     | ㄔ     |

### 邊塊配對

| 位置 | 第一面 | 第二面 |
|------|--------|--------|
| UF   | ㄅ     | ㄉ     |
| UB   | ㄇ     | ㄋ     |
| UR   | ㄈ     | ㄌ     |
| UL   | ㄆ     | ㄊ     |
| FR   | ㄔ     | ㄓ     |
| FL   | ㄍ     | ㄎ     |
| BR   | ㄑ     | ㄒ     |
| BL   | ㄐ     | ㄏ     |
| DF   | ㄙ     | ㄕ     |
| DR   | ㄩ     | ㄘ     |
| DB   | ㄨ     | ㄗ     |
| DL   | ㄧ     | ㄖ     |

---

## 專案結構

```
src/
├── data/
│   ├── memoData.js        # 預設記憶詞（552 筆）
│   ├── pieces.js          # CORNERS、EDGES 定義
│   └── constants.js       # FACE_COLOR、ZHUYIN_ORDER、FI
│
├── hooks/
│   ├── useMemoTable.js    # localStorage 讀寫、覆寫管理
│   ├── useQuizSession.js  # 辨識題目狀態機
│   ├── useIdentifySession.js # 指認題目狀態機
│   ├── useMemoSession.js  # Memo 流程 + 計時器
│   └── useCube.js         # Three.js 完整生命週期
│
├── lib/
│   ├── zhuyinUtils.js     # 純函式：題目池、序列、配對、計時格式化
│   └── cubeGeometry.js    # 純函式：建立方塊、高亮貼片、重置顏色
│
├── components/
│   ├── recognition/       # 辨識 tab
│   ├── identify/          # 指認 tab
│   ├── memo/              # Memo tab
│   └── ref/               # 參考表 tab（含編輯器）
│
└── styles/
    └── global.css         # 所有樣式（CSS 自訂屬性 + 深色主題）
```

### 狀態管理

- `MemoTableContext`（`App.jsx`）：跨 tab 共享的記憶詞表，辨識、Memo、參考表三個 tab 消費
- 其餘狀態（題目、統計、計時器）全部為各 tab 的 local state

### Three.js 整合

- `useCube` hook 用 `useRef` 儲存所有 Three.js 物件（renderer、scene、cubies 等），不觸發 React re-render
- Tab 切換使用 `display:none` 而非 unmount，保留方塊旋轉狀態並避免重新初始化
- 指認 cube 使用 Raycaster 做貼片點擊偵測，透過 stable callback ref 避免 event listener 重掛

---

## 技術棧

| 套件 | 用途 |
|------|------|
| React 18 | UI 框架 |
| Vite 5 | 開發工具 / 打包 |
| Three.js 0.165 | 3D 方塊渲染 |

無 CSS 框架，無路由套件，無額外狀態管理庫。
