# 📋 BlogSys 待處理功能清單

*最後更新: 2026-01-23*

---

## 🔴 高優先級

### 1. 自動化測試系統
- [x] 設置 Playwright 測試框架 ✅
- [x] AI Editor 頁面 E2E 測試 ✅
- [x] Image Generator 功能測試 ✅
- [x] Canvas Tool 操作測試 ✅
- [ ] API 路由單元測試

### 2. AI 生成圖片放入對應段落
- [x] 圖片生成後自動插入到對應的 Canvas Card ✅
- [x] 支援拖拉排序圖片位置 ✅
- [x] 圖片與文字的 layout 配置選項 ✅

### 3. AI 生成圖片存到圖庫
- [x] 建立圖庫資料結構 (localStorage / Firebase) ✅
- [x] 圖庫 UI 介面 (Grid 顯示) ✅
- [x] 從圖庫插入圖片到任意段落 ✅
- [x] 圖片分類與標籤功能 ✅
- [x] 圖片搜尋功能 ✅

---

## 🟡 中優先級

### 4. 風格區 (Style Library / Skill System)
- [x] 風格區 UI 設計 ✅
- [x] 上傳喜歡的文章 → AI 分析文風並儲存為 Skill ✅
- [x] 上傳喜歡的圖片 → AI 分析視覺風格並儲存為 Skill ✅
- [ ] 生成文章時選擇風格 Skill 作為參考
- [ ] 生成圖片時選擇視覺 Skill 作為參考
- [x] Skill 管理 (編輯、刪除、命名) ✅

### 5. 參考圖片上傳與分析
- [x] 上傳參考圖片功能 (已有 UI，需測試) ✅
- [x] AI 分析參考圖片並提取視覺特徵 ✅
- [x] 將參考圖片 + 提示詞一起送給 Gemini Image API ✅
- [ ] 生成風格相似的新圖片
- [ ] 多張參考圖片混合 (Gemini 3 Pro Image 支援最多 14 張)

---

## 🟢 已完成功能

- [x] AI Editor 頁面
- [x] BOTLOG_AI 聊天助手
- [x] Canvas Tool v1.1 (卡片釘選、排序、編輯)
- [x] Image Generator Modal UI
- [x] 多提示詞分析 (AI 針對段落建議 3-4 個圖片方向)
- [x] 真正的圖片生成 (Gemini 2.0 Flash Image / Nano Banana)
- [x] Session 管理 (儲存/恢復對話)
- [x] 文章預覽頁 BACK 按鈕
- [x] 卡片編輯 BACK 按鈕
- [x] SEND 按鈕被 Canvas 遮擋問題修復

---

## 🐛 已知問題

1. **Chat API 多輪對話格式錯誤**
   - 當載入歷史對話後繼續聊天，會出現 `ModelMessage[] schema` 錯誤
   - 原因：AI SDK v6 的 messages 格式與舊格式不相容
   - 需要修復 message 轉換邏輯

---

## 📝 技術備註

### 圖片生成 API
```
Model: gemini-2.0-flash-exp-image-generation
Endpoint: https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent
```

### 可用的 Gemini 圖像模型
- `gemini-2.5-flash-image` - 快速生成 (Nano Banana)
- `gemini-3-pro-image-preview` - 高品質生成 (Nano Banana Pro)
- 支援最高 4K 解析度
- 支援 Google Search 建立基準
- 支援最多 14 張參考圖片混合

---

*此文件由 AI 自動生成，請定期更新*
