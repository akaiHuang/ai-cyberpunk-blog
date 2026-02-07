/**
 * BlogSys Copilot SDK 範例集
 * 展示如何在 BlogSys 專案中整合 GitHub Copilot SDK
 * 
 * 執行方式：
 * npx tsx examples/copilot-sdk/basic-example.ts
 */

// ============================================================================
// 範例 1: 基本對話
// ============================================================================

import { CopilotClient } from "@github/copilot-sdk";

export async function basicConversation() {
    console.log("🚀 範例 1: 基本對話\n");
    
    const client = new CopilotClient();
    
    try {
        const session = await client.createSession({
            model: "gpt-5",
        });

        // 設定事件監聽
        const done = new Promise<string>((resolve) => {
            let content = "";
            session.on((event) => {
                if (event.type === "assistant.message") {
                    content = event.data.content || "";
                }
                if (event.type === "session.idle") {
                    resolve(content);
                }
            });
        });

        // 發送訊息
        await session.send({ prompt: "用一句話介紹什麼是 Cyberpunk 風格" });
        const response = await done;
        
        console.log("🤖 AI 回應:", response);
        
        await session.destroy();
        await client.stop();
        
        return response;
    } catch (error) {
        console.error("錯誤:", error);
        await client.stop();
        throw error;
    }
}

// ============================================================================
// 範例 2: 串流回應
// ============================================================================

export async function streamingExample() {
    console.log("\n🚀 範例 2: 串流回應\n");
    
    const client = new CopilotClient();
    
    try {
        const session = await client.createSession({
            model: "gpt-4.1",
            streaming: true,
        });

        // 串流監聽
        const done = new Promise<void>((resolve) => {
            process.stdout.write("🤖 AI: ");
            session.on((event) => {
                if (event.type === "assistant.message_delta") {
                    process.stdout.write(event.data.deltaContent || "");
                }
                if (event.type === "session.idle") {
                    console.log("\n");
                    resolve();
                }
            });
        });

        await session.send({ prompt: "寫一首關於程式設計的俳句" });
        await done;
        
        await session.destroy();
        await client.stop();
    } catch (error) {
        console.error("錯誤:", error);
        await client.stop();
        throw error;
    }
}

// ============================================================================
// 範例 3: 自定義工具 - 部落格生成器
// ============================================================================

import { defineTool, SessionEvent } from "@github/copilot-sdk";
import { z } from "zod";

// 定義部落格工具
const generateBlogOutline = defineTool("generate_blog_outline", {
    description: "為給定主題生成部落格文章大綱",
    parameters: z.object({
        topic: z.string().describe("文章主題"),
        sections: z.number().optional().describe("章節數量，預設 5"),
    }),
    handler: async ({ topic, sections = 5 }) => {
        // 模擬生成大綱
        const outline = {
            title: `深入解析：${topic}`,
            sections: Array.from({ length: sections }, (_, i) => ({
                heading: `第 ${i + 1} 節`,
                description: `關於 ${topic} 的第 ${i + 1} 個重點`,
            })),
            estimatedReadTime: `${sections * 2} 分鐘`,
        };
        return outline;
    },
});

const fetchBlogCategories = defineTool("fetch_blog_categories", {
    description: "取得 BlogSys 的所有部落格分類",
    parameters: z.object({}),
    handler: async () => {
        // 模擬取得分類
        return {
            categories: [
                { id: "tech", name: "技術文章", color: "#00FF99" },
                { id: "design", name: "設計靈感", color: "#FFD700" },
                { id: "ai", name: "AI 探索", color: "#FF00FF" },
                { id: "life", name: "生活隨筆", color: "#00BFFF" },
            ]
        };
    },
});

export async function customToolExample() {
    console.log("\n🚀 範例 3: 自定義工具\n");
    
    const client = new CopilotClient();
    
    try {
        const session = await client.createSession({
            model: "gpt-4.1",
            streaming: true,
            tools: [generateBlogOutline, fetchBlogCategories],
        });

        // 監聽事件
        const done = new Promise<void>((resolve) => {
            session.on((event: SessionEvent) => {
                if (event.type === "assistant.message_delta") {
                    process.stdout.write(event.data.deltaContent || "");
                }
                if (event.type === "tool.execution_start") {
                    console.log(`\n⚙️  執行工具: ${event.data.toolName}`);
                }
                if (event.type === "session.idle") {
                    console.log("\n");
                    resolve();
                }
            });
        });

        await session.send({
            prompt: "請先取得 BlogSys 的分類，然後為「Web3 去中心化技術」這個主題生成一個 4 節的文章大綱"
        });
        await done;
        
        await session.destroy();
        await client.stop();
    } catch (error) {
        console.error("錯誤:", error);
        await client.stop();
        throw error;
    }
}

// ============================================================================
// 範例 4: MCP Server 整合
// ============================================================================

export async function mcpServerExample() {
    console.log("\n🚀 範例 4: MCP Server 整合\n");
    
    const client = new CopilotClient();
    
    try {
        const session = await client.createSession({
            model: "gpt-4.1",
            mcpServers: {
                "filesystem": {
                    type: "local",
                    command: "npx",
                    args: ["-y", "@anthropic/mcp-filesystem", "./"],
                    tools: ["*"],
                },
            },
        });

        // 監聽事件
        const done = new Promise<void>((resolve) => {
            session.on((event: SessionEvent) => {
                if (event.type === "assistant.message") {
                    console.log("🤖 AI:", event.data.content);
                }
                if (event.type === "session.idle") {
                    resolve();
                }
            });
        });

        await session.send({
            prompt: "讀取 README.md 檔案的內容並總結"
        });
        await done;
        
        await session.destroy();
        await client.stop();
    } catch (error) {
        console.error("錯誤:", error);
        await client.stop();
        throw error;
    }
}

// ============================================================================
// 範例 5: BlogSys AI 助手
// ============================================================================

import type { CustomAgentConfig } from "@github/copilot-sdk";

export async function blogSysAssistantExample() {
    console.log("\n🚀 範例 5: BlogSys AI 助手\n");
    
    const client = new CopilotClient();
    
    // 定義 BlogSys 專用 Agent
    const customAgents: CustomAgentConfig[] = [
        {
            name: "blogsys-writer",
            displayName: "BlogSys Writer",
            description: "BlogSys Cyberpunk 風格部落格寫手",
            prompt: `你是 BlogSys 的專業內容創作者。

## 你的身份
- 名稱：BlogSys AI Writer
- 風格：Cyberpunk / Hacker Terminal

## 寫作風格指南
- 使用科技感十足的語言
- 適當加入 Cyberpunk 相關詞彙（如：數位空間、霓虹、終端機等）
- 保持專業但有趣的語調
- 文章結構清晰，使用 Markdown 格式

## 色彩主題
- 主色：#00FF99 (霓虹綠)
- 次要：#FFD700 (金黃)
- 強調：#FF00FF (霓虹粉)

## 輸出格式
總是使用 Markdown 格式輸出，包含適當的標題、列表和程式碼區塊。`,
            infer: true,
        },
        {
            name: "code-reviewer",
            displayName: "Code Reviewer",
            description: "BlogSys 程式碼審查員",
            prompt: `你是 BlogSys 專案的程式碼審查員。

## 審查重點
1. 程式碼品質與最佳實踐
2. React/Next.js 慣例
3. TypeScript 類型安全
4. Tailwind CSS 使用
5. 效能優化建議

## 輸出格式
使用以下格式輸出審查結果：
- ✅ 優點
- ⚠️ 建議改進
- ❌ 問題

總是提供具體的程式碼修改建議。`,
            tools: ["read_file", "search_code"],
            infer: true,
        }
    ];
    
    try {
        const session = await client.createSession({
            model: "gpt-4.1",
            streaming: true,
            customAgents,
            tools: [generateBlogOutline, fetchBlogCategories],
        });

        // 監聽事件
        const done = new Promise<void>((resolve) => {
            session.on((event: SessionEvent) => {
                if (event.type === "assistant.message_delta") {
                    process.stdout.write(event.data.deltaContent || "");
                }
                if (event.type === "session.idle") {
                    console.log("\n");
                    resolve();
                }
            });
        });

        // 使用 @agent 語法呼叫特定 Agent
        await session.send({
            prompt: "@blogsys-writer 寫一篇關於「AI 輔助程式設計的未來」的開頭段落，200 字以內"
        });
        await done;
        
        await session.destroy();
        await client.stop();
    } catch (error) {
        console.error("錯誤:", error);
        await client.stop();
        throw error;
    }
}

// ============================================================================
// 主程式
// ============================================================================

async function main() {
    console.log("=" .repeat(60));
    console.log("🎮 BlogSys Copilot SDK 範例集");
    console.log("=".repeat(60));

    // 執行所有範例
    try {
        await basicConversation();
        await streamingExample();
        await customToolExample();
        // await mcpServerExample();  // 需要安裝 MCP server
        await blogSysAssistantExample();
        
        console.log("\n✅ 所有範例執行完成！");
    } catch (error) {
        console.error("\n❌ 範例執行失敗:", error);
        process.exit(1);
    }
}

// 如果直接執行此檔案
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
