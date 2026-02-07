/**
 * Blog 文章資料
 * 可改接 Firebase、Supabase、或其他資料庫
 */

export const BLOG_CATEGORIES = [
  {
    id: 'wishlist',
    title: '許願池',
    subtitle: 'WISHLIST',
    description: '找一些產品用 AI 做 mockup，或幫企業做 renew',
    color: '#FFD700',
  },
  {
    id: 'sense',
    title: '我們的 Sense',
    subtitle: 'OUR SENSE',
    description: '分類放上我喜歡的設計，文字說明喜歡什麼地方',
    color: '#FF004D',
  },
  {
    id: 'ai-lab',
    title: 'AI 行銷研究室',
    subtitle: 'AI MARKETING LAB',
    description: 'Gemini 邪修、AI 企業導入、生成式行銷',
    color: '#00FF99',
  },
  {
    id: 'game-labs',
    title: 'Game Labs',
    subtitle: 'INTERACTIVE PLAYGROUND',
    description: '活動網站互動分享、遊戲化行銷案例',
    color: '#00BFFF',
  },
  {
    id: 'ops-labs',
    title: 'OPS Labs',
    subtitle: 'PHYSICAL EXPERIMENTS',
    description: '香味、環保材料、3D 光固化材料研究',
    color: '#FF6B00',
  },
];

export const BLOG_ARTICLES = [
  // 許願池
  {
    id: 'wishlist-1',
    categoryId: 'wishlist',
    title: '如果 7-11 變成 Apple Store',
    image: '/blog/demo_1.png',
    date: '2024.12.28',
    tags: ['AI Mockup', 'Retail'],
    excerpt: '想像一下，如果台灣最密集的便利商店 7-11 採用 Apple Store 的設計語言會是什麼樣子？',
    content: `
# 如果 7-11 變成 Apple Store

想像一下，如果台灣最密集的便利商店 7-11 採用 Apple Store 的設計語言會是什麼樣子？

## 設計概念

我們使用 AI 生成工具，重新想像了 7-11 的空間設計：

- **極簡主義**：移除繁雜的視覺元素
- **大量留白**：讓產品本身成為焦點
- **原木與玻璃**：營造高端質感

## 結果展示

透過 Midjourney 和 Stable Diffusion，我們產出了多個版本的概念圖...

## 思考

這個實驗讓我們思考：零售空間的設計如何影響消費者的購買體驗？
    `,
    published: true,
    createdAt: '2024-12-28T10:00:00Z',
    updatedAt: '2024-12-28T10:00:00Z',
  },
  {
    id: 'wishlist-2',
    categoryId: 'wishlist',
    title: '傳統菜市場的數位轉型想像',
    image: '/blog/demo_2.png',
    date: '2024.12.15',
    tags: ['Concept', 'UI/UX'],
    excerpt: '如果傳統市場也有 App，買菜也能像點外送一樣方便？',
    content: `
# 傳統菜市場的數位轉型想像

傳統市場是台灣最有溫度的購物場所，但在數位時代，它能如何進化？

## 痛點分析

1. 不知道攤販營業時間
2. 無法預訂商品
3. 找不到特定攤位

## 解決方案構想

我們設計了一個「市場 App」的概念原型...
    `,
    published: true,
    createdAt: '2024-12-15T10:00:00Z',
    updatedAt: '2024-12-15T10:00:00Z',
  },
  {
    id: 'wishlist-3',
    categoryId: 'wishlist',
    title: '台鐵便當盒重新設計',
    image: '/blog/demo_3.png',
    date: '2024.12.01',
    tags: ['Package', 'Branding'],
    excerpt: '經典的台鐵便當盒，如果重新設計會是什麼模樣？',
    content: `
# 台鐵便當盒重新設計

台鐵便當是台灣人共同的記憶，但便當盒的設計已經很久沒有更新了...
    `,
    published: true,
    createdAt: '2024-12-01T10:00:00Z',
    updatedAt: '2024-12-01T10:00:00Z',
  },
  // 我們的 Sense
  {
    id: 'sense-1',
    categoryId: 'sense',
    title: '極簡主義中的溫度',
    image: '/blog/demo_4.png',
    date: '2024.12.25',
    tags: ['Minimalism', 'Inspiration'],
    excerpt: '探索如何在極簡設計中保留人性的溫暖。',
    content: `
# 極簡主義中的溫度

極簡不等於冷漠。好的極簡設計應該要讓人感到舒適...
    `,
    published: true,
    createdAt: '2024-12-25T10:00:00Z',
    updatedAt: '2024-12-25T10:00:00Z',
  },
  {
    id: 'sense-2',
    categoryId: 'sense',
    title: '賽博龐克視覺的藝術性',
    image: '/blog/demo_5.png',
    date: '2024.12.18',
    tags: ['Cyberpunk', 'Visual'],
    excerpt: '霓虹燈、雨夜、高科技低生活——賽博龐克美學的魅力何在？',
    content: `
# 賽博龐克視覺的藝術性

從 Blade Runner 到 Cyberpunk 2077，賽博龐克美學持續影響著設計界...
    `,
    published: true,
    createdAt: '2024-12-18T10:00:00Z',
    updatedAt: '2024-12-18T10:00:00Z',
  },
  {
    id: 'sense-3',
    categoryId: 'sense',
    title: '日本包裝設計的細節美學',
    image: '/blog/demo_6.png',
    date: '2024.12.10',
    tags: ['Japan', 'Package'],
    excerpt: '從一個小小的包裝盒，看見日本設計的極致追求。',
    content: `
# 日本包裝設計的細節美學

日本的包裝設計總是讓人驚艷，每一個細節都經過深思熟慮...
    `,
    published: true,
    createdAt: '2024-12-10T10:00:00Z',
    updatedAt: '2024-12-10T10:00:00Z',
  },
  // AI 行銷研究室
  {
    id: 'ai-1',
    categoryId: 'ai-lab',
    title: 'Gemini 2.0 行銷文案實戰',
    image: '/blog/demo_7.png',
    date: '2024.12.30',
    tags: ['Gemini', 'Copywriting'],
    excerpt: '實測 Gemini 2.0 在行銷文案生成的能力，以及最佳 Prompt 技巧。',
    content: `
# Gemini 2.0 行銷文案實戰

Google 最新的 Gemini 2.0 在文案生成上有了長足的進步...
    `,
    published: true,
    createdAt: '2024-12-30T10:00:00Z',
    updatedAt: '2024-12-30T10:00:00Z',
  },
  {
    id: 'ai-2',
    categoryId: 'ai-lab',
    title: '中小企業 AI 導入指南',
    image: '/blog/demo_8.png',
    date: '2024.12.20',
    tags: ['Enterprise', 'Strategy'],
    excerpt: '不需要龐大預算，中小企業也能開始使用 AI 提升效率。',
    content: `
# 中小企業 AI 導入指南

AI 不再是大企業的專利，這是一份給中小企業的實用指南...
    `,
    published: true,
    createdAt: '2024-12-20T10:00:00Z',
    updatedAt: '2024-12-20T10:00:00Z',
  },
  {
    id: 'ai-3',
    categoryId: 'ai-lab',
    title: 'AI 生成圖像的商業應用',
    image: '/blog/demo_1.png',
    date: '2024.12.08',
    tags: ['Image Gen', 'Commerce'],
    excerpt: '從產品圖到廣告素材，AI 生成圖像如何改變行銷產業。',
    content: `
# AI 生成圖像的商業應用

AI 生成圖像已經從實驗性質走向商業應用...
    `,
    published: true,
    createdAt: '2024-12-08T10:00:00Z',
    updatedAt: '2024-12-08T10:00:00Z',
  },
  // Game Labs
  {
    id: 'game-1',
    categoryId: 'game-labs',
    title: '雙機連動彈珠台開發日記',
    image: '/blog/demo_2.png',
    date: '2024.12.27',
    tags: ['WebSocket', 'Game'],
    excerpt: '用 WebSocket 打造手機控制大螢幕的互動彈珠台。',
    content: `
# 雙機連動彈珠台開發日記

這是一個實驗性專案，目標是讓手機變成遊戲控制器...
    `,
    published: true,
    createdAt: '2024-12-27T10:00:00Z',
    updatedAt: '2024-12-27T10:00:00Z',
  },
  {
    id: 'game-2',
    categoryId: 'game-labs',
    title: 'AR 濾鏡行銷活動全記錄',
    image: '/blog/demo_3.png',
    date: '2024.12.14',
    tags: ['AR', 'Campaign'],
    excerpt: '為品牌打造 AR 濾鏡，從發想到上線的完整流程。',
    content: `
# AR 濾鏡行銷活動全記錄

AR 濾鏡是社群行銷的利器，這是我們的製作經驗分享...
    `,
    published: true,
    createdAt: '2024-12-14T10:00:00Z',
    updatedAt: '2024-12-14T10:00:00Z',
  },
  {
    id: 'game-3',
    categoryId: 'game-labs',
    title: '抽獎輪盤的 UX 設計心得',
    image: '/blog/demo_4.png',
    date: '2024.12.05',
    tags: ['UX', 'Gamification'],
    excerpt: '看似簡單的抽獎輪盤，其實有很多 UX 細節需要注意。',
    content: `
# 抽獎輪盤的 UX 設計心得

抽獎輪盤是行銷活動的常見元素，但要做好並不容易...
    `,
    published: true,
    createdAt: '2024-12-05T10:00:00Z',
    updatedAt: '2024-12-05T10:00:00Z',
  },
  // OPS Labs
  {
    id: 'ops-1',
    categoryId: 'ops-labs',
    title: '品牌香味識別系統設計',
    image: '/blog/demo_5.png',
    date: '2024.12.22',
    tags: ['Scent', 'Branding'],
    excerpt: '除了視覺，香味也能成為品牌識別的一部分。',
    content: `
# 品牌香味識別系統設計

五感行銷中，嗅覺是最容易被忽略但最有影響力的感官...
    `,
    published: true,
    createdAt: '2024-12-22T10:00:00Z',
    updatedAt: '2024-12-22T10:00:00Z',
  },
  {
    id: 'ops-2',
    categoryId: 'ops-labs',
    title: '環保材料在行銷物的應用',
    image: '/blog/demo_6.png',
    date: '2024.12.12',
    tags: ['Eco', 'Materials'],
    excerpt: '永續不只是口號，從材料選擇開始實踐環保理念。',
    content: `
# 環保材料在行銷物的應用

越來越多品牌開始重視永續發展，行銷物料也需要跟上...
    `,
    published: true,
    createdAt: '2024-12-12T10:00:00Z',
    updatedAt: '2024-12-12T10:00:00Z',
  },
  {
    id: 'ops-3',
    categoryId: 'ops-labs',
    title: '3D 列印展示架製作流程',
    image: '/blog/demo_7.png',
    date: '2024.12.02',
    tags: ['3D Print', 'Display'],
    excerpt: '從設計到成品，3D 列印展示架的完整製作流程。',
    content: `
# 3D 列印展示架製作流程

3D 列印讓小量客製化成為可能，這是我們的實作經驗...
    `,
    published: true,
    createdAt: '2024-12-02T10:00:00Z',
    updatedAt: '2024-12-02T10:00:00Z',
  },
];

// ========== Helper Functions ==========

/**
 * 根據分類取得文章
 */
export const getArticlesByCategory = (categoryId) => {
  const articles = getStoredArticles();
  return articles.filter(article => article.categoryId === categoryId && isArticlePublished(article));
};

/**
 * 根據 ID 取得單一文章
 */
export const getArticleById = (id) => {
  const articles = getStoredArticles();
  return articles.find(article => article.id === id);
};

/**
 * 根據 ID 取得分類資訊
 */
export const getCategoryById = (id) => {
  return BLOG_CATEGORIES.find(cat => cat.id === id);
};

/**
 * 取得所有已發布文章
 */
export const getAllPublishedArticles = () => {
  return BLOG_ARTICLES.filter(article => isArticlePublished(article));
};

/**
 * 從 localStorage 讀取文章（支援 Admin 編輯後的資料）
 */
export const getStoredArticles = () => {
  if (typeof window === 'undefined') return BLOG_ARTICLES;
  
  try {
    const stored = localStorage.getItem('blogsys_articles');
    if (stored) {
      const parsedArticles = JSON.parse(stored);
      if (parsedArticles && parsedArticles.length > 0) {
        return parsedArticles;
      }
    }
  } catch (e) {
    console.error('Error reading stored articles:', e);
  }
  return BLOG_ARTICLES;
};

/**
 * 檢查文章是否已發布
 * 支援兩種格式：舊的 published: true 和新的 status: 'published'
 */
export const isArticlePublished = (article) => {
  if (article.published !== undefined) {
    return article.published === true;
  }
  return article.status === 'published';
};
