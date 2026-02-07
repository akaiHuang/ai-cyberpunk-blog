# BlogSys AI 智能創作助手 - 深度整合計畫 (v2.0)

本計畫旨在將 **BlogSys** 升級為一個具備「AI 協同創作」能力的內容管理系統。我們不只是增加一個聊天視窗，而是要打造一個能與創作者深度對談、具備視覺想像力的 **AI 編輯夥伴 (BotLog AI)**。

## 🎯 核心願景 (Vision)

讓使用者在後台即可完成從 **靈感發想** -> **內容撰寫** -> **視覺設計** -> **文章排版** 的全流程。
AI 應具備記憶與上下文理解能力，並透過 "Nano Banana Pro" 風格生成獨特的視覺素材。

---

## 🏗 架構與開發階段 (Phases)

### ✅ 前置準備 (Prerequisite)

*   **環境變數**:
    *   確認 `.env` 中已配置 `GeminiAPIKey`。
    *   在專案中建立適配器，將 `GeminiAPIKey` 映射給 AI SDK 使用。
*   **技術核心**:
    *   **Vercel AI SDK**: 處理 Stream UI 與狀態管理。
    *   **Google Gemini Pro (Model)**: 處理文字與邏輯。
    *   **Gemini Pro Vision**: 處理使用者上傳的參考圖片分析。

---

### Phase 1: 沉浸式 AI 協作空間 (Immersive AI Workspace)

**目標**: 打造一個與主編輯器平行，但更專注於「對話與靈感」的空間。

1.  **入口與轉場**:
    *   在文章列表頁新增 `+ CREATE BY AI` (與 `+ CREATE NEW ARTICLE` 並列)。
    *   點擊後進入全螢幕專注模式 (Focus Mode)，背景與 UI 採用各具特色的 Cyberpunk/Hacker 風格，區別於傳統表單。

2.  **BotLog 聊天介面**:
    *   **對話區**: 支援豐富的 Markdown 渲染（標題、清單、程式碼區塊高亮）。
    *   **Pin 機制 (靈感暫存)**:
        *   不只是複製文字，而是將 AI 的特定回覆「釘選」為一張 **靈感卡片 (Idea Card)**。
        *   靈感卡片會滑入右側的「創作白板 (Canvas)」。

3.  **創作白板 (The Canvas)**:
    *   右側側邊欄或浮動面板，存放所有 Pinned Cards。
    *   使用者可以對卡片進行拖選、排序，作為文章結構的雛形。

### Phase 2: 深度對話與文字生成 (Deep Chat & Text Gen)

**目標**: 讓 AI 這位「夥伴」能引導使用者創作出深度內容，而不只是被動問答。

1.  **System Prompt 設計**:
    *   角色設定: 專業編輯、創意總監、Web 3.0 觀察家。
    *   能力: 引導式提問、結構化輸出、風格模仿。
    *   上下文記憶: AI 需記住當前對話的脈絡。

2.  **API 實作**:
    *   使用 `src/app/api/chat/route.js`。
    *   整合 Vercel AI SDK 的 `streamText`，提供流暢的打字機體驗。
    *   **關鍵**: 讀取 `process.env.GeminiAPIKey` 進行驗證。

### Phase 3: 視覺想像與圖像生成 (Visual Imagination)

**目標**: 透過 "Nano Banana Pro" 模型，將文字轉化為具體的視覺素材。

1.  **靈感卡片增強**:
    *   在「創作白板」的每一張文字卡片上，增加 `[生成配圖]` 功能。
    *   功能選項:
        *   `[上傳參考圖]`: 使用者上傳手繪草圖或參考風格圖。
        *   `[創造圖片]`: 執行生成。

2.  **AI 視覺工作流 (The Vision Pipeline)**:
    *   **Step 1: 理解 (Vision)**: 若有上傳參考圖，先呼叫 `Gemini Pro Vision` 分析圖片內容、構圖與風格，並結合卡片文字，產出一組 **精確的繪圖 Prompt**。
    *   **Step 2: 想像 (Generation)**: 調用圖像生成 API (模擬 "Nano Banana Pro" 模型)。
        *   *註*: 需預留 API 擴充空間，支援 Text-to-Image 與 Image-to-Image。
    *   **Step 3: 呈現**: 生成的圖片直接附著在該張靈感卡片上。

3.  **圖片管理**:
    *   生成的圖片支援 `[重繪]`、`[下載]` 或 `[設為封面]`。

### Phase 4: 智能組裝與發布 (Smart Assembly & Publish)

**目標**: 將散落在「創作白板」的靈感碎片，一鍵組裝成完整文章。

1.  **預覽模式 (Preview Mode)**:
    *   新增 `[PREVIEW PUBLISH]` 按鈕。
    *   AI 自動邏輯:
        *   分析所有靈感卡片的順序。
        *   選取第一張生成的圖片作為 `cover image`。
        *   提取第一張卡片重點作為 `Title` 與 `Excerpt`。
        *   將其餘卡片內容轉換為 Markdown `content`，並自動插入對應的圖片位置。

2.  **無縫接軌**:
    *   生成預覽後，提供 `[EDIT IN FULL EDITOR]` 按鈕。
    *   將組合好的 `FormData` 完整帶入現有的 `BlogAdminPage` 編輯器。
    *   使用者進行最後確認後發布。

---

## 💡 給 AI 開發者的實作提示 (Implementation Hints)

*   **UI/UX**: 大膽使用霓虹色調 (`#00FF99`, `#FF00FF`) 與半透明玻璃擬態，讓「與 AI 對話」這件事本身就很酷。可以參考 Cursor 或 Gemini Advanced 的介面佈局。
*   **Prompt Engineering**: 在生成圖片 Prompt 時，加入 "Detailed, High quality, 8k, cyberpunk style" 等關鍵詞，以配合網站風格。
*   **Flexibility**: 程式碼結構應保持模組化，"Nano Banana Pro" 即使目前是模擬 API，未來也能輕易替換成真實的 Stable Diffusion WebUI 或 Midjourney API。
