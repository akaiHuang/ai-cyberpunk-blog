import { test, expect } from '@playwright/test';

/**
 * BlogSys AI Editor 端到端測試
 * 
 * 測試範圍:
 * - AI Editor 頁面載入
 * - Canvas Tool 功能
 * - Image Generator Modal
 * - 圖庫功能
 * - 風格庫功能
 */

// 測試用帳號 (需要與 AuthContext 的設定一致)
const TEST_CREDENTIALS = {
  username: 'admin',
  password: 'admin123',
};

test.describe('AI Editor Page', () => {
  // 每個測試前先登入
  test.beforeEach(async ({ page }) => {
    // 前往登入頁
    await page.goto('/admin/login');
    
    // 填寫帳號密碼
    await page.fill('input[placeholder*="username"]', TEST_CREDENTIALS.username);
    await page.fill('input[placeholder*="password"]', TEST_CREDENTIALS.password);
    
    // 點擊登入
    await page.click('button:has-text("LOGIN")');
    
    // 等待導航到後台
    await page.waitForURL('/admin/blog');
    
    // 前往 AI Editor
    await page.goto('/admin/blog/ai-editor');
    await page.waitForLoadState('networkidle');
  });

  test('should load AI Editor page correctly', async ({ page }) => {
    // 檢查頁面標題
    await expect(page.locator('text=BOTLOG_AI')).toBeVisible();
    
    // 檢查 Canvas 區域存在
    await expect(page.locator('text=CANVAS')).toBeVisible();
    
    // 檢查輸入框存在
    await expect(page.locator('textarea[placeholder*="Ask"]')).toBeVisible();
  });

  test('should send message to AI', async ({ page }) => {
    // 找到輸入框
    const input = page.locator('textarea[placeholder*="Ask"]');
    
    // 輸入測試訊息
    await input.fill('Hello, this is a test message');
    
    // 點擊發送按鈕
    await page.click('button:has([class*="lucide-send"])');
    
    // 等待 AI 回應
    await expect(page.locator('.prose').first()).toBeVisible({ timeout: 30000 });
  });

  test('should add empty card to canvas', async ({ page }) => {
    // 點擊 ADD TEXT 按鈕
    await page.click('button:has-text("ADD TEXT")');
    
    // 檢查卡片被加入
    await expect(page.locator('[class*="bg-[#0A0A0A]"][class*="border"]').first()).toBeVisible();
  });

  test('should open image gallery modal', async ({ page }) => {
    // 點擊圖庫按鈕
    await page.click('button:has-text("圖庫")');
    
    // 檢查 Modal 開啟
    await expect(page.locator('text=IMAGE GALLERY')).toBeVisible();
    
    // 點擊關閉
    await page.click('button:has([class*="lucide-x"])');
    
    // 確認 Modal 關閉
    await expect(page.locator('text=IMAGE GALLERY')).not.toBeVisible();
  });

  test('should open style library modal', async ({ page }) => {
    // 點擊風格庫按鈕
    await page.click('button:has-text("風格庫")');
    
    // 檢查 Modal 開啟
    await expect(page.locator('text=STYLE LIBRARY')).toBeVisible();
    
    // 點擊關閉
    await page.click('button:has([class*="lucide-x"])');
    
    // 確認 Modal 關閉
    await expect(page.locator('text=STYLE LIBRARY')).not.toBeVisible();
  });
});

test.describe('Canvas Tool', () => {
  test.beforeEach(async ({ page }) => {
    // 登入流程
    await page.goto('/admin/login');
    await page.fill('input[placeholder*="username"]', TEST_CREDENTIALS.username);
    await page.fill('input[placeholder*="password"]', TEST_CREDENTIALS.password);
    await page.click('button:has-text("LOGIN")');
    await page.waitForURL('/admin/blog');
    await page.goto('/admin/blog/ai-editor');
    await page.waitForLoadState('networkidle');
  });

  test('should create and edit card', async ({ page }) => {
    // 新增卡片
    await page.click('button:has-text("ADD TEXT")');
    
    // 等待卡片出現
    const card = page.locator('[class*="bg-[#0A0A0A]"]').first();
    await expect(card).toBeVisible();
    
    // 點擊編輯按鈕
    await card.hover();
    await page.click('[class*="lucide-edit"]');
    
    // 輸入內容
    const textarea = page.locator('textarea').first();
    await textarea.fill('Test card content');
    
    // 儲存
    await page.click('button:has-text("SAVE")');
  });

  test('should delete card', async ({ page }) => {
    // 新增卡片
    await page.click('button:has-text("ADD TEXT")');
    
    // 等待卡片出現
    const card = page.locator('[class*="bg-[#0A0A0A]"]').first();
    await expect(card).toBeVisible();
    
    // 點擊刪除按鈕
    await card.hover();
    await page.click('[class*="lucide-trash"]');
    
    // 確認卡片消失或只剩空狀態
    await expect(page.locator('text=Pin AI responses here')).toBeVisible();
  });

  test('should clear all cards', async ({ page }) => {
    // 新增多張卡片
    await page.click('button:has-text("ADD TEXT")');
    await page.click('button:has-text("ADD TEXT")');
    
    // 點擊 CLEAR 按鈕
    await page.click('button:has-text("CLEAR")');
    
    // 確認所有卡片被清除
    await expect(page.locator('text=Pin AI responses here')).toBeVisible();
  });
});

test.describe('Image Generator', () => {
  test.beforeEach(async ({ page }) => {
    // 登入流程
    await page.goto('/admin/login');
    await page.fill('input[placeholder*="username"]', TEST_CREDENTIALS.username);
    await page.fill('input[placeholder*="password"]', TEST_CREDENTIALS.password);
    await page.click('button:has-text("LOGIN")');
    await page.waitForURL('/admin/blog');
    await page.goto('/admin/blog/ai-editor');
    await page.waitForLoadState('networkidle');
  });

  test('should open image tool for card', async ({ page }) => {
    // 新增卡片
    await page.click('button:has-text("ADD TEXT")');
    
    // 等待卡片出現
    const card = page.locator('[class*="bg-[#0A0A0A]"]').first();
    await expect(card).toBeVisible();
    
    // 點擊圖片按鈕
    await card.hover();
    await page.click('[class*="lucide-image"]');
    
    // 檢查圖片工具 Modal 開啟
    await expect(page.locator('text=IMAGE GENERATOR')).toBeVisible();
  });
});
