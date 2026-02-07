import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GeminiAPIKey,
});

// 文風分析 Prompt
const WRITING_STYLE_PROMPT = `你是一位專業的文字風格分析師。請分析以下文章的寫作風格，並提供詳細的風格特徵描述。

## 分析要點
1. **語氣特徵**: 正式/輕鬆、專業/親切、幽默/嚴肅
2. **句式結構**: 長短句比例、段落節奏、轉折方式
3. **用詞習慣**: 專業術語、口語化程度、修辭手法
4. **敘事視角**: 第一人稱/第三人稱、主觀/客觀
5. **內容結構**: 開場方式、論述邏輯、結尾風格
6. **獨特特色**: 這個作者的獨特寫作習慣

## 輸出格式
請以 JSON 格式輸出：
{
  "summary": "一句話概括這個寫作風格",
  "tone": "語氣特徵描述",
  "structure": "結構特徵描述",
  "vocabulary": "用詞特徵描述",
  "uniqueTraits": ["特色1", "特色2", "特色3"],
  "promptForAI": "如果要讓 AI 模仿這種風格，應該給的 prompt 指令"
}`;

// 視覺風格分析 Prompt
const VISUAL_STYLE_PROMPT = `你是一位專業的視覺風格分析師。請分析這張圖片的視覺風格，並提供詳細的風格特徵描述。

## 分析要點
1. **色彩調性**: 主色調、對比度、飽和度、色溫
2. **構圖特點**: 對稱/不對稱、留白比例、視覺動線
3. **光影效果**: 光源方向、陰影處理、明暗對比
4. **風格類型**: 寫實/抽象、扁平化/立體、現代/復古
5. **質感特徵**: 平滑/粗糙、光澤/霧面、數位/手繪感
6. **情緒氛圍**: 這張圖傳達的整體感覺

## 輸出格式
請以 JSON 格式輸出：
{
  "summary": "一句話概括這個視覺風格",
  "colors": "色彩描述",
  "composition": "構圖描述",
  "lighting": "光影描述",
  "styleType": "風格類型",
  "texture": "質感描述",
  "mood": "情緒氛圍",
  "promptForAI": "如果要讓 AI 生成類似風格的圖片，應該給的 prompt 指令（英文）"
}`;

export async function POST(req) {
  try {
    const { content, type, imageBase64 } = await req.json();

    if (!type || (type !== 'writing' && type !== 'visual')) {
      return new Response(
        JSON.stringify({ error: '請指定分析類型 (writing / visual)' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let result;

    if (type === 'writing') {
      if (!content) {
        return new Response(
          JSON.stringify({ error: '請提供文章內容' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      result = await generateText({
        model: google('gemini-2.0-flash-exp'),
        system: WRITING_STYLE_PROMPT,
        prompt: content,
      });
    } else {
      // 視覺風格分析
      if (!imageBase64) {
        return new Response(
          JSON.stringify({ error: '請提供圖片' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // 處理 base64 圖片
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

      result = await generateText({
        model: google('gemini-2.0-flash-exp'),
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: VISUAL_STYLE_PROMPT },
              {
                type: 'image',
                image: base64Data,
              },
            ],
          },
        ],
      });
    }

    // 嘗試解析 JSON
    let analysis;
    try {
      // 移除可能的 markdown code block
      const jsonStr = result.text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      analysis = JSON.parse(jsonStr);
    } catch {
      // 如果解析失敗，返回原始文字
      analysis = {
        summary: result.text.substring(0, 100),
        rawAnalysis: result.text,
        promptForAI: result.text,
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        type,
        analysis,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Analyze Style API Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || '分析失敗' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
