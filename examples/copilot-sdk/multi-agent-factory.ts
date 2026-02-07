/**
 * 🏭 BlogSys Multi-Agent 開發工廠
 * 
 * 架構：
 * ┌─────────────────────────────────────────────────────────────┐
 * │                    👷 Supervisor Agent                       │
 * │                    (監工 - 分配任務、監控進度)                  │
 * └─────────────────────────────────────────────────────────────┘
 *                              │
 *          ┌──────────────────┼──────────────────┐
 *          ▼                  ▼                  ▼
 * ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
 * │  👨‍💻 Worker #1   │ │  👨‍💻 Worker #2   │ │  👨‍💻 Worker #3   │
 * │  (前端開發)      │ │  (後端開發)      │ │  (樣式設計)      │
 * └─────────────────┘ └─────────────────┘ └─────────────────┘
 *          │                  │                  │
 *          └──────────────────┼──────────────────┘
 *                             ▼
 * ┌─────────────────────────────────────────────────────────────┐
 * │                    🧪 Tester Agent                          │
 * │                    (測試員 - 自動化測試、品質檢查)             │
 * └─────────────────────────────────────────────────────────────┘
 */

import { CopilotClient, defineTool, SessionEvent } from "@github/copilot-sdk";
import { z } from "zod";

// ============================================================================
// 🛠️ 共享工具定義
// ============================================================================

// 任務狀態管理
interface Task {
    id: string;
    type: "frontend" | "backend" | "styling" | "test";
    description: string;
    status: "pending" | "in-progress" | "completed" | "failed";
    assignee?: string;
    result?: string;
    createdAt: Date;
    completedAt?: Date;
}

// 任務隊列 (共享狀態)
const taskQueue: Task[] = [];
const completedTasks: Task[] = [];

// 建立任務工具
const createTask = defineTool("create_task", {
    description: "建立新的開發任務",
    parameters: z.object({
        type: z.enum(["frontend", "backend", "styling", "test"]),
        description: z.string(),
    }),
    handler: async ({ type, description }) => {
        const task: Task = {
            id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type,
            description,
            status: "pending",
            createdAt: new Date(),
        };
        taskQueue.push(task);
        return { taskId: task.id, message: `任務已建立: ${description}` };
    },
});

// 領取任務工具
const claimTask = defineTool("claim_task", {
    description: "領取待處理的任務",
    parameters: z.object({
        workerId: z.string(),
        preferredType: z.enum(["frontend", "backend", "styling", "test"]).optional(),
    }),
    handler: async ({ workerId, preferredType }) => {
        const task = taskQueue.find(
            t => t.status === "pending" && (!preferredType || t.type === preferredType)
        );
        if (task) {
            task.status = "in-progress";
            task.assignee = workerId;
            return { task, message: `任務已分配給 ${workerId}` };
        }
        return { task: null, message: "目前沒有可領取的任務" };
    },
});

// 完成任務工具
const completeTask = defineTool("complete_task", {
    description: "標記任務為已完成",
    parameters: z.object({
        taskId: z.string(),
        result: z.string(),
    }),
    handler: async ({ taskId, result }) => {
        const task = taskQueue.find(t => t.id === taskId);
        if (task) {
            task.status = "completed";
            task.result = result;
            task.completedAt = new Date();
            completedTasks.push(task);
            return { success: true, message: `任務 ${taskId} 已完成` };
        }
        return { success: false, message: "找不到任務" };
    },
});

// 查看任務狀態工具
const getTaskStatus = defineTool("get_task_status", {
    description: "查看所有任務的狀態",
    parameters: z.object({}),
    handler: async () => {
        return {
            pending: taskQueue.filter(t => t.status === "pending").length,
            inProgress: taskQueue.filter(t => t.status === "in-progress").length,
            completed: completedTasks.length,
            tasks: [...taskQueue, ...completedTasks].slice(-10),
        };
    },
});

// 寫入程式碼工具 (模擬)
const writeCode = defineTool("write_code", {
    description: "寫入程式碼到檔案",
    parameters: z.object({
        filePath: z.string(),
        code: z.string(),
        description: z.string(),
    }),
    handler: async ({ filePath, code, description }) => {
        console.log(`\n📝 [寫入檔案] ${filePath}`);
        console.log(`   描述: ${description}`);
        console.log(`   程式碼長度: ${code.length} 字元\n`);
        // 實際應用中會真的寫入檔案
        return { success: true, filePath, message: `已寫入 ${filePath}` };
    },
});

// 執行測試工具 (模擬)
const runTests = defineTool("run_tests", {
    description: "執行自動化測試",
    parameters: z.object({
        testType: z.enum(["unit", "integration", "e2e"]),
        targetFile: z.string().optional(),
    }),
    handler: async ({ testType, targetFile }) => {
        console.log(`\n🧪 [執行測試] ${testType} tests`);
        if (targetFile) console.log(`   目標: ${targetFile}`);
        
        // 模擬測試結果
        const passed = Math.random() > 0.2;
        return {
            type: testType,
            passed,
            message: passed ? "所有測試通過 ✅" : "部分測試失敗 ❌",
            coverage: Math.floor(Math.random() * 30 + 70) + "%",
        };
    },
});

// ============================================================================
// 🤖 Agent 定義
// ============================================================================

const SUPERVISOR_PROMPT = `你是開發團隊的監工 (Supervisor)。

## 你的職責
1. 分析用戶需求，將大任務拆解為小任務
2. 分配任務給不同類型的 Worker
3. 監控開發進度
4. 協調 Worker 之間的工作

## 任務類型
- frontend: 前端元件、頁面開發
- backend: API、資料處理
- styling: CSS、UI 設計
- test: 測試案例

## 工作流程
1. 收到需求後，用 create_task 建立任務
2. 定期用 get_task_status 檢查進度
3. 當所有任務完成後，建立 test 類型任務進行測試

輸出格式：使用中文，清晰說明任務分配情況。`;

const WORKER_FRONTEND_PROMPT = `你是前端開發 Worker。

## 你的職責
1. 用 claim_task 領取 frontend 類型任務
2. 用 write_code 寫入 React/Next.js 元件
3. 用 complete_task 回報完成

## 技術棧
- Next.js 16 (App Router)
- React 19
- Tailwind CSS
- Framer Motion

## 程式碼風格
- 使用 'use client' 標記 Client Component
- 遵循 Cyberpunk 設計系統
- 使用霓虹綠 (#00FF99) 作為主色`;

const WORKER_BACKEND_PROMPT = `你是後端開發 Worker。

## 你的職責
1. 用 claim_task 領取 backend 類型任務
2. 用 write_code 寫入 API Route
3. 用 complete_task 回報完成

## 技術棧
- Next.js API Routes
- TypeScript
- JSON 資料處理

## API 格式
- 使用 POST 方法
- 返回 JSON 格式
- 包含錯誤處理`;

const WORKER_STYLING_PROMPT = `你是 UI/樣式開發 Worker。

## 你的職責
1. 用 claim_task 領取 styling 類型任務
2. 用 write_code 寫入 CSS/Tailwind 樣式
3. 用 complete_task 回報完成

## 設計系統
- 主色: #00FF99 (霓虹綠)
- 次要: #FFD700 (金黃)
- 背景: #000000 (純黑)
- 邊框: #222222
- 無圓角設計 (rounded-none)`;

const TESTER_PROMPT = `你是自動化測試 Worker。

## 你的職責
1. 用 claim_task 領取 test 類型任務
2. 用 run_tests 執行測試
3. 分析測試結果，回報問題
4. 用 complete_task 回報完成

## 測試類型
- unit: 單元測試
- integration: 整合測試
- e2e: 端到端測試

## 測試重點
- 功能正確性
- 邊界條件
- 錯誤處理`;

// ============================================================================
// 🏭 多 Agent 協作系統
// ============================================================================

interface AgentSession {
    name: string;
    role: string;
    session: any;  // CopilotSession
    isWorking: boolean;
}

export class MultiAgentFactory {
    private client: CopilotClient;
    private agents: Map<string, AgentSession> = new Map();
    private isRunning = false;

    constructor() {
        this.client = new CopilotClient({
            logLevel: "error",
        });
    }

    async initialize() {
        console.log("🏭 初始化多 Agent 開發工廠...\n");

        // 建立監工
        await this.createAgent("supervisor", "監工", SUPERVISOR_PROMPT);
        
        // 建立 Workers (可並行)
        await Promise.all([
            this.createAgent("worker-frontend", "前端開發", WORKER_FRONTEND_PROMPT),
            this.createAgent("worker-backend", "後端開發", WORKER_BACKEND_PROMPT),
            this.createAgent("worker-styling", "樣式設計", WORKER_STYLING_PROMPT),
        ]);

        // 建立測試員
        await this.createAgent("tester", "測試員", TESTER_PROMPT);

        console.log("\n✅ 所有 Agent 已就位！\n");
        console.log("=".repeat(60));
    }

    private async createAgent(id: string, role: string, systemPrompt: string) {
        const session = await this.client.createSession({
            model: "gpt-4.1",
            streaming: true,
            tools: [createTask, claimTask, completeTask, getTaskStatus, writeCode, runTests],
            systemMessage: {
                mode: "append",
                content: systemPrompt,
            },
        });

        this.agents.set(id, {
            name: id,
            role,
            session,
            isWorking: false,
        });

        console.log(`  ✓ ${role} (${id}) 已上線`);
    }

    // 發送訊息給特定 Agent
    async sendToAgent(agentId: string, message: string): Promise<string> {
        const agent = this.agents.get(agentId);
        if (!agent) throw new Error(`Agent ${agentId} 不存在`);

        return new Promise((resolve) => {
            let response = "";
            
            agent.session.on((event: SessionEvent) => {
                if (event.type === "assistant.message_delta") {
                    response += event.data.deltaContent || "";
                }
                if (event.type === "tool.execution_start") {
                    console.log(`  🔧 ${agent.role} 執行: ${event.data.toolName}`);
                }
                if (event.type === "session.idle") {
                    resolve(response);
                }
            });

            agent.session.send({ prompt: message });
        });
    }

    // 監工分配任務
    async assignTasks(requirement: string) {
        console.log("\n👷 [監工] 分析需求並分配任務...\n");
        
        const response = await this.sendToAgent(
            "supervisor",
            `請分析以下需求，並建立適當的任務分配給 Worker：\n\n${requirement}`
        );
        
        console.log("\n📋 監工回應:\n" + response);
        return response;
    }

    // Workers 並行工作
    async workersExecute() {
        console.log("\n👨‍💻 [Workers] 開始並行執行任務...\n");

        const workerIds = ["worker-frontend", "worker-backend", "worker-styling"];
        
        // 並行執行所有 Worker
        const results = await Promise.all(
            workerIds.map(async (workerId) => {
                const agent = this.agents.get(workerId);
                if (!agent) return null;

                console.log(`  🚀 ${agent.role} 開始工作...`);
                
                const response = await this.sendToAgent(
                    workerId,
                    "請領取一個適合你的任務並完成它。完成後回報結果。"
                );
                
                console.log(`  ✅ ${agent.role} 完成工作`);
                return { workerId, role: agent.role, response };
            })
        );

        return results.filter(Boolean);
    }

    // 測試員執行測試
    async runAllTests() {
        console.log("\n🧪 [測試員] 開始執行自動化測試...\n");

        const response = await this.sendToAgent(
            "tester",
            "請執行所有類型的測試（unit, integration, e2e），並回報測試結果。"
        );

        console.log("\n📊 測試報告:\n" + response);
        return response;
    }

    // 完整開發流程
    async runDevelopmentCycle(requirement: string) {
        console.log("=".repeat(60));
        console.log("🎮 BlogSys 多 Agent 開發系統");
        console.log("=".repeat(60));
        console.log(`\n📝 需求: ${requirement}\n`);

        // Step 1: 監工分析並分配任務
        await this.assignTasks(requirement);

        // Step 2: Workers 並行開發
        await this.workersExecute();

        // Step 3: 再次檢查是否有待處理任務
        let hasMoreTasks = true;
        let iterations = 0;
        while (hasMoreTasks && iterations < 3) {
            const status = await this.sendToAgent("supervisor", "請檢查任務狀態");
            console.log("\n📊 任務狀態:\n" + status);

            // 檢查是否還有 pending 任務
            const pendingCount = taskQueue.filter(t => t.status === "pending").length;
            if (pendingCount > 0) {
                await this.workersExecute();
            } else {
                hasMoreTasks = false;
            }
            iterations++;
        }

        // Step 4: 測試員執行測試
        await this.runAllTests();

        // Step 5: 最終報告
        console.log("\n" + "=".repeat(60));
        console.log("📋 開發完成報告");
        console.log("=".repeat(60));
        console.log(`✅ 完成任務: ${completedTasks.length}`);
        console.log(`⏳ 待處理: ${taskQueue.filter(t => t.status === "pending").length}`);
        console.log(`🔄 進行中: ${taskQueue.filter(t => t.status === "in-progress").length}`);
    }

    async shutdown() {
        console.log("\n🛑 關閉所有 Agent...");
        for (const [id, agent] of this.agents) {
            await agent.session.destroy();
            console.log(`  ✓ ${agent.role} 已下線`);
        }
        await this.client.stop();
        console.log("✅ 系統已關閉\n");
    }
}

// ============================================================================
// 🚀 主程式
// ============================================================================

async function main() {
    const factory = new MultiAgentFactory();

    try {
        // 初始化所有 Agent
        await factory.initialize();

        // 執行開發週期
        await factory.runDevelopmentCycle(`
            為 BlogSys 開發一個「AI 助手」功能：
            1. 前端：建立一個聊天介面元件，Cyberpunk 風格
            2. 後端：建立 /api/assistant API Route
            3. 樣式：設計霓虹發光效果的訊息氣泡
            4. 測試：確保功能正常運作
        `);

    } catch (error) {
        console.error("❌ 錯誤:", error);
    } finally {
        await factory.shutdown();
    }
}

// 執行
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { MultiAgentFactory };
