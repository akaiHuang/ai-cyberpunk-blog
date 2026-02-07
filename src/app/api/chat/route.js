import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

// 建立 Google Gemini 客戶端
const google = createGoogleGenerativeAI({
  apiKey: process.env.GeminiAPIKey,
});

// System Prompt - 定義 AI 角色
const SYSTEM_PROMPT = `你是 BotLog AI，一位專業的部落格內容創作夥伴。你具備以下特質：

## 角色定位
- 專業編輯：精通內容結構、標題撰寫、SEO 優化
- 創意總監：善於發想獨特觀點與創意切角
- 趨勢觀察家：熟悉科技、設計、Web3、AI 等領域

## 回應風格
- 使用繁體中文回應
- 結構化輸出：善用標題、條列、分段
- 提供可執行的具體建議
- 適時引導使用者深入思考

## 輸出格式
- 使用 Markdown 語法
- 重點用 **粗體** 標示
- 適當使用 emoji 增加可讀性
- 長文章提供目錄結構

## 互動原則
- 主動詢問需求細節
- 提供多個方案選擇
- 協助使用者聚焦主題
- 鼓勵原創觀點

請記住：你的目標是幫助使用者產出高品質的部落格文章。`;

// 轉換訊息格式以確保與 AI SDK v6 相容
function normalizeMessages(messages) {
  if (!Array.isArray(messages)) return [];

  return messages.map(msg => {
    // 如果已經是正確的 CoreMessage 格式
    if (typeof msg.content === 'string') {
      return {
        role: msg.role,
        content: msg.content,
      };
    }

    // 如果是 UI Message 格式 (有 parts 陣列)
    if (msg.parts && Array.isArray(msg.parts)) {
      const textContent = msg.parts
        .filter(part => part.type === 'text')
        .map(part => part.text)
        .join('');
      return {
        role: msg.role,
        content: textContent,
      };
    }

    // 預設回傳空字串
    return {
      role: msg.role,
      content: '',
    };
  }).filter(msg => msg.content.length > 0);
}

export async function POST(req) {
  try {
    const { messages } = await req.json();

    // 正規化訊息格式
    const normalizedMessages = normalizeMessages(messages);

    // 使用 Gemini Pro 模型
    const result = streamText({
      model: google('gemini-2.0-flash-exp'),
      system: SYSTEM_PROMPT,
      messages: normalizedMessages,
    });

    // 返回 UI Message 串流回應 (AI SDK v6)
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Chat API Error:', error);
    
    // 檢查是否為 API Key 問題
    if (!process.env.GeminiAPIKey) {
      return new Response(
        JSON.stringify({ error: '未設定 GeminiAPIKey 環境變數' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: error.message || '發生未知錯誤' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
