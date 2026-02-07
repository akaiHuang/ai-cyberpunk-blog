"""
BlogSys Copilot SDK Python 範例
展示如何在 BlogSys 專案中整合 GitHub Copilot SDK (Python 版本)

執行方式：
python examples/copilot-sdk/basic_example.py
"""

import asyncio
import sys
import random
from typing import Optional

# ============================================================================
# 範例 1: 基本對話
# ============================================================================

async def basic_conversation():
    """基本對話範例"""
    from copilot import CopilotClient
    
    print("🚀 範例 1: 基本對話\n")
    
    client = CopilotClient()
    await client.start()
    
    try:
        session = await client.create_session({
            "model": "gpt-5"
        })
        
        response = await session.send_and_wait({
            "prompt": "用一句話介紹什麼是 Cyberpunk 風格"
        })
        
        if response:
            print(f"🤖 AI 回應: {response.data.content}")
        
        await session.destroy()
        return response.data.content if response else None
        
    finally:
        await client.stop()


# ============================================================================
# 範例 2: 串流回應
# ============================================================================

async def streaming_example():
    """串流回應範例"""
    from copilot import CopilotClient
    from copilot.generated.session_events import SessionEventType
    
    print("\n🚀 範例 2: 串流回應\n")
    
    client = CopilotClient()
    await client.start()
    
    try:
        session = await client.create_session({
            "model": "gpt-4.1",
            "streaming": True,
        })
        
        # 設定串流事件處理
        def handle_event(event):
            if event.type == SessionEventType.ASSISTANT_MESSAGE_DELTA:
                sys.stdout.write(event.data.delta_content or "")
                sys.stdout.flush()
            if event.type == SessionEventType.SESSION_IDLE:
                print("\n")
        
        session.on(handle_event)
        
        sys.stdout.write("🤖 AI: ")
        await session.send_and_wait({
            "prompt": "寫一首關於程式設計的俳句"
        })
        
        await session.destroy()
        
    finally:
        await client.stop()


# ============================================================================
# 範例 3: 自定義工具 - 部落格生成器
# ============================================================================

async def custom_tool_example():
    """自定義工具範例"""
    from pydantic import BaseModel, Field
    from copilot import CopilotClient, define_tool
    from copilot.generated.session_events import SessionEventType
    
    print("\n🚀 範例 3: 自定義工具\n")
    
    # 定義參數模型
    class BlogOutlineParams(BaseModel):
        topic: str = Field(description="文章主題")
        sections: int = Field(default=5, description="章節數量")
    
    class EmptyParams(BaseModel):
        pass
    
    # 定義部落格大綱工具
    @define_tool(description="為給定主題生成部落格文章大綱")
    def generate_blog_outline(params: BlogOutlineParams) -> dict:
        outline = {
            "title": f"深入解析：{params.topic}",
            "sections": [
                {
                    "heading": f"第 {i+1} 節",
                    "description": f"關於 {params.topic} 的第 {i+1} 個重點"
                }
                for i in range(params.sections)
            ],
            "estimatedReadTime": f"{params.sections * 2} 分鐘"
        }
        return outline
    
    # 定義取得分類工具
    @define_tool(description="取得 BlogSys 的所有部落格分類")
    def fetch_blog_categories(params: EmptyParams) -> dict:
        return {
            "categories": [
                {"id": "tech", "name": "技術文章", "color": "#00FF99"},
                {"id": "design", "name": "設計靈感", "color": "#FFD700"},
                {"id": "ai", "name": "AI 探索", "color": "#FF00FF"},
                {"id": "life", "name": "生活隨筆", "color": "#00BFFF"},
            ]
        }
    
    client = CopilotClient()
    await client.start()
    
    try:
        session = await client.create_session({
            "model": "gpt-4.1",
            "streaming": True,
            "tools": [generate_blog_outline, fetch_blog_categories],
        })
        
        # 設定事件處理
        def handle_event(event):
            if event.type == SessionEventType.ASSISTANT_MESSAGE_DELTA:
                sys.stdout.write(event.data.delta_content or "")
                sys.stdout.flush()
            if event.type == SessionEventType.TOOL_EXECUTION_START:
                print(f"\n⚙️  執行工具: {event.data.tool_name}")
            if event.type == SessionEventType.SESSION_IDLE:
                print("\n")
        
        session.on(handle_event)
        
        await session.send_and_wait({
            "prompt": "請先取得 BlogSys 的分類，然後為「Web3 去中心化技術」這個主題生成一個 4 節的文章大綱"
        })
        
        await session.destroy()
        
    finally:
        await client.stop()


# ============================================================================
# 範例 4: MCP Server 整合
# ============================================================================

async def mcp_server_example():
    """MCP Server 整合範例"""
    from copilot import CopilotClient
    from copilot.types import MCPServerConfig
    
    print("\n🚀 範例 4: MCP Server 整合\n")
    
    client = CopilotClient()
    await client.start()
    
    try:
        # 設定 MCP Servers
        mcp_servers: dict[str, MCPServerConfig] = {
            "filesystem": {
                "type": "local",
                "command": "npx",
                "args": ["-y", "@anthropic/mcp-filesystem", "./"],
                "tools": ["*"],
            }
        }
        
        session = await client.create_session({
            "mcp_servers": mcp_servers
        })
        
        response = await session.send_and_wait({
            "prompt": "讀取 README.md 檔案的內容並總結"
        })
        
        if response:
            print(f"🤖 AI: {response.data.content}")
        
        await session.destroy()
        
    finally:
        await client.stop()


# ============================================================================
# 範例 5: BlogSys AI 助手
# ============================================================================

async def blogsys_assistant_example():
    """BlogSys AI 助手範例"""
    from copilot import CopilotClient
    from copilot.types import CustomAgentConfig
    from copilot.generated.session_events import SessionEventType
    
    print("\n🚀 範例 5: BlogSys AI 助手\n")
    
    # 定義 BlogSys 專用 Agent
    custom_agents: list[CustomAgentConfig] = [
        {
            "name": "blogsys-writer",
            "display_name": "BlogSys Writer",
            "description": "BlogSys Cyberpunk 風格部落格寫手",
            "prompt": """你是 BlogSys 的專業內容創作者。

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
總是使用 Markdown 格式輸出，包含適當的標題、列表和程式碼區塊。""",
            "infer": True,
        },
        {
            "name": "code-reviewer",
            "display_name": "Code Reviewer",
            "description": "BlogSys 程式碼審查員",
            "prompt": """你是 BlogSys 專案的程式碼審查員。

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

總是提供具體的程式碼修改建議。""",
            "tools": ["read_file", "search_code"],
            "infer": True,
        }
    ]
    
    client = CopilotClient()
    await client.start()
    
    try:
        session = await client.create_session({
            "model": "gpt-4.1",
            "streaming": True,
            "custom_agents": custom_agents,
        })
        
        # 設定事件處理
        def handle_event(event):
            if event.type == SessionEventType.ASSISTANT_MESSAGE_DELTA:
                sys.stdout.write(event.data.delta_content or "")
                sys.stdout.flush()
            if event.type == SessionEventType.SESSION_IDLE:
                print("\n")
        
        session.on(handle_event)
        
        # 使用 @agent 語法呼叫特定 Agent
        await session.send_and_wait({
            "prompt": "@blogsys-writer 寫一篇關於「AI 輔助程式設計的未來」的開頭段落，200 字以內"
        })
        
        await session.destroy()
        
    finally:
        await client.stop()


# ============================================================================
# 主程式
# ============================================================================

async def main():
    """執行所有範例"""
    print("=" * 60)
    print("🎮 BlogSys Copilot SDK Python 範例集")
    print("=" * 60)
    
    try:
        await basic_conversation()
        await streaming_example()
        await custom_tool_example()
        # await mcp_server_example()  # 需要安裝 MCP server
        await blogsys_assistant_example()
        
        print("\n✅ 所有範例執行完成！")
        
    except ImportError as e:
        print(f"\n⚠️ 請先安裝 Copilot SDK: pip install github-copilot-sdk")
        print(f"錯誤詳情: {e}")
        
    except Exception as e:
        print(f"\n❌ 範例執行失敗: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(main())
