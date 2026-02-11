# AI Cyberpunk Blog

**Generative AI-Powered CMS -- Where Content Creation Meets Cyberpunk Aesthetics**

## About

AI Cyberpunk Blog 是一套結合生成式 AI 與賽博龐克視覺風格的內容管理系統（CMS），把寫作、改寫、排版與發布整合在同一個介面。適合需要快速產出並維持風格一致性的創作者或內容團隊，用於打造具有強烈視覺辨識度的部落格/媒體站。

## About (EN)

AI Cyberpunk Blog is a generative-AI content management system that combines writing automation with a cyberpunk visual identity. It helps creators and editorial teams produce, refine, and publish stylized content from a single workflow.

## 📋 Quick Summary

> 🌆 **AI Cyberpunk Blog** 是一套融合生成式 AI 與賽博龐克美學的智慧內容管理系統。系統核心是名為 🤖 BotLog AI 的 AI 編輯夥伴，由 Google Gemini 2.0 Flash 驅動，透過 💬 串流對話介面引導創意發想、結構化內容撰寫、SEO 優化建議，並提供 🖼️ AI 圖片分析與生成能力。從腦力激盪到釘選靈感到創意畫布 📌，從 AI 圖像風格分析到一鍵組裝成完整文章 📝，實現全 AI 輔助的編輯工作流程。技術架構採用 ⚡ Next.js 16 + React 19，整合 Vercel AI SDK v6 串接 Gemini，後端使用 🔥 Firebase 全家桶（Auth + Firestore + Storage），前端以 🎭 Framer Motion 打造沉浸式賽博龐克主題動畫介面。內容涵蓋五大主題垂直領域：Wishlist、Our Sense、AI Marketing Lab、Game Labs、OPS Labs 🧪，並配備 🧪 Playwright 端到端測試確保系統穩定。適合追求創作體驗與效率並重的內容創作者 🚀。

---

## 🤔 Why This Exists

Most blog platforms treat content creation and content management as two separate worlds. You write in one tool, design in another, and manage in a third. The creative process is fragmented.

AI Cyberpunk Blog merges them into a single immersive experience. It is a content management system where Gemini AI acts as a co-creator -- not just a chatbot, but a genuine editorial partner named BotLog AI that guides ideation, drafts structured content, analyzes images, generates visuals, and assembles finished articles. All wrapped in a cyberpunk-themed interface that makes the act of creation itself feel engaging.

The system features a full AI-assisted editorial workflow: from brainstorming through an interactive chat interface, to pinning ideas onto a creative canvas, to AI-powered image analysis and generation, to one-click article assembly and publishing.

---

## 🏗️ Architecture

```
+-----------------------------------------------+
|          AI Cyberpunk Blog (Next.js 16)        |
|                                                |
|  +------------------+  +-------------------+   |
|  |   Public Blog    |  |   Admin Panel     |   |
|  |  /blog           |  |  /admin/blog      |   |
|  |  /blog/[id]      |  |  /admin/blog/     |   |
|  |  Cyberpunk UI    |  |    ai-editor      |   |
|  +------------------+  +-------------------+   |
|                              |                  |
|              +---------------+----------------+ |
|              |       AI API Layer             | |
|              |                                | |
|              |  /api/chat        (BotLog AI)  | |
|              |  /api/analyze-article          | |
|              |  /api/analyze-image            | |
|              |  /api/analyze-style            | |
|              |  /api/generate-image           | |
|              +---------------+----------------+ |
|                              |                  |
+------------------------------+------------------+
                               |
                    +----------+----------+
                    |   Google Gemini AI   |
                    |  (gemini-2.0-flash)  |
                    +---------------------+
                               |
                    +----------+----------+
                    |     Firebase         |
                    |  (Auth + Storage)    |
                    +---------------------+
```

### 🤖 AI-Powered Features

| Feature | API Endpoint | Description |
|---------|-------------|-------------|
| **BotLog AI Chat** | `/api/chat` | Streaming conversational AI with editorial expertise -- guides ideation, structures content, provides SEO optimization |
| **Article Analysis** | `/api/analyze-article` | Analyzes full articles to identify optimal image placement positions with specific visual suggestions |
| **Image Analysis** | `/api/analyze-image` | Vision-powered analysis of uploaded reference images for composition, style, and prompt extraction |
| **Style Analysis** | `/api/analyze-style` | Evaluates visual style and generates matching prompts |
| **Image Generation** | `/api/generate-image` | Text-to-image and image-to-image generation pipeline |

### 📂 Blog Categories

The blog organizes content across five thematic verticals:

- **Wishlist** -- AI mockups and brand renewal concepts
- **Our Sense** -- Curated design inspiration and aesthetic commentary
- **AI Marketing Lab** -- Gemini experiments, enterprise AI adoption, generative marketing
- **Game Labs** -- Interactive experiences, gamification, and WebSocket experiments
- **OPS Labs** -- Physical experiments with scent branding, eco materials, and 3D printing

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Runtime | React 19 |
| AI Engine | Google Gemini 2.0 Flash (via Vercel AI SDK v6) |
| AI Integration | `@ai-sdk/google`, `@ai-sdk/react`, `ai` |
| Backend | Firebase (Auth, Firestore, Storage) |
| UI | Tailwind CSS, Framer Motion, Lucide Icons |
| Content | React Markdown, Cyberpunk-themed components |
| Testing | Playwright (E2E + component tests) |
| Health Checks | Custom health-check scripts |

---

## 🏁 Quick Start

```bash
# Clone and install
git clone <repo-url>
cd ai-cyberpunk-blog
npm install

# Configure environment
cp .env.local.example .env.local
# Fill in: GeminiAPIKey, Firebase config

# Run development server
npm run dev
```

### ⚙️ Available Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run test         # Run Playwright E2E tests
npm run test:ui      # Playwright test runner with UI
npm run test:headed  # Run tests in headed browser
npm run health-check # Full system health check
```

---

## 👤 Author

**Huang Akai (Kai)** -- Founder @ Universal FAW Labs | Creative Technologist | Ex-Ogilvy | 15+ years in digital creative and marketing technology.
