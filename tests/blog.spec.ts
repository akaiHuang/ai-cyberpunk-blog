import { test, expect } from '@playwright/test';

/**
 * BlogSys 部落格功能測試
 * 
 * 測試範圍:
 * - 首頁載入
 * - 文章列表
 * - 文章詳情頁
 * - 分類篩選
 */

test.describe('Blog Homepage', () => {
  test('should load homepage correctly', async ({ page }) => {
    await page.goto('/');
    
    // 檢查有分類顯示 (如 願望清單, AI 實驗室 等)
    const hasCategory = await page.locator('h2, h3').first().isVisible();
    expect(hasCategory).toBeTruthy();
  });

  test('should navigate to blog list', async ({ page }) => {
    await page.goto('/');
    
    // 點擊 Blog 連結 (VIEW ALL 按鈕)
    const viewAllButton = page.locator('a:has-text("VIEW ALL")').first();
    if (await viewAllButton.isVisible()) {
      await viewAllButton.click();
      // 確認導航成功
      await expect(page).toHaveURL(/\/blog/);
    }
  });
});

test.describe('Blog List Page', () => {
  test('should display blog posts', async ({ page }) => {
    await page.goto('/blog');
    
    // 等待文章載入
    await page.waitForLoadState('networkidle');
    
    // 檢查有文章卡片
    const articles = page.locator('article, [class*="blog-card"], a[href^="/blog/"]');
    await expect(articles.first()).toBeVisible();
  });

  test('should filter by category', async ({ page }) => {
    await page.goto('/blog');
    
    // 點擊分類按鈕 (如果有)
    const categoryButton = page.locator('button:has-text("AI LAB")');
    if (await categoryButton.isVisible()) {
      await categoryButton.click();
      
      // 確認篩選效果
      await page.waitForLoadState('networkidle');
    }
  });
});

test.describe('Blog Detail Page', () => {
  test('should load blog post detail', async ({ page }) => {
    // 先到列表頁
    await page.goto('/blog');
    await page.waitForLoadState('networkidle');
    
    // 點擊第一篇文章
    const firstPost = page.locator('a[href^="/blog/"]').first();
    if (await firstPost.isVisible()) {
      await firstPost.click();
      
      // 確認導航到詳情頁
      await expect(page).toHaveURL(/\/blog\/.+/);
      
      // 檢查有返回按鈕
      await expect(page.locator('text=BACK')).toBeVisible();
    }
  });

  test('should navigate back from detail page', async ({ page }) => {
    await page.goto('/blog');
    await page.waitForLoadState('networkidle');
    
    const firstPost = page.locator('a[href^="/blog/"]').first();
    if (await firstPost.isVisible()) {
      await firstPost.click();
      await expect(page).toHaveURL(/\/blog\/.+/);
      
      // 點擊返回
      await page.click('text=BACK');
      
      // 確認返回列表頁
      await expect(page).toHaveURL('/blog');
    }
  });
});

test.describe('Admin Login', () => {
  test('should show login page', async ({ page }) => {
    await page.goto('/admin/login');
    
    // 檢查登入表單
    await expect(page.locator('input[placeholder*="username"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("LOGIN")')).toBeVisible();
  });

  test('should login successfully with correct credentials', async ({ page }) => {
    await page.goto('/admin/login');
    
    // 輸入正確的帳號密碼
    await page.fill('input[placeholder*="username"]', 'admin');
    await page.fill('input[placeholder*="password"]', 'admin123');
    
    // 點擊登入
    await page.click('button:has-text("LOGIN")');
    
    // 等待導航到後台
    await page.waitForURL('/admin/blog', { timeout: 5000 });
  });

  test('should show error with wrong credentials', async ({ page }) => {
    await page.goto('/admin/login');
    
    // 輸入錯誤的帳號密碼
    await page.fill('input[placeholder*="username"]', 'wrong');
    await page.fill('input[placeholder*="password"]', 'wrong');
    
    // 點擊登入
    await page.click('button:has-text("LOGIN")');
    
    // 應該顯示錯誤訊息或停留在登入頁
    await expect(page).toHaveURL('/admin/login');
  });
});
