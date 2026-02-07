import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GeminiAPIKey,
});

// 根據風格生成系統 Prompt
const getSystemPrompt = (style) => `你是一位專業的視覺故事設計師。

## 🎯 任務目標
分析用戶提供的段落文字，將其拆分成多個「場景」或「畫面」，為每個場景建議一張配圖。

## 🎨 指定風格：${style}
所有圖片 prompt 必須統一使用「${style}」風格，確保整體視覺一致性。

## 📋 分析原則
1. **按句子或語意單位拆分** - 每個獨立的場景、動作、描述都可以是一個畫面
2. **保留原文** - 記錄每個場景對應的原始文字
3. **風格統一** - 所有 prompt 必須使用相同的藝術風格
4. **圖片要具體** - Prompt 要描述具體的視覺元素

## 📝 請以 JSON 格式回應：

\`\`\`json
{
  "coverImage": {
    "description": "封面圖描述（中文）",
    "prompt": "English prompt for cover image, representing the whole story, 50-80 words"
  },
  "scenes": [
    {
      "sceneIndex": 0,
      "originalText": "場景對應的原始文字（保持原文）",
      "sceneDescription": "這個場景在描述什麼",
      "prompt": "English prompt for this scene, 50-80 words, must use ${style} style"
    }
  ]
}
\`\`\`

## 範例
輸入（風格：童話插畫）：「經過一個木屋。木屋裡面有張桌子看起來是廚房。老鼠找了門進去，發現一個獵人在睡覺。」

輸出：
\`\`\`json
{
  "coverImage": {
    "description": "一隻小老鼠站在森林木屋前的故事封面",
    "prompt": "A small mouse standing in front of a cozy wooden cabin in an enchanted forest, storybook cover illustration, fairy tale style, magical atmosphere, warm golden lighting, detailed textures, whimsical"
  },
  "scenes": [
    {
      "sceneIndex": 0,
      "originalText": "經過一個木屋。",
      "sceneDescription": "外觀場景：一間木屋的外觀",
      "prompt": "A cozy wooden cabin in a forest clearing, warm sunset lighting, smoke rising from chimney, fairy tale illustration style, soft colors, detailed textures, storybook art"
    },
    {
      "sceneIndex": 1,
      "originalText": "木屋裡面有張桌子看起來是廚房。",
      "sceneDescription": "室內場景：木屋廚房內部",
      "prompt": "Interior of a rustic wooden cabin kitchen, wooden table in center, pots and pans hanging, warm candlelight, cozy atmosphere, fairy tale illustration style, storybook art"
    },
    {
      "sceneIndex": 2,
      "originalText": "老鼠找了門進去，發現一個獵人在睡覺。",
      "sceneDescription": "動作場景：老鼠發現睡覺的獵人",
      "prompt": "A small mouse peeking through a doorway, seeing a hunter sleeping in a chair, dramatic lighting from window, fairy tale illustration style, suspenseful mood, storybook art"
    }
  ]
}
\`\`\`

## ⚠️ 重要提醒
- 每個 scene 的 originalText 必須是原文的一部分
- 所有 originalText 組合起來應該等於完整原文
- 所有 prompt 必須包含「${style}」風格關鍵字
- 必須包含 coverImage 封面圖建議
- 請只回傳 JSON，不要有其他說明文字`;

export async function POST(req) {
  try {
    const { content, style = '童話插畫' } = await req.json();

    if (!content) {
      return new Response(
        JSON.stringify({ error: '請提供文章內容' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await generateText({
      model: google('gemini-2.0-flash-exp'),
      system: getSystemPrompt(style),
      prompt: content,
    });

    // 嘗試解析 JSON
    let analysis;
    try {
      const jsonStr = result.text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      analysis = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      // 回退到舊格式
      return new Response(
        JSON.stringify({ suggestion: result.text }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        scenes: analysis.scenes || [],
        coverImage: analysis.coverImage || null,
        suggestion: result.text 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Analyze Image API Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || '分析失敗' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
