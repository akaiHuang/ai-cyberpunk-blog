// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Canvas Tool 操作測試
 */

test.describe('Canvas Tool 基本功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      const token = btoa('bitlog-admin:' + Date.now());
      const expiry = Date.now() + 24 * 60 * 60 * 1000;
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_expiry', String(expiry));
    });
  });

  test('Canvas Tool 應該顯示版本號', async ({ page }) => {
    await page.goto('/admin/blog/ai-editor');

    await expect(page.locator('text=v1.1')).toBeVisible();
  });

  test('空 Canvas 應該顯示提示訊息', async ({ page }) => {
    await page.goto('/admin/blog/ai-editor');

    await expect(page.locator('text=Pin AI responses here')).toBeVisible();
    await expect(page.locator('text=or add text manually')).toBeVisible();
  });

  test('卡片應該顯示正確的編號', async ({ page }) => {
    await page.goto('/admin/blog/ai-editor');

    // 新增三張卡片
    await page.click('text=ADD TEXT');
    await page.click('text=ADD TEXT');
    await page.click('text=ADD TEXT');

    // 檢查編號
    const cardNumbers = page.locator('.bg-\\[\\#00FF99\\].text-black.text-\\[10px\\]');
    await expect(cardNumbers.nth(0)).toHaveText('1');
    await expect(cardNumbers.nth(1)).toHaveText('2');
    await expect(cardNumbers.nth(2)).toHaveText('3');
  });
});

test.describe('Canvas Tool 卡片排序', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      const token = btoa('bitlog-admin:' + Date.now());
      const expiry = Date.now() + 24 * 60 * 60 * 1000;
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_expiry', String(expiry));
    });
  });

  test('第一張卡片的向上按鈕應該禁用', async ({ page }) => {
    await page.goto('/admin/blog/ai-editor');

    await page.click('text=ADD TEXT');
    await page.click('text=ADD TEXT');

    // 第一張卡片的向上按鈕應該禁用
    const upButtons = page.locator('button:has(svg.lucide-chevron-up)');
    await expect(upButtons.first()).toBeDisabled();
  });

  test('最後一張卡片的向下按鈕應該禁用', async ({ page }) => {
    await page.goto('/admin/blog/ai-editor');

    await page.click('text=ADD TEXT');
    await page.click('text=ADD TEXT');

    // 最後一張卡片的向下按鈕應該禁用
    const downButtons = page.locator('button:has(svg.lucide-chevron-down)');
    await expect(downButtons.last()).toBeDisabled();
  });

  test('應該能夠移動卡片順序', async ({ page }) => {
    await page.goto('/admin/blog/ai-editor');

    // 新增兩張卡片並編輯內容
    await page.click('text=ADD TEXT');
    let editButton = page.locator('[title="Edit"]').first();
    await editButton.click();
    await page.fill('textarea', '卡片 A');
    await page.click('text=SAVE');

    await page.click('text=ADD TEXT');
    editButton = page.locator('[title="Edit"]').last();
    await editButton.click();
    await page.fill('textarea', '卡片 B');
    await page.click('text=SAVE');

    // 第一張卡片應該是 "卡片 A"
    await expect(page.locator('text=卡片 A')).toBeVisible();

    // 點擊第二張卡片的向上按鈕
    const upButtons = page.locator('button:has(svg.lucide-chevron-up)');
    await upButtons.last().click();

    // 現在第一張應該是 "卡片 B"
    const cardContents = page.locator('.text-xs.text-\\[\\#888\\]');
    await expect(cardContents.first()).toContainText('卡片 B');
  });
});

test.describe('Canvas Tool Preview & Publish', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      const token = btoa('bitlog-admin:' + Date.now());
      const expiry = Date.now() + 24 * 60 * 60 * 1000;
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_expiry', String(expiry));
    });
  });

  test('有卡片時應該顯示 PREVIEW & PUBLISH 按鈕', async ({ page }) => {
    await page.goto('/admin/blog/ai-editor');

    await page.click('text=ADD TEXT');

    await expect(page.locator('text=PREVIEW & PUBLISH')).toBeVisible();
  });

  test('空 Canvas 時不應該顯示 PREVIEW & PUBLISH 按鈕', async ({ page }) => {
    await page.goto('/admin/blog/ai-editor');

    await expect(page.locator('text=PREVIEW & PUBLISH')).not.toBeVisible();
  });

  test('展開卡片應該顯示完整內容', async ({ page }) => {
    await page.goto('/admin/blog/ai-editor');

    // 新增卡片並輸入長內容
    await page.click('text=ADD TEXT');
    const editButton = page.locator('[title="Edit"]').first();
    await editButton.click();

    const longContent = '這是一段很長的測試內容'.repeat(20);
    await page.fill('textarea', longContent);
    await page.click('text=SAVE');

    // 點擊展開按鈕
    const expandButton = page.locator('button:has(svg.lucide-eye)').first();
    await expandButton.click();

    // 卡片應該有展開樣式
    const card = page.locator('.ring-1.ring-\\[\\#00FF99\\]');
    await expect(card).toBeVisible();
  });
});

test.describe('Canvas Tool 卡片操作', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      const token = btoa('bitlog-admin:' + Date.now());
      const expiry = Date.now() + 24 * 60 * 60 * 1000;
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_expiry', String(expiry));
    });
  });

  test('編輯模式應該有 BACK 按鈕', async ({ page }) => {
    await page.goto('/admin/blog/ai-editor');

    await page.click('text=ADD TEXT');
    const editButton = page.locator('[title="Edit"]').first();
    await editButton.click();

    // 應該顯示 BACK 按鈕
    await expect(page.locator('.border-b.border-\\[\\#222\\] >> text=BACK')).toBeVisible();
  });

  test('點擊 BACK 應該取消編輯', async ({ page }) => {
    await page.goto('/admin/blog/ai-editor');

    await page.click('text=ADD TEXT');
    const editButton = page.locator('[title="Edit"]').first();
    await editButton.click();

    await page.fill('textarea', '未儲存的內容');

    // 點擊 BACK
    await page.click('.border-b.border-\\[\\#222\\] >> text=BACK');

    // 應該退出編輯模式
    await expect(page.locator('text=EDITING')).not.toBeVisible();
  });

  test('空卡片應該顯示提示文字', async ({ page }) => {
    await page.goto('/admin/blog/ai-editor');

    await page.click('text=ADD TEXT');

    // 取消編輯模式
    await page.click('.border-b.border-\\[\\#222\\] >> text=BACK');

    // 應該顯示提示文字
    await expect(page.locator('text=Empty card - click edit to add content')).toBeVisible();
  });
});
