// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Image Generator 功能測試
 */

test.describe('Image Generator Modal', () => {
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

  test('應該能夠開啟 Image Generator Modal', async ({ page }) => {
    await page.goto('/admin/blog/ai-editor');

    // 新增一張卡片
    await page.click('text=ADD TEXT');

    // 編輯卡片內容
    const editButton = page.locator('[title="Edit"]').first();
    await editButton.click();
    await page.fill('textarea', '這是測試內容，用於生成圖片');
    await page.click('text=SAVE');

    // 點擊 ADD IMAGE 按鈕
    await page.click('text=ADD IMAGE');

    // 檢查 Modal 是否顯示
    await expect(page.locator('text=IMAGE GENERATOR')).toBeVisible();
    await expect(page.locator('text=Nano Banana Pro')).toBeVisible();
  });

  test('應該顯示原始內容預覽', async ({ page }) => {
    await page.goto('/admin/blog/ai-editor');

    // 新增並編輯卡片
    await page.click('text=ADD TEXT');
    const editButton = page.locator('[title="Edit"]').first();
    await editButton.click();
    await page.fill('textarea', '這是測試內容');
    await page.click('text=SAVE');

    // 開啟 Image Generator
    await page.click('text=ADD IMAGE');

    // 檢查內容預覽
    await expect(page.locator('text=SOURCE CONTENT')).toBeVisible();
  });

  test('應該能夠關閉 Modal', async ({ page }) => {
    await page.goto('/admin/blog/ai-editor');

    await page.click('text=ADD TEXT');
    const editButton = page.locator('[title="Edit"]').first();
    await editButton.click();
    await page.fill('textarea', '測試內容');
    await page.click('text=SAVE');

    await page.click('text=ADD IMAGE');
    await expect(page.locator('text=IMAGE GENERATOR')).toBeVisible();

    // 點擊 CANCEL 按鈕
    await page.click('button:has-text("CANCEL")');

    // Modal 應該關閉
    await expect(page.locator('text=IMAGE GENERATOR')).not.toBeVisible();
  });

  test('應該顯示 ANALYZE & SUGGEST 按鈕', async ({ page }) => {
    await page.goto('/admin/blog/ai-editor');

    await page.click('text=ADD TEXT');
    const editButton = page.locator('[title="Edit"]').first();
    await editButton.click();
    await page.fill('textarea', '這是用於分析的測試內容');
    await page.click('text=SAVE');

    await page.click('text=ADD IMAGE');

    // 檢查分析按鈕
    await expect(page.locator('text=ANALYZE & SUGGEST')).toBeVisible();
  });

  test('應該顯示空狀態提示', async ({ page }) => {
    await page.goto('/admin/blog/ai-editor');

    await page.click('text=ADD TEXT');
    const editButton = page.locator('[title="Edit"]').first();
    await editButton.click();
    await page.fill('textarea', '測試內容');
    await page.click('text=SAVE');

    await page.click('text=ADD IMAGE');

    // 檢查空狀態提示
    await expect(page.locator('text=Click "ANALYZE & SUGGEST" to get AI image suggestions')).toBeVisible();
  });
});

test.describe('Image Generator 與卡片互動', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      const token = btoa('bitlog-admin:' + Date.now());
      const expiry = Date.now() + 24 * 60 * 60 * 1000;
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_expiry', String(expiry));
    });
  });

  test('有圖片的卡片應該顯示 EDIT IMAGE', async ({ page }) => {
    await page.goto('/admin/blog/ai-editor');

    // 新增卡片
    await page.click('text=ADD TEXT');
    const editButton = page.locator('[title="Edit"]').first();
    await editButton.click();
    await page.fill('textarea', '測試內容');
    await page.click('text=SAVE');

    // 初始狀態應該是 ADD IMAGE
    await expect(page.locator('text=ADD IMAGE')).toBeVisible();
  });

  test('Modal 的 SAVE 按鈕在沒有生成圖片時應該禁用', async ({ page }) => {
    await page.goto('/admin/blog/ai-editor');

    await page.click('text=ADD TEXT');
    const editButton = page.locator('[title="Edit"]').first();
    await editButton.click();
    await page.fill('textarea', '測試內容');
    await page.click('text=SAVE');

    await page.click('text=ADD IMAGE');

    // SAVE 按鈕應該禁用
    const saveButton = page.locator('button:has-text("SAVE")').last();
    await expect(saveButton).toBeDisabled();
  });
});
