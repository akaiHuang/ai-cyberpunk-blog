"""
🏭 BlogSys Multi-Agent 開發工廠 (Python 版本)

架構：
┌─────────────────────────────────────────────────────────────┐
│                    👷 Supervisor Agent                       │
│                    (監工 - 分配任務、監控進度)                  │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  👨‍💻 Worker #1   │ │  👨‍💻 Worker #2   │ │  👨‍💻 Worker #3   │
│  (前端開發)      │ │  (後端開發)      │ │  (樣式設計)      │
└─────────────────┘ └─────────────────┘ └─────────────────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    🧪 Tester Agent                          │
│                    (測試員 - 自動化測試、品質檢查)             │
└─────────────────────────────────────────────────────────────┘

執行方式：
python multi_agent_factory.py
"""

import asyncio
import random
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


# ============================================================================
# 📦 資料模型
# ============================================================================

class TaskType(str, Enum):
    FRONTEND = "frontend"
    BACKEND = "backend"
    STYLING = "styling"
    TEST = "test"


class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in-progress"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class Task:
    id: str
    type: TaskType
    description: str
    status: TaskStatus = TaskStatus.PENDING
    assignee: Optional[str] = None
    result: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None


# 共享任務隊列
task_queue: List[Task] = []
completed_tasks: List[Task] = []


# ============================================================================
# 🛠️ 工具定義
# ============================================================================

class CreateTaskParams(BaseModel):
    type: TaskType = Field(description="任務類型")
    description: str = Field(description="任務描述")


class ClaimTaskParams(BaseModel):
    worker_id: str = Field(description="Worker ID")
    preferred_type: Optional[TaskType] = Field(default=None, description="偏好的任務類型")


class CompleteTaskParams(BaseModel):
    task_id: str = Field(description="任務 ID")
    result: str = Field(description="完成結果")


class WriteCodeParams(BaseModel):
    file_path: str = Field(description="檔案路徑")
    code: str = Field(description="程式碼內容")
    description: str = Field(description="程式碼描述")


class RunTestsParams(BaseModel):
    test_type: str = Field(description="測試類型: unit, integration, e2e")
    target_file: Optional[str] = Field(default=None, description="目標檔案")


class EmptyParams(BaseModel):
    pass


# ============================================================================
# 🤖 Agent Prompts
# ============================================================================

SUPERVISOR_PROMPT = """你是開發團隊的監工 (Supervisor)。

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

輸出格式：使用中文，清晰說明任務分配情況。"""

WORKER_FRONTEND_PROMPT = """你是前端開發 Worker。

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
- 使用霓虹綠 (#00FF99) 作為主色"""

WORKER_BACKEND_PROMPT = """你是後端開發 Worker。

## 你的職責
1. 用 claim_task 領取 backend 類型任務
2. 用 write_code 寫入 API Route
3. 用 complete_task 回報完成

## 技術棧
- Next.js API Routes
- TypeScript
- JSON 資料處理"""

WORKER_STYLING_PROMPT = """你是 UI/樣式開發 Worker。

## 你的職責
1. 用 claim_task 領取 styling 類型任務
2. 用 write_code 寫入 CSS/Tailwind 樣式
3. 用 complete_task 回報完成

## 設計系統
- 主色: #00FF99 (霓虹綠)
- 背景: #000000 (純黑)
- 無圓角設計 (rounded-none)"""

TESTER_PROMPT = """你是自動化測試 Worker。

## 你的職責
1. 用 claim_task 領取 test 類型任務
2. 用 run_tests 執行測試
3. 分析測試結果，回報問題
4. 用 complete_task 回報完成"""


# ============================================================================
# 🏭 Multi-Agent Factory
# ============================================================================

class MultiAgentFactory:
    """多 Agent 協作開發工廠"""
    
    def __init__(self):
        self.client = None
        self.agents: Dict[str, Any] = {}
    
    async def initialize(self):
        """初始化所有 Agent"""
        from copilot import CopilotClient, define_tool
        
        print("🏭 初始化多 Agent 開發工廠...\n")
        
        self.client = CopilotClient()
        await self.client.start()
        
        # 定義工具
        @define_tool(description="建立新的開發任務")
        def create_task(params: CreateTaskParams) -> dict:
            task = Task(
                id=f"task-{len(task_queue)+1}",
                type=params.type,
                description=params.description,
            )
            task_queue.append(task)
            return {"task_id": task.id, "message": f"任務已建立: {params.description}"}
        
        @define_tool(description="領取待處理的任務")
        def claim_task(params: ClaimTaskParams) -> dict:
            for task in task_queue:
                if task.status == TaskStatus.PENDING:
                    if params.preferred_type is None or task.type == params.preferred_type:
                        task.status = TaskStatus.IN_PROGRESS
                        task.assignee = params.worker_id
                        return {"task": vars(task), "message": f"任務已分配給 {params.worker_id}"}
            return {"task": None, "message": "目前沒有可領取的任務"}
        
        @define_tool(description="標記任務為已完成")
        def complete_task(params: CompleteTaskParams) -> dict:
            for task in task_queue:
                if task.id == params.task_id:
                    task.status = TaskStatus.COMPLETED
                    task.result = params.result
                    task.completed_at = datetime.now()
                    completed_tasks.append(task)
                    return {"success": True, "message": f"任務 {params.task_id} 已完成"}
            return {"success": False, "message": "找不到任務"}
        
        @define_tool(description="查看所有任務的狀態")
        def get_task_status(params: EmptyParams) -> dict:
            return {
                "pending": len([t for t in task_queue if t.status == TaskStatus.PENDING]),
                "in_progress": len([t for t in task_queue if t.status == TaskStatus.IN_PROGRESS]),
                "completed": len(completed_tasks),
            }
        
        @define_tool(description="寫入程式碼到檔案")
        def write_code(params: WriteCodeParams) -> dict:
            print(f"\n📝 [寫入檔案] {params.file_path}")
            print(f"   描述: {params.description}")
            print(f"   程式碼長度: {len(params.code)} 字元\n")
            return {"success": True, "file_path": params.file_path}
        
        @define_tool(description="執行自動化測試")
        def run_tests(params: RunTestsParams) -> dict:
            print(f"\n🧪 [執行測試] {params.test_type} tests")
            passed = random.random() > 0.2
            return {
                "type": params.test_type,
                "passed": passed,
                "message": "所有測試通過 ✅" if passed else "部分測試失敗 ❌",
                "coverage": f"{random.randint(70, 100)}%",
            }
        
        tools = [create_task, claim_task, complete_task, get_task_status, write_code, run_tests]
        
        # 建立 Agents
        agent_configs = [
            ("supervisor", "監工", SUPERVISOR_PROMPT),
            ("worker-frontend", "前端開發", WORKER_FRONTEND_PROMPT),
            ("worker-backend", "後端開發", WORKER_BACKEND_PROMPT),
            ("worker-styling", "樣式設計", WORKER_STYLING_PROMPT),
            ("tester", "測試員", TESTER_PROMPT),
        ]
        
        for agent_id, role, prompt in agent_configs:
            session = await self.client.create_session({
                "model": "gpt-4.1",
                "streaming": True,
                "tools": tools,
                "system_message": {
                    "mode": "append",
                    "content": prompt,
                },
            })
            self.agents[agent_id] = {
                "session": session,
                "role": role,
            }
            print(f"  ✓ {role} ({agent_id}) 已上線")
        
        print("\n✅ 所有 Agent 已就位！\n")
        print("=" * 60)
    
    async def send_to_agent(self, agent_id: str, message: str) -> str:
        """發送訊息給特定 Agent"""
        from copilot.generated.session_events import SessionEventType
        
        agent = self.agents.get(agent_id)
        if not agent:
            raise ValueError(f"Agent {agent_id} 不存在")
        
        response_parts = []
        done_event = asyncio.Event()
        
        def handle_event(event):
            if event.type == SessionEventType.ASSISTANT_MESSAGE_DELTA:
                response_parts.append(event.data.delta_content or "")
            if event.type == SessionEventType.TOOL_EXECUTION_START:
                print(f"  🔧 {agent['role']} 執行: {event.data.tool_name}")
            if event.type == SessionEventType.SESSION_IDLE:
                done_event.set()
        
        agent["session"].on(handle_event)
        await agent["session"].send({"prompt": message})
        await done_event.wait()
        
        return "".join(response_parts)
    
    async def assign_tasks(self, requirement: str):
        """監工分配任務"""
        print("\n👷 [監工] 分析需求並分配任務...\n")
        
        response = await self.send_to_agent(
            "supervisor",
            f"請分析以下需求，並建立適當的任務分配給 Worker：\n\n{requirement}"
        )
        
        print(f"\n📋 監工回應:\n{response}")
        return response
    
    async def workers_execute(self):
        """Workers 並行工作"""
        print("\n👨‍💻 [Workers] 開始並行執行任務...\n")
        
        worker_ids = ["worker-frontend", "worker-backend", "worker-styling"]
        
        # 並行執行所有 Worker
        async def worker_task(worker_id: str):
            agent = self.agents.get(worker_id)
            if not agent:
                return None
            
            print(f"  🚀 {agent['role']} 開始工作...")
            
            response = await self.send_to_agent(
                worker_id,
                "請領取一個適合你的任務並完成它。完成後回報結果。"
            )
            
            print(f"  ✅ {agent['role']} 完成工作")
            return {"worker_id": worker_id, "role": agent["role"], "response": response}
        
        results = await asyncio.gather(*[worker_task(wid) for wid in worker_ids])
        return [r for r in results if r]
    
    async def run_all_tests(self):
        """測試員執行測試"""
        print("\n🧪 [測試員] 開始執行自動化測試...\n")
        
        response = await self.send_to_agent(
            "tester",
            "請執行所有類型的測試（unit, integration, e2e），並回報測試結果。"
        )
        
        print(f"\n📊 測試報告:\n{response}")
        return response
    
    async def run_development_cycle(self, requirement: str):
        """完整開發流程"""
        print("=" * 60)
        print("🎮 BlogSys 多 Agent 開發系統")
        print("=" * 60)
        print(f"\n📝 需求: {requirement}\n")
        
        # Step 1: 監工分析並分配任務
        await self.assign_tasks(requirement)
        
        # Step 2: Workers 並行開發
        await self.workers_execute()
        
        # Step 3: 再次檢查是否有待處理任務
        iterations = 0
        while iterations < 3:
            pending_count = len([t for t in task_queue if t.status == TaskStatus.PENDING])
            if pending_count > 0:
                await self.workers_execute()
            else:
                break
            iterations += 1
        
        # Step 4: 測試員執行測試
        await self.run_all_tests()
        
        # Step 5: 最終報告
        print("\n" + "=" * 60)
        print("📋 開發完成報告")
        print("=" * 60)
        print(f"✅ 完成任務: {len(completed_tasks)}")
        print(f"⏳ 待處理: {len([t for t in task_queue if t.status == TaskStatus.PENDING])}")
        print(f"🔄 進行中: {len([t for t in task_queue if t.status == TaskStatus.IN_PROGRESS])}")
    
    async def shutdown(self):
        """關閉所有 Agent"""
        print("\n🛑 關閉所有 Agent...")
        for agent_id, agent in self.agents.items():
            await agent["session"].destroy()
            print(f"  ✓ {agent['role']} 已下線")
        await self.client.stop()
        print("✅ 系統已關閉\n")


# ============================================================================
# 🚀 主程式
# ============================================================================

async def main():
    factory = MultiAgentFactory()
    
    try:
        # 初始化所有 Agent
        await factory.initialize()
        
        # 執行開發週期
        await factory.run_development_cycle("""
            為 BlogSys 開發一個「AI 助手」功能：
            1. 前端：建立一個聊天介面元件，Cyberpunk 風格
            2. 後端：建立 /api/assistant API Route
            3. 樣式：設計霓虹發光效果的訊息氣泡
            4. 測試：確保功能正常運作
        """)
        
    except ImportError as e:
        print(f"\n⚠️ 請先安裝 Copilot SDK: pip install github-copilot-sdk pydantic")
        print(f"錯誤詳情: {e}")
        
    except Exception as e:
        print(f"❌ 錯誤: {e}")
        raise
        
    finally:
        if factory.client:
            await factory.shutdown()


if __name__ == "__main__":
    asyncio.run(main())
