# 3BLD Trainer 技術文件

> 3×3 魔方盲解（BLD）練習工具，使用注音符號標記法 + Three.js 3D 互動方塊

---

## 1. 技術棧

| 層級 | 技術 | 版本 |
|------|------|------|
| UI 框架 | React | 18.3.1 |
| 3D 渲染 | Three.js | 0.165 |
| 打包工具 | Vite | 5.x |
| 語言 | JavaScript (JSX) | ES2020+ |
| 路由 | 無（手動 Tab 切換） | — |
| 狀態管理 | React Context API + localStorage | — |
| 部署路徑 | `/3blind-practice/` | — |

---

## 2. 專案結構

```
src/
├── main.jsx                          # React 進入點
├── App.jsx                           # 根組件：Tab 切換 + MemoTableContext Provider
│
├── data/                             # 靜態資料
│   ├── pieces.js                     # 角塊/邊塊定義 + 注音映射
│   ├── memoData.js                   # 552 組注音→記憶詞對照表
│   ├── algoData.js                   # 統一匯出 cornerAlgs + edgeAlgs
│   ├── cornerAlgs.js                 # ~379 組角塊公式
│   ├── edgeAlgs.js                   # ~442 組邊塊公式
│   └── constants.js                  # 面色彩、面索引、注音排序
│
├── hooks/                            # 自訂 React Hooks
│   ├── useMemoTable.js               # 記憶表管理（localStorage 持久化）
│   ├── useCube.js                    # Three.js 方塊生命週期（辨識/指認模式）
│   ├── useAlgoCube.js                # Three.js 方塊 + 公式動畫播放器
│   ├── useQuizSession.js             # 辨識 Tab 的測驗邏輯
│   ├── useIdentifySession.js         # 指認 Tab 的會話邏輯
│   ├── usePracticeSession.js         # 練習 Tab 的會話邏輯
│   └── useMemoSession.js             # 記憶 Tab 的三階段邏輯
│
├── lib/                              # 純函式工具
│   ├── zhuyinUtils.js                # 注音配對、序列生成、格式化
│   ├── cubeGeometry.js               # Three.js 方塊幾何 + 貼紙系統
│   ├── cubeMoveLogic.js              # 18 種轉動定義 + 逆序
│   └── algoParser.js                 # 公式字串解析（交換子/共軛）
│
├── components/                       # UI 組件
│   ├── Nav.jsx                       # 導覽列（5 個 Tab）
│   ├── recognition/                  # 辨識 Tab
│   │   ├── RecognitionTab.jsx
│   │   ├── QuizPrompt.jsx
│   │   ├── QuizCube.jsx
│   │   ├── ZhuyinFilter.jsx
│   │   └── StatsBar.jsx
│   ├── identify/                     # 指認 Tab
│   │   ├── IdentifyTab.jsx
│   │   ├── IdentifyPrompt.jsx
│   │   └── IdentifyCube.jsx
│   ├── practice/                     # 練習 Tab
│   │   ├── PracticeTab.jsx
│   │   ├── PracticePrompt.jsx
│   │   └── PracticeCube.jsx
│   ├── memo/                         # 記憶 Tab
│   │   ├── MemoTab.jsx
│   │   ├── MemoPhase.jsx
│   │   ├── InputPhase.jsx
│   │   └── ResultPhase.jsx
│   ├── ref/                          # 總表 Tab
│   │   ├── RefTab.jsx
│   │   ├── RefGroup.jsx
│   │   ├── RefCard.jsx
│   │   └── AlgoPanel.jsx
│   └── formula/                      # 公式 Tab
│       ├── FormulaTab.jsx
│       └── FormulaCubePanel.jsx
│
└── styles/
    └── global.css                    # 全域暗色主題 CSS
```

---

## 3. 核心資料模型

### 3.1 方塊定義 (`data/pieces.js`)

**角塊（8 個）**：每個角塊有 3 個注音字元（對應 3 個面）

```js
// 範例
UFR: { z: ['ㄈ', 'ㄌ', 'ㄖ'], faces: ['U', 'F', 'R'] }
```

完整角塊：`UFR, UFL, UBR, UBL, DFR, DFL, DBR, DBL`

**邊塊（12 個）**：每個邊塊有 2 個注音字元（對應 2 個面）

```js
// 範例
UF: { z: ['ㄅ', 'ㄉ'], faces: ['U', 'F'] }
```

完整邊塊：`UF, UB, UR, UL, FR, FL, BR, BL, DF, DR, DB, DL`

**Buffer（起始塊）**：角塊 buffer = `UFR`，邊塊 buffer = `UF`

### 3.2 記憶詞表 (`data/memoData.js`)

- 552 組「注音對 → 中文詞」映射
- 格式：`{ ㄅㄆ: "薄片", ㄅㄇ: "斑馬", ... }`
- 使用者可自訂，修改存在 localStorage key `bld-memo-overrides`
- 只儲存與預設不同的差異部分

### 3.3 公式資料 (`data/cornerAlgs.js`, `data/edgeAlgs.js`)

- 角塊 ~379 組、邊塊 ~442 組
- 使用交換子 `[A,B]` 和共軛 `[A:B]` 記號法
- 格式：`{ ㄅㄆ: "[R' D R U' : [R' D' R , U']]", ... }`

### 3.4 常數 (`data/constants.js`)

- `FACE_COLOR` / `FACE_COLOR_HEX`：六面 RGB / Three.js hex 色彩
- `FI`：面索引映射（R=0, L=1, U=2, D=3, F=4, B=5）
- `ZHUYIN_ORDER`：24 個注音聲母的規範排序

---

## 4. 狀態管理架構

### 4.1 全域 Context：`MemoTableContext`

由 `App.jsx` 提供，透過 `useMemoTable` hook 管理：

```
MemoTableContext {
  memoTable: Object      // 合併後的完整記憶表（預設 + 使用者覆寫）
  updateEntry(pair, word) // 更新某組記憶詞 → 寫入 localStorage
  resetEntry(pair)        // 重設某組為預設值 → 移除 localStorage 中的覆寫
  resetAll()              // 清除所有自訂
  hasOverride(pair)       // 是否有使用者自訂
  overrideCount           // 自訂數量
}
```

### 4.2 Tab 內部狀態

各 Tab 獨立管理自身狀態，不互相共享（除了 memoTable）。

**關鍵設計**：Tab 切換使用 `display: none` 而非 unmount，以保留 Three.js canvas 狀態。

---

## 5. 五個功能 Tab

### Tab 1：辨識（Recognition）◈

**用途**：給注音對，輸入對應的記憶詞

**流程**：
1. `useQuizSession` 從篩選池中隨機選出一個注音對
2. 3D 方塊高亮該注音對對應的貼紙
3. 使用者在輸入框打字，送出答案
4. 驗證正確/錯誤，更新統計
5. 支援按注音聲母篩選題目

**相關 Hook**：`useQuizSession`、`useCube`（mode='quiz'）

### Tab 2：指認（Identify）◎

**用途**：給一個注音字元，在方塊上點擊對應的角塊和邊塊貼紙

**流程**：
1. `useIdentifySession` 隨機選出一個注音字元（必須同時存在於角塊和邊塊）
2. 方塊全部貼紙變暗
3. 使用者點擊貼紙 → Raycaster 偵測碰撞
4. 正確閃綠光，錯誤閃紅光
5. 需點中角塊貼紙 + 邊塊貼紙才算完成

**相關 Hook**：`useIdentifySession`、`useCube`（mode='identify'）

### Tab 3：練習（Practice）◐

**用途**：給記憶詞，在方塊上點擊對應的 4 個貼紙（2 字元 × 角塊+邊塊）

**流程**：
1. `usePracticeSession` 選出一個記憶詞
2. 顯示 2×2 格子追蹤 4 個目標
3. 使用者在方塊上點擊 4 個正確貼紙
4. 支援注音篩選

**相關 Hook**：`usePracticeSession`、`useCube`（mode='identify'）

### Tab 4：記憶（Memo）≡

**用途**：完整盲解記憶模擬（看序列 → 背序列 → 對答案）

**三個階段**：
1. **Memo 階段**：計時器啟動，顯示角塊/邊塊注音對序列，使用者閱讀
2. **Input 階段**：計時器停止，使用者憑記憶打出序列
3. **Result 階段**：逐字元比對，綠色=正確、紅色=錯誤

**相關 Hook**：`useMemoSession`

### Tab 5：總表/公式（Reference + Formula）⊛

**總表（RefTab）**：
- 搜尋所有注音對
- 手風琴展開按注音聲母分組
- 每張卡片可以：查看/編輯記憶詞、播放公式動畫

**公式（FormulaTab）**：
- 切換角塊/邊塊
- 選擇注音對 → 顯示公式
- 3D 方塊顯示 scramble 狀態 + 動畫執行

---

## 6. Three.js 3D 方塊系統

### 6.1 方塊幾何 (`lib/cubeGeometry.js`)

- `buildCubies()`：建立 26 個 cubie（排除中心）
- 每個 cubie 是獨立的 Three.js Group，包含方塊體 + 6 面貼紙
- **貼紙材質系統**：
  - 內部面：深灰色 `0x181818`
  - 中心貼紙：完全可見
  - 非中心貼紙：預設暗淡（opacity 0.22）
  - 高亮貼紙：完全不透明 + emissive 發光
- `buildStickerMap()`：建立注音字元 → 貼紙位置的映射表（singleton）
- `highlightPair(cubies, pair)`：高亮指定注音對的所有貼紙
- `resetColors(cubies)`：重設為暗淡狀態
- `flashWrong(mat, hex, opacity)`：錯誤時紅色閃爍（400ms）
- `lightGreen(mat, faceName)`：正確時綠色發光

### 6.2 轉動邏輯 (`lib/cubeMoveLogic.js`)

- **18 種轉動**：R, U, F, L, D, B × (順時針, 逆時針', 180°2)
- 每個轉動定義包含：
  - `filter(x,y,z)`：選取受影響的 cubie
  - `axis`：旋轉軸
  - `angle`：旋轉角度
  - `transform(x,y,z)`：座標變換
- `inverseMove(m)`：取得反向轉動
- `invertSequence(moves)`：反轉整個公式序列

### 6.3 公式解析 (`lib/algoParser.js`)

- 解析含交換子 `[A,B]` 和共軛 `[A:B]` 的公式字串
- 支援巢狀：`[A : [B , C]]`
- **展開規則**：
  - `[A, B]` → `A B A' B'`（交換子）
  - `[A : B]` → `A B A'`（共軛）
- 輸出：扁平化的 18 種基本轉動陣列

### 6.4 Hooks

**`useCube`**（辨識/指認/練習用）：
- 管理 Three.js scene, camera, renderer, raycaster
- 所有 3D 狀態存在 `useRef`（不觸發 React re-render）
- 滑鼠/觸控拖拉旋轉方塊
- 兩種模式：
  - `'quiz'`：僅顯示，高亮注音對
  - `'identify'`：互動式，Raycaster 偵測點擊貼紙
- 對外 API：`highlightPair(pair)`、`resetColors()`

**`useAlgoCube`**（公式播放器用）：
- 繼承基本方塊功能
- 新增動畫播放系統：play/pause/step-forward/step-back/reset
- 速度控制：150ms ~ 900ms per move
- 貼紙高亮：buffer = 紫色、目標 = 正常色、其他 = 暗淡
- Scramble 功能：載入公式的逆序來顯示解題前狀態

---

## 7. 工具函式 (`lib/zhuyinUtils.js`)

| 函式 | 用途 |
|------|------|
| `getAllPairs(memoTable)` | 從方塊定義產生所有有效注音對 |
| `getSeq(pieces, buf)` | 取得排除 buffer 的有序注音序列 |
| `makePairs(seq, memoTable)` | 將序列兩兩配對並查找記憶詞 |
| `fmtTime(ms)` | 格式化毫秒為 `Xm YY.Zs` |
| `buildCharMap()` | 建立注音字元 → {corner, edge} 資訊映射 |
| `getIdentifyPool()` | 篩選同時出現在角塊和邊塊的注音字元 |

---

## 8. 樣式系統 (`styles/global.css`)

- **暗色主題**：背景 `#090909`，淺背景 `#0e0e0e`
- **色彩**：
  - 強調色：`#e2c97e`（金色）
  - 正確：`#4caf50`（綠）
  - 錯誤：`#e63946`（紅）
  - 文字：`#d0d0d0`（主要）、`#999`（次要）
- **字體**：
  - 內文：Noto Sans TC（無襯線）
  - 標題：Crimson Pro（襯線）
  - 等寬：Space Mono（公式、程式碼）
- **佈局**：Flexbox 為主，Reference Tab 使用 Grid
- **Header + Nav**：sticky 定位 + z-index 分層

---

## 9. 關鍵架構決策

| 決策 | 理由 |
|------|------|
| 無路由器，手動 Tab 切換 | 單頁應用，5 個 Tab 足夠簡單 |
| Tab 用 `display:none` 隱藏 | 保留 Three.js canvas 和 WebGL 上下文，避免重建 |
| Three.js 狀態用 `useRef` | 避免每幀動畫觸發 React re-render |
| Context 僅用於記憶表 | Tab 間唯一共享資料，其餘各自獨立 |
| localStorage 儲存差異 | 只存使用者修改過的項目，減少儲存量 |
| Raycaster 點擊偵測 | 精確偵測 3D 貼紙點擊 |
| 公式解析輸出 18 基本轉動 | 統一動畫系統，簡化轉動邏輯 |
| Singleton stickerMap | 避免重複建立映射表 |

---

## 10. localStorage 使用

| Key | 用途 |
|-----|------|
| `bld-memo-overrides` | 使用者自訂記憶詞（JSON 物件，只含差異） |

---

## 11. 開發指南

### 啟動開發伺服器
```bash
npm run dev    # Vite dev server, port 5173
```

### 建置
```bash
npm run build  # 輸出到 dist/
npm run preview # 預覽建置結果, port 4173
```

### 新增注音對/公式
1. 在 `data/cornerAlgs.js` 或 `data/edgeAlgs.js` 新增項目
2. 格式：`{ 注音對: "公式字串" }`
3. 公式支援 `[A,B]` 交換子和 `[A:B]` 共軛記號

### 新增方塊面色
修改 `data/constants.js` 中的 `FACE_COLOR` 和 `FACE_COLOR_HEX`

### 修改方塊 3D 外觀
- 貼紙大小/間距：`lib/cubeGeometry.js` 中的 `buildCubies()`
- 高亮效果：同檔案中的 `highlightPair()` 和 material 設定
- 動畫速度：`hooks/useAlgoCube.js` 中的速度範圍設定

---

## 12. 資料流圖

### 辨識 Tab 資料流
```
useQuizSession (選題)
  ↓ pair
QuizPrompt (顯示+輸入)  ←→  useCube.highlightPair (3D 高亮)
  ↓ answer
驗證 → 更新 stats
```

### 指認 Tab 資料流
```
useIdentifySession (選字元)
  ↓ char
IdentifyPrompt (顯示)
  ↓
IdentifyCube ← 使用者點擊
  ↓ raycaster hit
useCube.onStickerClick → useIdentifySession.handleClick
  ↓ {hit, hitIdx, faceName}
cubeGeometry 閃光回饋
```

### 公式播放資料流
```
選擇注音對 → algoData 查公式
  ↓
algoParser.parseAlgo → 扁平轉動陣列
  ↓
useAlgoCube.loadCase
  ├─ invertSequence → scramble 方塊
  └─ highlightPair → 高亮 buffer + 目標貼紙
  ↓
播放控制 → cubeMoveLogic.MOVES → Three.js 動畫
```

---

## 13. 相依關係圖

```
main.jsx
  └─ App.jsx
       ├─ useMemoTable ← memoData.js + localStorage
       ├─ Nav.jsx
       ├─ RecognitionTab
       │    ├─ useQuizSession ← zhuyinUtils ← pieces.js
       │    ├─ QuizCube ← useCube ← cubeGeometry ← constants.js
       │    ├─ QuizPrompt
       │    ├─ ZhuyinFilter ← constants.js
       │    └─ StatsBar
       ├─ IdentifyTab
       │    ├─ useIdentifySession ← zhuyinUtils
       │    ├─ IdentifyCube ← useCube
       │    └─ IdentifyPrompt
       ├─ PracticeTab
       │    ├─ usePracticeSession ← zhuyinUtils
       │    ├─ PracticeCube ← useCube
       │    └─ PracticePrompt
       ├─ MemoTab
       │    ├─ useMemoSession ← zhuyinUtils
       │    ├─ MemoPhase
       │    ├─ InputPhase
       │    └─ ResultPhase
       ├─ RefTab
       │    ├─ RefGroup → RefCard
       │    └─ AlgoPanel ← useAlgoCube ← algoParser + cubeMoveLogic
       └─ FormulaTab
            └─ FormulaCubePanel ← useAlgoCube
```
