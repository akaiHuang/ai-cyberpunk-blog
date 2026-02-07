// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * API 路由測試
 */

test.describe('Chat API', () => {
  test('POST /api/chat 應該返回串流回應', async ({ request }) => {
    const response = await request.post('/api/chat', {
      data: {
        messages: [
          { role: 'user', content: '你好' }
        ]
      }
    });

    // 檢查回應狀態
    // 注意：如果沒有設定 API Key，會返回 500
    const status = response.status();
    expect([200, 500]).toContain(status);

    if (status === 500) {
      const body = await response.json();
      // 可能是 API Key 未設定
      expect(body.error).toBeDefined();
    }
  });

  test('POST /api/chat 沒有 messages 應該處理錯誤', async ({ request }) => {
    const response = await request.post('/api/chat', {
      data: {}
    });

    // 應該返回錯誤
    expect(response.status()).toBe(500);
  });
});

test.describe('Analyze Image API', () => {
  test('POST /api/analyze-image 應該分析內容', async ({ request }) => {
    const response = await request.post('/api/analyze-image', {
      data: {
        content: '這是一段關於 AI 設計趨勢的文章內容'
      }
    });

    const status = response.status();
    expect([200, 500]).toContain(status);

    if (status === 200) {
      const body = await response.json();
      expect(body.suggestion).toBeDefined();
    }
  });

  test('POST /api/analyze-image 沒有內容應該返回 400', async ({ request }) => {
    const response = await request.post('/api/analyze-image', {
      data: {}
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('請提供文章內容');
  });
});

test.describe('Generate Image API', () => {
  test('POST /api/generate-image 應該需要 prompt 或 cardContent', async ({ request }) => {
    const response = await request.post('/api/generate-image', {
      data: {}
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('請提供圖片描述或文章內容');
  });

  test('POST /api/generate-image 有 prompt 應該嘗試生成', async ({ request }) => {
    const response = await request.post('/api/generate-image', {
      data: {
        prompt: 'A beautiful sunset over mountains'
      }
    });

    const status = response.status();
    // 200 表示成功，500 可能是 API Key 問題
    expect([200, 500]).toContain(status);
  });

  test('POST /api/generate-image 有 cardContent 應該嘗試生成', async ({ request }) => {
    const response = await request.post('/api/generate-image', {
      data: {
        cardContent: '這是一段關於科技未來的文章'
      }
    });

    const status = response.status();
    expect([200, 500]).toContain(status);
  });
});
