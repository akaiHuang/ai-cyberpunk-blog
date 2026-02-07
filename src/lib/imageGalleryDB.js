/**
 * 圖庫管理系統 - IndexedDB 版本
 * 使用 IndexedDB 存儲大型圖片，解決 localStorage 5MB 限制問題
 */

const DB_NAME = 'blogsys_gallery';
const DB_VERSION = 1;
const STORE_NAME = 'images';

/**
 * 圖片資料結構
 * @typedef {Object} GalleryImage
 * @property {string} id - 唯一識別碼
 * @property {string} imageUrl - Base64 圖片 URL
 * @property {string} prompt - 生成時使用的 Prompt
 * @property {string} cardContent - 來源卡片內容
 * @property {string[]} tags - 標籤陣列
 * @property {string} category - 分類
 * @property {string} createdAt - 建立時間
 * @property {boolean} favorite - 是否收藏
 */

/**
 * 預設分類
 */
export const IMAGE_CATEGORIES = [
  { id: 'all', name: '全部', color: '#EAEAEA' },
  { id: 'concept', name: '概念圖', color: '#00FF99' },
  { id: 'infographic', name: '資訊圖表', color: '#FFD700' },
  { id: 'illustration', name: '插圖', color: '#FF00FF' },
  { id: 'photo', name: '攝影風格', color: '#00BFFF' },
  { id: 'ai-generated', name: 'AI 生成', color: '#FF004D' },
  { id: 'other', name: '其他', color: '#888888' },
];

let dbInstance = null;

/**
 * 開啟或建立 IndexedDB
 */
function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('IndexedDB not available on server'));
      return;
    }

    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('[ImageGalleryDB] Failed to open:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // 建立 images store
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('category', 'category', { unique: false });
        store.createIndex('favorite', 'favorite', { unique: false });
      }
    };
  });
}

/**
 * 取得所有圖片
 * @returns {Promise<GalleryImage[]>}
 */
export async function getAllImages() {
  if (typeof window === 'undefined') return [];

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        // 按建立時間排序（最新的在前）
        const images = request.result || [];
        images.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        resolve(images);
      };

      request.onerror = () => {
        console.error('[ImageGalleryDB] Failed to get images:', request.error);
        reject(request.error);
      };
    });
  } catch (e) {
    console.error('[ImageGalleryDB] Error:', e);
    return [];
  }
}

/**
 * 儲存圖片到圖庫
 * @param {Omit<GalleryImage, 'id' | 'createdAt'>} imageData
 * @returns {Promise<GalleryImage | null>}
 */
export async function saveImage(imageData) {
  if (typeof window === 'undefined') return null;

  const newImage = {
    id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    createdAt: new Date().toISOString(),
    favorite: false,
    tags: [],
    category: 'other',
    ...imageData,
  };

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(newImage);

      request.onsuccess = () => {
        console.log('[ImageGalleryDB] Image saved:', newImage.id);
        resolve(newImage);
      };

      request.onerror = () => {
        console.error('[ImageGalleryDB] Failed to save:', request.error);
        reject(request.error);
      };
    });
  } catch (e) {
    console.error('[ImageGalleryDB] Save error:', e);
    return null;
  }
}

/**
 * 更新圖片資訊
 * @param {string} imageId
 * @param {Partial<GalleryImage>} updates
 * @returns {Promise<GalleryImage | null>}
 */
export async function updateImage(imageId, updates) {
  if (typeof window === 'undefined') return null;

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const getRequest = store.get(imageId);
      
      getRequest.onsuccess = () => {
        const image = getRequest.result;
        if (!image) {
          resolve(null);
          return;
        }

        const updatedImage = { ...image, ...updates };
        const putRequest = store.put(updatedImage);

        putRequest.onsuccess = () => resolve(updatedImage);
        putRequest.onerror = () => reject(putRequest.error);
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  } catch (e) {
    console.error('[ImageGalleryDB] Update error:', e);
    return null;
  }
}

/**
 * 刪除圖片
 * @param {string} imageId
 * @returns {Promise<boolean>}
 */
export async function deleteImage(imageId) {
  if (typeof window === 'undefined') return false;

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(imageId);

      request.onsuccess = () => {
        console.log('[ImageGalleryDB] Image deleted:', imageId);
        resolve(true);
      };

      request.onerror = () => {
        console.error('[ImageGalleryDB] Delete failed:', request.error);
        reject(request.error);
      };
    });
  } catch (e) {
    console.error('[ImageGalleryDB] Delete error:', e);
    return false;
  }
}

/**
 * 清空圖庫
 * @returns {Promise<boolean>}
 */
export async function clearGallery() {
  if (typeof window === 'undefined') return false;

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('[ImageGalleryDB] Gallery cleared');
        resolve(true);
      };

      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('[ImageGalleryDB] Clear error:', e);
    return false;
  }
}

/**
 * 取得收藏的圖片
 * @returns {Promise<GalleryImage[]>}
 */
export async function getFavoriteImages() {
  const images = await getAllImages();
  return images.filter(img => img.favorite);
}

/**
 * 依分類取得圖片
 * @param {string} category
 * @returns {Promise<GalleryImage[]>}
 */
export async function getImagesByCategory(category) {
  const images = await getAllImages();
  if (category === 'all') return images;
  return images.filter(img => img.category === category);
}

/**
 * 搜尋圖片
 * @param {string} query
 * @returns {Promise<GalleryImage[]>}
 */
export async function searchImages(query) {
  const images = await getAllImages();
  const lowerQuery = query.toLowerCase();
  
  return images.filter(img => 
    img.prompt?.toLowerCase().includes(lowerQuery) ||
    img.cardContent?.toLowerCase().includes(lowerQuery) ||
    img.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

/**
 * 取得圖庫統計資訊
 * @returns {Promise<{total: number, byCategory: Record<string, number>, favorites: number}>}
 */
export async function getGalleryStats() {
  const images = await getAllImages();
  
  const byCategory = {};
  let favorites = 0;
  
  images.forEach(img => {
    byCategory[img.category] = (byCategory[img.category] || 0) + 1;
    if (img.favorite) favorites++;
  });

  return {
    total: images.length,
    byCategory,
    favorites,
  };
}

/**
 * 從舊的 localStorage 遷移資料到 IndexedDB
 * @returns {Promise<number>} 遷移的圖片數量
 */
export async function migrateFromLocalStorage() {
  if (typeof window === 'undefined') return 0;

  const OLD_STORAGE_KEY = 'blogsys_image_gallery';
  
  try {
    const stored = localStorage.getItem(OLD_STORAGE_KEY);
    if (!stored) return 0;

    const oldImages = JSON.parse(stored);
    if (!Array.isArray(oldImages) || oldImages.length === 0) return 0;

    console.log(`[ImageGalleryDB] Migrating ${oldImages.length} images from localStorage...`);

    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    let migrated = 0;
    for (const img of oldImages) {
      try {
        store.put(img);
        migrated++;
      } catch (e) {
        console.warn('[ImageGalleryDB] Failed to migrate image:', img.id);
      }
    }

    // 遷移完成後清除舊資料
    localStorage.removeItem(OLD_STORAGE_KEY);
    console.log(`[ImageGalleryDB] Migration complete: ${migrated} images`);

    return migrated;
  } catch (e) {
    console.error('[ImageGalleryDB] Migration error:', e);
    return 0;
  }
}
