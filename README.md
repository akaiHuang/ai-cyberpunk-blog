# AI Cyberpunk Blog

**Generative AI-Powered CMS -- Where Content Creation Meets Cyberpunk Aesthetics**

---

## Why This Exists

Most blog platforms treat content creation and content management as two separate worlds. You write in one tool, design in another, and manage in a third. The creative process is fragmented.

AI Cyberpunk Blog merges them into a single immersive experience. It is a content management system where Gemini AI acts as a co-creator -- not just a chatbot, but a genuine editorial partner named BotLog AI that guides ideation, drafts structured content, analyzes images, generates visuals, and assembles finished articles. All wrapped in a cyberpunk-themed interface that makes the act of creation itself feel engaging.

The system features a full AI-assisted editorial workflow: from brainstorming through an interactive chat interface, to pinning ideas onto a creative canvas, to AI-powered image analysis and generation, to one-click article assembly and publishing.

---

## Architecture

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

### AI-Powered Features

| Feature | API Endpoint | Description |
|---------|-------------|-------------|
| **BotLog AI Chat** | `/api/chat` | Streaming conversational AI with editorial expertise -- guides ideation, structures content, provides SEO optimization |
| **Article Analysis** | `/api/analyze-article` | Analyzes full articles to identify optimal image placement positions with specific visual suggestions |
| **Image Analysis** | `/api/analyze-image` | Vision-powered analysis of uploaded reference images for composition, style, and prompt extraction |
| **Style Analysis** | `/api/analyze-style` | Evaluates visual style and generates matching prompts |
| **Image Generation** | `/api/generate-image` | Text-to-image and image-to-image generation pipeline |

### Blog Categories

The blog organizes content across five thematic verticals:

- **Wishlist** -- AI mockups and brand renewal concepts
- **Our Sense** -- Curated design inspiration and aesthetic commentary
- **AI Marketing Lab** -- Gemini experiments, enterprise AI adoption, generative marketing
- **Game Labs** -- Interactive experiences, gamification, and WebSocket experiments
- **OPS Labs** -- Physical experiments with scent branding, eco materials, and 3D printing

---

## Tech Stack

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

## Quick Start

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

### Available Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run test         # Run Playwright E2E tests
npm run test:ui      # Playwright test runner with UI
npm run test:headed  # Run tests in headed browser
npm run health-check # Full system health check
```

---

## Author

**Huang Akai (Kai)** -- Founder @ Universal FAW Labs | Creative Technologist | Ex-Ogilvy | 15+ years in digital creative and marketing technology.
