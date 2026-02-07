# BlogSys Copilot SDK 範例

此資料夾包含 GitHub Copilot SDK 在 BlogSys 專案中的使用範例。

## 📋 範例清單

| 檔案 | 說明 |
|------|------|
| [basic-example.ts](./basic-example.ts) | TypeScript 基本範例 |
| [basic_example.py](./basic_example.py) | Python 基本範例 |
| [multi-agent-factory.ts](./multi-agent-factory.ts) | 🏭 **多 Agent 協作系統 (TypeScript)** |
| [multi_agent_factory.py](./multi_agent_factory.py) | 🏭 **多 Agent 協作系統 (Python)** |

## 🏭 Multi-Agent 協作架構

```
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
```

### Agent 角色說明

| Agent | 職責 |
|-------|------|
| **Supervisor** | 分析需求、拆解任務、分配工作、監控進度 |
| **Worker Frontend** | 開發 React/Next.js 元件 |
| **Worker Backend** | 開發 API Route |
| **Worker Styling** | 設計 CSS/Tailwind 樣式 |
| **Tester** | 執行自動化測試、品質檢查 |

### 核心功能

- ✅ **並行開發**: 多個 Worker 同時執行任務
- ✅ **任務隊列**: 共享任務狀態管理
- ✅ **自動監工**: Supervisor 自動分配與監控
- ✅ **自動測試**: Tester 自動執行測試

## 🚀 執行方式

### TypeScript

```bash
cd examples/copilot-sdk
npm install
npx tsx multi-agent-factory.ts
```

### Python

```bash
pip install github-copilot-sdk pydantic
python multi_agent_factory.py
```

## 📖 基本範例內容

### 1. 基本對話
最簡單的 Copilot SDK 使用方式，發送單一訊息並接收回應。

### 2. 串流回應
即時接收 AI 生成的內容，適合需要即時顯示的場景。

### 3. 自定義工具
定義可被 Copilot 呼叫的自定義函式，如：
- `generate_blog_outline` - 生成文章大綱
- `fetch_blog_categories` - 取得部落格分類

### 4. MCP Server 整合
連接 Model Context Protocol 伺服器，擴展 AI 能力：
- 檔案系統存取
- GitHub 操作
- 瀏覽器自動化

### 5. BlogSys AI 助手
使用自定義 Agent 進行特定任務：
- `@blogsys-writer` - Cyberpunk 風格寫手
- `@code-reviewer` - 程式碼審查員

## 🔗 相關文件

- [Copilot SDK 使用指南](../../docs/COPILOT_SDK_GUIDE.md)
- [BlogSys Skill 定義](../../docs/COPILOT_SDK_SKILL.md)
- [官方 GitHub](https://github.com/github/copilot-sdk)
