import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GeminiAPIKey,
});

// 分析整篇文章，找出適合插入圖片的段落位置
const ARTICLE_ANALYSIS_PROMPT = `你是一位專業的視覺編輯師，專精於為文章配置適當的視覺輔助圖片。

## 🎯 任務目標
分析用戶提供的「完整文章」，找出 **最適合插入圖片的段落位置**，並為每個位置提供具體的圖片建議。

## 📋 分析原則
1. **不是每個段落都需要圖片** - 只挑選最能從視覺輔助中受益的段落
2. **圖片應有資訊價值** - 幫助讀者理解概念、流程、比較、數據等
3. **位置要合理** - 圖片應在相關文字的附近，通常在段落之後
4. **數量適中** - 一篇文章通常 2-4 張圖片就足夠

## 📝 請以 JSON 格式回應：

\`\`\`json
{
  "articleTitle": "文章標題（從內容推斷）",
  "totalParagraphs": 5,
  "imagePlacements": [
    {
      "paragraphIndex": 1,
      "paragraphPreview": "該段落的前 50 字...",
      "reason": "為什麼這個段落需要圖片",
      "imageType": "概念圖 | 流程圖 | 資訊圖表 | 示意圖 | 場景插圖",
      "promptSuggestions": [
        {
          "style": "風格名稱",
          "description": "這張圖要視覺化什麼",
          "prompt": "English prompt for image generation, 50-100 words, describing specific visual elements, composition, style, and color palette"
        },
        {
          "style": "風格名稱2",
          "description": "替代方案",
          "prompt": "Alternative English prompt..."
        }
      ]
    }
  ],
  "coverImageSuggestion": {
    "description": "封面圖建議",
    "prompt": "Cover image prompt..."
  }
}
\`\`\`

## ⚠️ 重要提醒
- paragraphIndex 從 0 開始計算
- 每個 imagePlacements 項目代表一個需要圖片的段落
- promptSuggestions 提供 2-3 個不同風格的選項
- 確保 JSON 格式正確，可以被解析

請只回傳 JSON，不要有其他說明文字。`;

export async function POST(req) {
  try {
    const { cards } = await req.json();

    if (!cards || cards.length === 0) {
      return new Response(
        JSON.stringify({ error: '請提供文章內容' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 將卡片內容組合成文章，並標記段落索引
    const articleContent = cards.map((card, idx) => 
      `[段落 ${idx}]\n${card.content}`
    ).join('\n\n---\n\n');

    const result = await generateText({
      model: google('gemini-2.0-flash-exp'),
      system: ARTICLE_ANALYSIS_PROMPT,
      prompt: articleContent,
    });

    // 嘗試解析 JSON
    let analysis;
    try {
      // 移除可能的 markdown code block
      const jsonStr = result.text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      analysis = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.log('Raw response:', result.text);
      return new Response(
        JSON.stringify({ 
          error: '分析結果解析失敗',
          rawText: result.text 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        analysis 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Analyze Article API Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || '分析失敗' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
