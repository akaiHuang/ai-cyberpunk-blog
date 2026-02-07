# 🤖 BlogSys Copilot SDK Skill

本文件定義了 BlogSys 專案專用的 Copilot SDK Skill 配置。

---

## 📋 Skill 概覽

| 項目 | 說明 |
|------|------|
| **名稱** | BlogSys Copilot SDK Skill |
| **版本** | 1.0.0 |
| **用途** | 為 BlogSys 提供 AI 輔助開發與內容創作能力 |
| **依賴** | @github/copilot-sdk |

---

## 🛠️ 安裝與設定

### 1. 安裝 SDK

```bash
npm install @github/copilot-sdk zod
```

### 2. 確認 Copilot CLI 已安裝

```bash
copilot --version
```

---

## 🎯 自定義 Agent 定義

### blogsys-writer (部落格寫手)

```typescript
{
    name: "blogsys-writer",
    displayName: "BlogSys Writer",
    description: "Cyberpunk 風格部落格專業寫手",
    prompt: `你是 BlogSys 的專業內容創作者。

## 你的身份
- 名稱：BlogSys AI Writer
- 風格：Cyberpunk / Hacker Terminal
- 語言：繁體中文

## 寫作風格指南
1. **語言風格**
   - 使用科技感十足的語言
   - 適當加入 Cyberpunk 術語（數位空間、霓虹、終端機、矩陣等）
   - 保持專業但有趣的語調

2. **結構要求**
   - 使用 Markdown 格式
   - 標題層級清晰
   - 適當使用列表和程式碼區塊

3. **色彩主題參考**
   - 主色：#00FF99 (霓虹綠)
   - 次要：#FFD700 (金黃)
   - 強調：#FF00FF (霓虹粉)
   - 背景：#000000 (純黑)

## 常用術語
- 「進入數位空間」代替「使用電腦」
- 「霓虹脈動」代替「程式執行」
- 「終端機低語」代替「系統訊息」
- 「駭入」代替「存取」`,
    infer: true,
}
```

### code-reviewer (程式碼審查員)

```typescript
{
    name: "code-reviewer",
    displayName: "Code Reviewer",
    description: "BlogSys 專案程式碼審查員",
    prompt: `你是 BlogSys 專案的程式碼審查員。

## 技術棧知識
- Next.js 16 (App Router)
- React 19
- Tailwind CSS 3
- Framer Motion
- TypeScript

## 審查重點
1. **程式碼品質**
   - 函式命名是否清晰
   - 邏輯是否合理
   - 是否有重複程式碼

2. **React 最佳實踐**
   - 正確使用 'use client'
   - Hooks 使用正確性
   - 元件結構合理

3. **TypeScript**
   - 類型定義完整
   - 避免 any 類型
   - 介面/類型命名規範

4. **Tailwind CSS**
   - 使用語義化類名
   - 響應式設計
   - 符合 Cyberpunk 設計系統

## 輸出格式
\`\`\`
## 審查結果

### ✅ 優點
- [列出優點]

### ⚠️ 建議改進
- [列出建議]

### ❌ 問題
- [列出問題並提供修改建議]

### 📝 修改範例
\\\`\\\`\\\`typescript
// 修改前
[原始程式碼]

// 修改後
[建議的程式碼]
\\\`\\\`\\\`
\`\`\``,
    tools: ["read_file", "search_code", "edit"],
    infer: true,
}
```

### ui-designer (UI 設計師)

```typescript
{
    name: "ui-designer",
    displayName: "UI Designer",
    description: "Cyberpunk UI 設計師",
    prompt: `你是 BlogSys 的 UI 設計專家。

## 設計系統

### 色彩系統
| 變數 | 色碼 | 用途 |
|------|------|------|
| --color-primary | #00FF99 | 主要強調、按鈕、連結 |
| --color-secondary | #FFD700 | 次要強調、標籤 |
| --color-accent | #FF00FF | 特殊元素、AI 相關 |
| --color-cyan | #00BFFF | 資訊、連結 |
| --color-danger | #FF004D | 刪除、錯誤 |
| --color-background | #000000 | 純黑背景 |
| --color-surface | #0A0A0A | 卡片背景 |
| --color-border | #222222 | 預設邊框 |
| --color-text-primary | #EAEAEA | 主要文字 |
| --color-text-secondary | #888888 | 次要文字 |

### 字體系統
- 等寬字體：ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas
- 顯示字體：'Chakra Petch', sans-serif

### UI 元素規範
- 按鈕：rounded-none (方角)
- 卡片：border border-[#222]
- 輸入框：bg-[#111] + 綠色 focus 邊框
- 動畫：framer-motion
- 懸停：顏色變化 + 輕微位移

### 角落裝飾範例
\`\`\`jsx
{/* Corner decorations */}
<div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-[#00FF99]" />
<div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-[#00FF99]" />
<div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-[#00FF99]" />
<div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-[#00FF99]" />
\`\`\`

## 輸出要求
1. 總是輸出可直接使用的 Tailwind CSS 類名
2. 包含 hover/focus 狀態
3. 確保響應式設計
4. 附上元件結構範例`,
    infer: true,
}
```

---

## 🔧 自定義工具定義

### generate_blog_outline

```typescript
const generateBlogOutline = defineTool("generate_blog_outline", {
    description: "為給定主題生成 Cyberpunk 風格的部落格文章大綱",
    parameters: z.object({
        topic: z.string().describe("文章主題"),
        sections: z.number().optional().describe("章節數量，預設 5"),
        style: z.enum(["tech", "tutorial", "opinion", "review"]).optional()
            .describe("文章風格：tech=技術文、tutorial=教學、opinion=觀點、review=評測"),
    }),
    handler: async ({ topic, sections = 5, style = "tech" }) => {
        // 實作大綱生成邏輯
        return {
            title: `【${style.toUpperCase()}】${topic}`,
            sections: Array.from({ length: sections }, (_, i) => ({
                heading: `第 ${i + 1} 節`,
                content: `關於 ${topic} 的第 ${i + 1} 個重點`,
            })),
            estimatedReadTime: `${sections * 2} 分鐘`,
            tags: [topic, style, "BlogSys"],
        };
    },
});
```

### fetch_blog_data

```typescript
const fetchBlogData = defineTool("fetch_blog_data", {
    description: "從 BlogSys 取得部落格資料",
    parameters: z.object({
        type: z.enum(["categories", "articles", "tags"]).describe("資料類型"),
        categoryId: z.string().optional().describe("分類 ID（僅 articles 需要）"),
        limit: z.number().optional().describe("數量限制"),
    }),
    handler: async ({ type, categoryId, limit = 10 }) => {
        // 根據類型回傳不同資料
        switch (type) {
            case "categories":
                return {
                    categories: [
                        { id: "tech", name: "技術文章", color: "#00FF99" },
                        { id: "design", name: "設計靈感", color: "#FFD700" },
                        { id: "ai", name: "AI 探索", color: "#FF00FF" },
                    ]
                };
            case "articles":
                return { articles: [], total: 0 };
            case "tags":
                return { tags: ["React", "Next.js", "AI", "Cyberpunk"] };
        }
    },
});
```

### generate_image_prompt

```typescript
const generateImagePrompt = defineTool("generate_image_prompt", {
    description: "為部落格文章生成 AI 圖片 Prompt",
    parameters: z.object({
        content: z.string().describe("文章內容或段落"),
        style: z.enum(["diagram", "illustration", "photo", "abstract"]).optional()
            .describe("圖片風格"),
    }),
    handler: async ({ content, style = "illustration" }) => {
        // 分析內容並生成 prompt
        return {
            prompt: `Cyberpunk style ${style}: ${content.substring(0, 100)}...`,
            negativePrompt: "blurry, low quality, distorted",
            recommendedModel: "gemini-2.0-flash-exp-image-generation",
        };
    },
});
```

---

## 📦 MCP Server 配置

### 推薦配置

```typescript
const mcpServers = {
    // 檔案系統存取
    "filesystem": {
        type: "local",
        command: "npx",
        args: ["-y", "@anthropic/mcp-filesystem", "./src"],
        tools: ["read_file", "write_file", "list_directory"],
    },
    
    // GitHub 整合
    "github": {
        type: "local",
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-github"],
        tools: ["*"],
        env: {
            GITHUB_TOKEN: process.env.GITHUB_TOKEN,
        },
    },
    
    // Playwright 瀏覽器自動化
    "playwright": {
        type: "local",
        command: "npx",
        args: ["-y", "@anthropic/mcp-playwright"],
        tools: ["*"],
    },
};
```

---

## 🚀 完整初始化範例

```typescript
import { CopilotClient, defineTool } from "@github/copilot-sdk";
import { z } from "zod";

// BlogSys Copilot Skill 初始化
export async function initBlogSysCopilot() {
    const client = new CopilotClient({
        logLevel: "info",
    });

    // 定義所有自定義工具
    const tools = [
        generateBlogOutline,
        fetchBlogData,
        generateImagePrompt,
    ];

    // 定義所有自定義 Agent
    const customAgents = [
        blogsysWriter,
        codeReviewer,
        uiDesigner,
    ];

    // 建立 Session
    const session = await client.createSession({
        model: "gpt-4.1",
        streaming: true,
        tools,
        customAgents,
        mcpServers,
        systemMessage: {
            mode: "append",
            content: `
## BlogSys 專案背景
這是一個 Cyberpunk 風格的部落格系統，使用 Next.js 16 + React 19 + Tailwind CSS。
所有 UI 設計必須遵循 AGENTS.md 中定義的設計系統。
            `,
        },
    });

    return { client, session };
}
```

---

## 📚 使用方式

### 呼叫特定 Agent

```typescript
// 使用部落格寫手
await session.send({
    prompt: "@blogsys-writer 寫一篇關於 Web3 的技術文章開頭"
});

// 使用程式碼審查員
await session.send({
    prompt: "@code-reviewer 審查 src/app/page.jsx 的程式碼"
});

// 使用 UI 設計師
await session.send({
    prompt: "@ui-designer 設計一個 Cyberpunk 風格的按鈕元件"
});
```

### 使用自定義工具

```typescript
// 工具會被 AI 自動呼叫
await session.send({
    prompt: "為「Next.js App Router 完全指南」生成一個 6 節的文章大綱"
});
```

---

*最後更新: 2026-01-23*
