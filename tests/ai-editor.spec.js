// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * AI Editor 頁面 E2E 測試
 */

test.describe('AI Editor 頁面', () => {
  // 登入前需要先設置 localStorage
  test.beforeEach(async ({ page }) => {
    // 模擬登入狀態
    await page.goto('/');
    await page.evaluate(() => {
      const token = btoa('bitlog-admin:' + Date.now());
      const expiry = Date.now() + 24 * 60 * 60 * 1000;
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_expiry', String(expiry));
    });
  });

  test('應該能夠載入 AI Editor 頁面', async ({ page }) => {
    await page.goto('/admin/blog/ai-editor');

    // 檢查頁面標題
    await expect(page.locator('text=BOTLOG_AI')).toBeVisible();

    // 檢查 Canvas Tool
    await expect(page.locator('text=CANVAS TOOL')).toBeVisible();
  });

  test('應該顯示歡迎訊息和建議', async ({ page }) => {
    await page.goto('/admin/blog/ai-editor');

    // 檢查歡迎訊息
    await expect(page.locator('text=我是你的 AI 創作夥伴')).toBeVisible();

    // 檢查建議選項
    await expect(page.locator('text=寫一篇關於 AI 設計趨勢的文章')).toBeVisible();
  });

  test('應該能夠新增空白卡片', async ({ page }) => {
    await page.goto('/admin/blog/ai-editor');

    // 點擊新增文字按鈕
    await page.click('text=ADD TEXT');

    // 檢查是否新增了卡片
    await expect(page.locator('text=1 cards')).toBeVisible();
  });

  test('應該能夠切換 Canvas 顯示/隱藏', async ({ page }) => {
    await page.goto('/admin/blog/ai-editor');

    // Canvas 應該預設顯示
    await expect(page.locator('text=CANVAS TOOL')).toBeVisible();

    // 點擊隱藏按鈕
    await page.click('text=HIDE CANVAS');

    // Canvas 應該隱藏
    await expect(page.locator('text=CANVAS TOOL')).not.toBeVisible();

    // 點擊顯示按鈕
    await page.click('text=SHOW CANVAS');

    // Canvas 應該再次顯示
    await expect(page.locator('text=CANVAS TOOL')).toBeVisible();
  });

  test('應該能夠打開 AI 紀錄面板', async ({ page }) => {
    await page.goto('/admin/blog/ai-editor');

    // 點擊 AI 紀錄按鈕
    await page.click('text=AI 紀錄');

    // 檢查歷史面板是否顯示
    await expect(page.locator('text=AI 對話紀錄')).toBeVisible();
    await expect(page.locator('text=開始新對話')).toBeVisible();
  });

  test('應該能夠編輯卡片', async ({ page }) => {
    await page.goto('/admin/blog/ai-editor');

    // 新增一張卡片
    await page.click('text=ADD TEXT');

    // 找到編輯按鈕並點擊 (第一個 Edit2 圖標)
    const editButton = page.locator('[title="Edit"]').first();
    await editButton.click();

    // 應該出現編輯區域
    await expect(page.locator('text=EDITING')).toBeVisible();
    await expect(page.locator('text=BACK')).toBeVisible();

    // 輸入內容
    await page.fill('textarea', '測試內容');

    // 儲存
    await page.click('text=SAVE');

    // 檢查內容是否顯示
    await expect(page.locator('text=測試內容')).toBeVisible();
  });

  test('應該能夠刪除卡片', async ({ page }) => {
    await page.goto('/admin/blog/ai-editor');

    // 新增一張卡片
    await page.click('text=ADD TEXT');
    await expect(page.locator('text=1 cards')).toBeVisible();

    // 點擊刪除按鈕
    const deleteButton = page.locator('[title="Delete"]').first();
    await deleteButton.click();

    // 檢查卡片數量
    await expect(page.locator('text=0 cards')).toBeVisible();
  });

  test('應該能夠複製卡片', async ({ page }) => {
    await page.goto('/admin/blog/ai-editor');

    // 新增一張卡片
    await page.click('text=ADD TEXT');
    await expect(page.locator('text=1 cards')).toBeVisible();

    // 點擊複製按鈕
    const duplicateButton = page.locator('[title="Duplicate"]').first();
    await duplicateButton.click();

    // 檢查卡片數量
    await expect(page.locator('text=2 cards')).toBeVisible();
  });

  test('應該能夠清除所有卡片', async ({ page }) => {
    await page.goto('/admin/blog/ai-editor');

    // 新增多張卡片
    await page.click('text=ADD TEXT');
    await page.click('text=ADD TEXT');
    await expect(page.locator('text=2 cards')).toBeVisible();

    // 點擊清除按鈕
    await page.click('text=CLEAR');

    // 檢查卡片數量
    await expect(page.locator('text=0 cards')).toBeVisible();
  });

  test('應該能夠返回 Admin 頁面', async ({ page }) => {
    await page.goto('/admin/blog/ai-editor');

    // 點擊返回按鈕
    await page.click('a:has-text("BACK")');

    // 應該導航到 admin/blog
    await expect(page).toHaveURL('/admin/blog');
  });
});

test.describe('AI Editor 輸入功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      const token = btoa('bitlog-admin:' + Date.now());
      const expiry = Date.now() + 24 * 60 * 60 * 1000;
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_expiry', String(expiry));
    });
  });

  test('應該能夠在輸入框輸入內容', async ({ page }) => {
    await page.goto('/admin/blog/ai-editor');

    const input = page.locator('input[placeholder="告訴我你想寫什麼..."]');
    await input.fill('這是一個測試訊息');

    await expect(input).toHaveValue('這是一個測試訊息');
  });

  test('點擊建議應該填入輸入框', async ({ page }) => {
    await page.goto('/admin/blog/ai-editor');

    // 點擊第一個建議
    await page.click('text=寫一篇關於 AI 設計趨勢的文章');

    const input = page.locator('input[placeholder="告訴我你想寫什麼..."]');
    await expect(input).toHaveValue('寫一篇關於 AI 設計趨勢的文章');
  });
});
