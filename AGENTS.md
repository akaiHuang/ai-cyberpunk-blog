# 🤖 AGENTS.md - BlogSys AI 開發指南

本文件是給 **AI Agent**（如 GitHub Copilot、Cursor、Claude 等）的開發協作指南。
當你以 AI 身份協助開發此專案時，請優先閱讀本文件以理解專案風格與規範。

---

## 📋 專案概覽 (Project Overview)

| 項目 | 說明 |
|------|------|
| **專案名稱** | BlogSys / BotLog |
| **類型** | Next.js 全端部落格系統 |
| **部署平台** | Vercel |
| **資料儲存** | localStorage (可擴充至 Firebase) |
| **認證系統** | 自建簡易認證 (AuthContext) |
| **目標用戶** | 創意工作者、設計師、技術部落客 |

---

## 🎨 設計系統 (Design System)

### 核心風格：Cyberpunk / Hacker Terminal

本專案採用 **賽博龐克 (Cyberpunk)** 與 **駭客終端機 (Hacker Terminal)** 美學。
所有 UI 開發必須遵循以下設計語言：

#### 色彩系統 (Color Palette)

```css
/* 主色調 */
--color-primary: #00FF99;      /* 霓虹綠 - 主要強調、按鈕、連結 */
--color-secondary: #FFD700;    /* 金黃色 - 次要強調、標籤 */
--color-accent: #FF00FF;       /* 霓虹粉 - 特殊元素、AI 相關 */
--color-cyan: #00BFFF;         /* 電光藍 - 資訊、連結 */
--color-danger: #FF004D;       /* 警示紅 - 刪除、錯誤 */

/* 背景與表面 */
--color-background: #000000;   /* 純黑背景 */
--color-surface: #0A0A0A;      /* 卡片背景 */
--color-surface-hover: #111111;/* 懸停狀態 */

/* 邊框與線條 */
--color-border: #222222;       /* 預設邊框 */
--color-border-accent: #333333;/* 強調邊框 */

/* 文字層級 */
--color-text-primary: #EAEAEA; /* 主要文字 */
--color-text-secondary: #888888;/* 次要文字 */
--color-text-muted: #555555;   /* 灰色文字 */
--color-text-dark: #333333;    /* 最暗文字 */
```

#### 字體系統 (Typography)

```css
/* 等寬字體 - 用於大部分 UI */
font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;

/* 顯示字體 - 用於標題 */
font-family: 'Chakra Petch', sans-serif;
```

#### UI 元素規範

| 元素 | 規範 |
|------|------|
| **按鈕** | 無圓角 (`rounded-none`)，使用方角設計 |
| **卡片** | `border border-[#222]`，無圓角或極小圓角 |
| **輸入框** | 深色背景 `bg-[#111]`，綠色 focus 邊框 |
| **角落裝飾** | 使用 L 型邊框裝飾 (corner decorations) |
| **動畫** | 使用 `framer-motion`，保持微妙流暢 |
| **懸停效果** | 顏色變化 + 輕微位移或縮放 |

#### 角落裝飾範例

```jsx
{/* Corner decorations */}
<div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-[#00FF99]" />
<div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-[#00FF99]" />
<div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-[#00FF99]" />
<div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-[#00FF99]" />
```

---

## 🛠 技術堆疊 (Tech Stack)

### 核心框架
- **Next.js 16** - App Router
- **React 19** - UI Library
- **Tailwind CSS 3** - Styling
- **Framer Motion** - Animation

### UI 工具
- **lucide-react** - Icons
- **clsx / tailwind-merge** - Class utilities

### AI 整合 (規劃中)
- **Vercel AI SDK** - Streaming UI
- **Google Gemini API** - Text & Vision
- **Nano Banana Pro** - Image Generation (TBD)

### 環境變數

```env
# Firebase (選用)
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx

# AI 服務
GeminiAPIKey=xxx
```

---

## 📂 專案結構 (Project Structure)

```
bitlog/
├── src/
│   ├── app/
│   │   ├── page.jsx            # 首頁 (分類展示)
│   │   ├── layout.js           # 根 Layout + AuthProvider
│   │   ├── globals.css         # 全域樣式 + CSS Variables
│   │   ├── blog/
│   │   │   ├── page.jsx        # 文章列表
│   │   │   └── [id]/page.jsx   # 文章詳情
│   │   ├── admin/
│   │   │   ├── login/page.jsx  # 登入頁
│   │   │   └── blog/page.jsx   # 後台管理
│   │   └── api/                # API Routes (規劃中)
│   │       └── chat/route.js   # AI Chat API
│   ├── components/
│   │   └── AuthGuard.js        # 認證守衛
│   ├── context/
│   │   └── AuthContext.js      # 認證狀態管理
│   ├── data/
│   │   └── blogData.js         # 文章資料 + Helpers
│   └── lib/
│       └── firebase.js         # Firebase 設定
├── public/
│   └── blog/                   # 文章圖片
├── AI_FEATURE_SPEC.md          # AI 功能規格書
├── AGENTS.md                   # 本文件
└── README.md                   # 專案說明
```

---

## 🎯 開發規範 (Coding Conventions)

### 命名規則

| 類型 | 規則 | 範例 |
|------|------|------|
| 元件檔案 | PascalCase | `BlogAdminPage.jsx` |
| 函式 | camelCase | `handleSave()` |
| 常數 | UPPER_SNAKE | `STORAGE_KEY` |
| CSS Class | Tailwind 優先 | `className="bg-black text-[#00FF99]"` |

### React 規範

```jsx
// ✅ Good - 使用 'use client' 標記 Client Component
'use client';

// ✅ Good - 從 lucide-react 導入圖標
import { ArrowLeft, Plus } from 'lucide-react';

// ✅ Good - 使用 framer-motion 做動畫
import { motion } from 'framer-motion';

// ✅ Good - 使用 Link 進行導航
import Link from 'next/link';
```

### Tailwind 規範

```jsx
// ✅ Good - 使用語義化的色彩變數
className="bg-black text-[#EAEAEA] border-[#222]"

// ✅ Good - 懸停狀態
className="hover:text-[#00FF99] hover:bg-[#111] transition-colors"

// ✅ Good - 使用 tracking-wider 增加字距
className="text-xs tracking-widest uppercase"
```

---

## 🔌 建議的 MCP 與 Skills

### Model Context Protocol (MCP) Servers

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-filesystem"],
      "description": "讀寫專案檔案"
    },
    "github": {
      "command": "npx", 
      "args": ["-y", "@anthropic/mcp-github"],
      "description": "GitHub 操作與 PR 管理"
    },
    "web-search": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-web-search"],
      "description": "搜尋最新技術文件與範例"
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-playwright"],
      "description": "瀏覽器自動化測試與截圖"
    }
  }
}
```

### 推薦 Skills

#### 🤖 GitHub Copilot SDK Skill (NEW!)

本專案整合 **GitHub Copilot SDK**，提供程式化 AI 能力：

```bash
# 安裝
npm install @github/copilot-sdk zod
```

**文件位置**：
- [Copilot SDK 使用指南](./docs/COPILOT_SDK_GUIDE.md)
- [BlogSys Skill 定義](./docs/COPILOT_SDK_SKILL.md)
- [範例程式碼](./examples/copilot-sdk/)

**自定義 Agent**：

| Agent | 用途 |
|-------|------|
| `@blogsys-writer` | Cyberpunk 風格部落格寫手 |
| `@code-reviewer` | 程式碼審查員 |
| `@ui-designer` | UI 設計師 |

**快速使用**：

```typescript
import { CopilotClient } from "@github/copilot-sdk";

const client = new CopilotClient();
const session = await client.createSession({
    model: "gpt-4.1",
    streaming: true,
});

// 使用自定義 Agent
await session.send({
    prompt: "@blogsys-writer 寫一篇關於 AI 的文章"
});
```

#### 🎨 UI/UX Pro Max Skill
**URL**: `https://ui-ux-pro-max-skill.nextlevelbuilder.io`

此 Skill 專為本專案的 Cyberpunk 風格設計，提供：

| 能力 | 說明 |
|------|------|
| **霓虹色彩生成** | 自動產出符合 Cyberpunk 配色的 Tailwind classes |
| **玻璃擬態效果** | `backdrop-blur-xl bg-black/80` 組合建議 |
| **終端機動畫** | 打字機效果、掃描線、故障藝術 (Glitch Art) |
| **角落裝飾** | 自動生成 L 型邊框 SVG 或 CSS |
| **響應式斷點** | 針對 Cyberpunk 介面優化的 RWD 建議 |

**風格關鍵字**:
```
Cyberpunk, Neon Glow, Hacker Terminal, Dark Mode, 
Monospace Typography, Sharp Corners, Scan Lines,
Glitch Effects, Matrix Rain, Tech Grid
```

**Prompt 範例**:
```
使用 UI/UX Pro Max Skill，為 BlogSys 的 AI 聊天室設計一個 
Cyberpunk 風格的輸入框，需包含：
- 霓虹綠邊框 (#00FF99)
- 半透明黑色背景
- 角落 L 型裝飾
- 發送按鈕帶有 hover glow 效果
```

---

## ⚡ 快速任務指令 (Quick Commands for AI)

當你協助開發時，可以參考以下常見任務：

### 新增頁面
```
在 src/app/ 下新增一個 [路由名稱] 頁面，
使用 'use client'，風格符合 Cyberpunk 設計系統，
包含 Header 導航與主要內容區域。
```

### 新增 API Route
```
在 src/app/api/ 下新增 [功能名稱]/route.js，
使用 Next.js App Router 格式，
處理 POST 請求並返回 JSON 回應。
```

### 更新樣式
```
修改 [元件名稱] 的樣式，使其符合 AGENTS.md 中定義的 
Cyberpunk 設計系統，特別注意：
- 使用正確的色彩變數
- 加入角落裝飾
- 確保懸停效果
```

---

## 🚀 部署檢查清單 (Deployment Checklist)

- [ ] 環境變數已設定 (Vercel Dashboard)
- [ ] Build 無錯誤 (`npm run build`)
- [ ] 登入功能正常運作
- [ ] 響應式設計已測試
- [ ] Lighthouse 分數 > 90

---

## 📞 聯絡方式

- **專案擁有者**: FAW Studio
- **GitHub**: https://github.com/akaiHuang/bitlog
- **部署網址**: https://bitlog-six.vercel.app

---

*最後更新: 2026-01-23*
