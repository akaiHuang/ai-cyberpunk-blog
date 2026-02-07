# 🤖 GitHub Copilot SDK 使用指南

本文件是 **GitHub Copilot SDK** 的完整使用說明，適用於在 BlogSys 專案中整合 AI 能力。

---

## 📋 概覽

GitHub Copilot SDK 讓開發者能以程式化方式存取 GitHub Copilot CLI，支援：

- **多語言支援**：Node.js/TypeScript、Python、Go、.NET
- **對話管理**：建立、恢復、管理多個 Session
- **自定義工具**：定義可被 Copilot 呼叫的自定義函式
- **MCP 整合**：連接 Model Context Protocol 伺服器
- **自定義 Agent**：建立客製化 AI 助手

---

## 🚀 快速安裝

### Node.js / TypeScript

```bash
npm install @github/copilot-sdk
```

### Python

```bash
pip install github-copilot-sdk
```

### Go

```bash
go get github.com/github/copilot-sdk/go
```

### .NET

```bash
dotnet add package GitHub.Copilot.SDK
```

---

## 💡 基本使用

### Node.js / TypeScript

```typescript
import { CopilotClient } from "@github/copilot-sdk";

// 建立客戶端
const client = new CopilotClient();

// 建立 Session
const session = await client.createSession({
    model: "gpt-5",  // 可選: gpt-5, claude-sonnet-4, claude-sonnet-4.5
});

// 等待回應
const done = new Promise<void>((resolve) => {
    session.on((event) => {
        if (event.type === "assistant.message") {
            console.log(event.data.content);
        } else if (event.type === "session.idle") {
            resolve();
        }
    });
});

// 發送訊息
await session.send({ prompt: "What is 2+2?" });
await done;

// 清理
await session.destroy();
await client.stop();
```

### Python

```python
import asyncio
from copilot import CopilotClient

async def main():
    # 建立客戶端
    client = CopilotClient()
    await client.start()

    # 建立 Session
    session = await client.create_session({
        "model": "gpt-5"
    })

    # 發送訊息並等待回應
    response = await session.send_and_wait({
        "prompt": "What is 2 + 2?"
    })

    print(response.data.content)

    await client.stop()

asyncio.run(main())
```

### Go

```go
package main

import (
    "fmt"
    "log"
    
    copilot "github.com/github/copilot-sdk/go"
)

func main() {
    // 建立客戶端
    client := copilot.NewClient(&copilot.ClientOptions{
        LogLevel: "error",
    })

    if err := client.Start(); err != nil {
        log.Fatal(err)
    }
    defer client.Stop()

    // 建立 Session
    session, err := client.CreateSession(&copilot.SessionConfig{
        Model: "gpt-5",
    })
    if err != nil {
        log.Fatal(err)
    }
    defer session.Destroy()

    // 發送訊息
    response, err := session.SendAndWait(copilot.MessageOptions{
        Prompt: "What is 2 + 2?",
    }, 0)
    if err != nil {
        log.Fatal(err)
    }

    fmt.Println(*response.Data.Content)
}
```

---

## 📡 串流回應 (Streaming)

即時接收生成內容：

### Node.js

```typescript
import { CopilotClient, SessionEvent } from "@github/copilot-sdk";

const client = new CopilotClient();
const session = await client.createSession({
    model: "gpt-4.1",
    streaming: true,  // 啟用串流
});

// 監聽串流事件
session.on((event: SessionEvent) => {
    if (event.type === "assistant.message_delta") {
        process.stdout.write(event.data.deltaContent);
    }
    if (event.type === "session.idle") {
        console.log();  // 完成時換行
    }
});

await session.sendAndWait({ prompt: "Tell me a short joke" });

await client.stop();
```

### Python

```python
import sys
from copilot import CopilotClient
from copilot.generated.session_events import SessionEventType

async def main():
    client = CopilotClient()
    await client.start()

    session = await client.create_session({
        "model": "gpt-4.1",
        "streaming": True,
    })

    # 監聽串流事件
    def handle_event(event):
        if event.type == SessionEventType.ASSISTANT_MESSAGE_DELTA:
            sys.stdout.write(event.data.delta_content)
            sys.stdout.flush()
        if event.type == SessionEventType.SESSION_IDLE:
            print()  # 完成時換行

    session.on(handle_event)

    await session.send_and_wait({"prompt": "Tell me a short joke"})

    await client.stop()
```

---

## 🔧 自定義工具 (Custom Tools)

讓 Copilot 呼叫你定義的函式：

### Node.js (使用 Zod)

```typescript
import { CopilotClient, defineTool, SessionEvent } from "@github/copilot-sdk";
import { z } from "zod";

// 定義工具
const getWeather = defineTool("get_weather", {
    description: "Get the current weather for a city",
    parameters: z.object({
        city: z.string().describe("The city name"),
    }),
    handler: async ({ city }) => {
        // 實際應用中會呼叫真實 API
        const conditions = ["sunny", "cloudy", "rainy"];
        const temp = Math.floor(Math.random() * 30) + 50;
        const condition = conditions[Math.floor(Math.random() * conditions.length)];
        return { city, temperature: `${temp}°F`, condition };
    },
});

const client = new CopilotClient();
const session = await client.createSession({
    model: "gpt-4.1",
    streaming: true,
    tools: [getWeather],  // 註冊工具
});

session.on((event: SessionEvent) => {
    if (event.type === "assistant.message_delta") {
        process.stdout.write(event.data.deltaContent);
    }
});

await session.sendAndWait({
    prompt: "What's the weather like in Seattle and Tokyo?",
});

await client.stop();
```

### Python (使用 Pydantic)

```python
from pydantic import BaseModel, Field
from copilot import CopilotClient, define_tool
import random

# 定義參數模型
class GetWeatherParams(BaseModel):
    city: str = Field(description="The city name")

# 定義工具
@define_tool(description="Get the current weather for a city")
def get_weather(params: GetWeatherParams) -> dict:
    conditions = ["sunny", "cloudy", "rainy", "partly cloudy"]
    temp = random.randint(50, 80)
    condition = random.choice(conditions)
    return {
        "city": params.city,
        "temperature": f"{temp}°F",
        "condition": condition
    }

async def main():
    client = CopilotClient()
    await client.start()

    session = await client.create_session({
        "model": "gpt-4.1",
        "streaming": True,
        "tools": [get_weather],  # 註冊工具
    })

    await session.send_and_wait({
        "prompt": "What's the weather like in Seattle?"
    })

    await client.stop()
```

### Go (使用 Struct)

```go
package main

import (
    "fmt"
    "math/rand"

    copilot "github.com/github/copilot-sdk/go"
)

// 定義參數結構
type WeatherParams struct {
    City string `json:"city" jsonschema:"city name"`
}

// 定義回傳結構
type WeatherResult struct {
    City        string `json:"city"`
    Temperature string `json:"temperature"`
    Condition   string `json:"condition"`
}

func main() {
    // 使用泛型定義工具
    getWeather := copilot.DefineTool(
        "get_weather",
        "Get the current weather for a city",
        func(params WeatherParams, inv copilot.ToolInvocation) (WeatherResult, error) {
            conditions := []string{"sunny", "cloudy", "rainy"}
            temp := rand.Intn(30) + 50
            condition := conditions[rand.Intn(len(conditions))]
            return WeatherResult{
                City:        params.City,
                Temperature: fmt.Sprintf("%d°F", temp),
                Condition:   condition,
            }, nil
        },
    )

    client := copilot.NewClient(nil)
    client.Start()
    defer client.Stop()

    session, _ := client.CreateSession(&copilot.SessionConfig{
        Model:     "gpt-4.1",
        Streaming: true,
        Tools:     []copilot.Tool{getWeather},
    })
    defer session.Destroy()

    // 發送訊息，Copilot 會自動呼叫工具
    session.SendAndWait(copilot.MessageOptions{
        Prompt: "What's the weather in Tokyo?",
    }, 0)
}
```

---

## 🔌 MCP Server 整合

連接 Model Context Protocol 伺服器：

### Node.js

```typescript
import { CopilotClient, MCPLocalServerConfig } from "@github/copilot-sdk";

// 設定 MCP Server
const mcpServers: Record<string, MCPLocalServerConfig> = {
    "github-server": {
        type: "local",
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-github"],
        tools: ["*"],  // 允許所有工具
        env: {
            GITHUB_TOKEN: process.env.GITHUB_TOKEN || ""
        }
    },
    "filesystem": {
        type: "local",
        command: "npx",
        args: ["-y", "@anthropic/mcp-filesystem", "./"],
        tools: ["*"],
    }
};

const client = new CopilotClient();
const session = await client.createSession({
    mcpServers,  // 註冊 MCP Servers
});

await session.sendAndWait({
    prompt: "List the open pull requests in my repository"
});
```

### Python

```python
from copilot import CopilotClient
from copilot.types import MCPServerConfig

async def main():
    client = CopilotClient()
    await client.start()

    # 設定 MCP Servers
    mcp_servers: dict[str, MCPServerConfig] = {
        "github-server": {
            "type": "local",
            "command": "npx",
            "args": ["-y", "@modelcontextprotocol/server-github"],
            "tools": ["*"],
        },
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

    await session.send_and_wait({
        "prompt": "Read the README.md file"
    })

    await client.stop()
```

---

## 🤖 自定義 Agent

建立客製化 AI 助手：

### Node.js

```typescript
import { CopilotClient, CustomAgentConfig, MCPLocalServerConfig } from "@github/copilot-sdk";

// 定義自定義 Agent
const customAgents: CustomAgentConfig[] = [
    {
        name: "code-reviewer",
        displayName: "Code Reviewer",
        description: "專業程式碼審查助手",
        prompt: `你是一個專業的程式碼審查員。
你的職責是：
1. 檢查程式碼品質
2. 找出潛在的 Bug
3. 建議最佳實踐
4. 確保程式碼風格一致`,
        tools: ["read_file", "search_code"],  // 限定可用工具
        infer: true,
    },
    {
        name: "blog-writer",
        displayName: "Blog Writer",
        description: "Cyberpunk 風格部落格寫手",
        prompt: `你是 BlogSys 的專業寫手。
寫作風格：
- 使用 Cyberpunk 術語
- 加入科技感的比喻
- 保持簡潔有力的文風`,
    }
];

const client = new CopilotClient();
const session = await client.createSession({
    customAgents,
});

// 可以用 @agent 語法呼叫特定 Agent
await session.sendAndWait({
    prompt: "@code-reviewer Please review this function for bugs"
});
```

---

## 📊 Session 管理

### 恢復 Session

```typescript
// 儲存 Session ID
const sessionId = session.sessionId;

// 之後恢復
const resumedSession = await client.resumeSession(sessionId);
```

### 列出所有 Session

```typescript
const sessions = await client.listSessions();
sessions.forEach(s => {
    console.log(`Session: ${s.sessionId}, Created: ${s.createdAt}`);
});
```

---

## 📖 事件類型

| 事件類型 | 說明 |
|----------|------|
| `assistant.message` | 完整助手回應 |
| `assistant.message_delta` | 串流回應片段 |
| `assistant.reasoning_delta` | 推理過程（思考鏈） |
| `tool.execution_start` | 工具開始執行 |
| `tool.execution_complete` | 工具執行完成 |
| `session.idle` | Session 閒置（回應完成） |
| `error` | 錯誤事件 |

---

## ⚠️ 錯誤處理

```typescript
import { CopilotClient } from "@github/copilot-sdk";

const client = new CopilotClient();

try {
    await client.start();
    const session = await client.createSession();
    
    const response = await session.sendAndWait({ prompt: "Hello" });
    
    if (response?.data.content) {
        console.log(response.data.content);
    }
} catch (error) {
    console.error("Error:", error.message);
} finally {
    await client.stop();
}
```

---

## 🔗 相關資源

- **官方 GitHub**: https://github.com/github/copilot-sdk
- **Getting Started 文件**: https://github.com/github/copilot-sdk/blob/main/docs/getting-started.md
- **Cookbook 食譜**: https://github.com/github/copilot-sdk/tree/main/cookbook

---

*最後更新: 2026-01-23*
