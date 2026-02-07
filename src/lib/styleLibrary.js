/**
 * 風格庫管理系統 (Skill System)
 * 儲存文章風格和視覺風格供 AI 生成時參考
 */

const STORAGE_KEY = 'blogsys_style_library';

/**
 * 風格類型
 */
export const STYLE_TYPES = {
  WRITING: 'writing',   // 文風
  VISUAL: 'visual',     // 視覺風格
};

/**
 * 風格資料結構
 * @typedef {Object} StyleSkill
 * @property {string} id - 唯一識別碼
 * @property {string} name - 風格名稱
 * @property {string} type - 風格類型 (writing / visual)
 * @property {string} description - 風格描述
 * @property {string} analysis - AI 分析結果
 * @property {string} sourceContent - 原始內容 (文章文字或圖片 base64)
 * @property {string} prompt - 生成用的 Prompt
 * @property {string[]} tags - 標籤
 * @property {string} createdAt - 建立時間
 * @property {string} updatedAt - 更新時間
 */

/**
 * 取得所有風格
 * @returns {StyleSkill[]}
 */
export function getAllStyles() {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error reading style library:', e);
  }
  return [];
}

/**
 * 取得特定類型的風格
 * @param {string} type
 * @returns {StyleSkill[]}
 */
export function getStylesByType(type) {
  return getAllStyles().filter(style => style.type === type);
}

/**
 * 取得單一風格
 * @param {string} styleId
 * @returns {StyleSkill | null}
 */
export function getStyleById(styleId) {
  return getAllStyles().find(style => style.id === styleId) || null;
}

/**
 * 儲存新風格
 * @param {Omit<StyleSkill, 'id' | 'createdAt' | 'updatedAt'>} styleData
 * @returns {StyleSkill}
 */
export function saveStyle(styleData) {
  const styles = getAllStyles();

  const newStyle = {
    id: `style-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: [],
    ...styleData,
  };

  styles.unshift(newStyle);

  // 限制最多儲存 50 個風格
  const trimmedStyles = styles.slice(0, 50);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedStyles));
  return newStyle;
}

/**
 * 更新風格
 * @param {string} styleId
 * @param {Partial<StyleSkill>} updates
 * @returns {StyleSkill | null}
 */
export function updateStyle(styleId, updates) {
  const styles = getAllStyles();
  const index = styles.findIndex(style => style.id === styleId);

  if (index !== -1) {
    styles[index] = {
      ...styles[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(styles));
    return styles[index];
  }
  return null;
}

/**
 * 刪除風格
 * @param {string} styleId
 */
export function deleteStyle(styleId) {
  const styles = getAllStyles();
  const filtered = styles.filter(style => style.id !== styleId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * 搜尋風格
 * @param {string} searchTerm
 * @returns {StyleSkill[]}
 */
export function searchStyles(searchTerm) {
  const term = searchTerm.toLowerCase();
  return getAllStyles().filter(style => {
    return (
      style.name.toLowerCase().includes(term) ||
      style.description.toLowerCase().includes(term) ||
      style.tags.some(tag => tag.toLowerCase().includes(term))
    );
  });
}

/**
 * 組合風格為 Prompt
 * @param {StyleSkill} style
 * @returns {string}
 */
export function styleToPrompt(style) {
  if (style.type === STYLE_TYPES.WRITING) {
    return `請參考以下寫作風格：\n${style.analysis}\n\n使用這種風格來撰寫內容。`;
  } else {
    return `Visual style reference: ${style.analysis}\n\nApply this visual style to the generated image.`;
  }
}

/**
 * 清空風格庫
 */
export function clearStyleLibrary() {
  localStorage.removeItem(STORAGE_KEY);
}
