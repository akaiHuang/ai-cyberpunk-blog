/**
 * 圖庫管理系統 - 統一入口
 * 優先使用 Firebase，降級到 IndexedDB
 */

import * as FirebaseGallery from './imageGalleryFirebase';
import * as ImageGalleryDB from './imageGalleryDB';

// 重新導出分類
export { IMAGE_CATEGORIES } from './imageGalleryFirebase';

// 本地快取
let imageCache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 10000; // 10 秒快取

// 檢查 Firebase 是否可用
// Firebase Storage 已啟用
let useFirebase = true;
let firebaseChecked = false;

/**
 * 檢查 Firebase Storage 是否可用
 */
async function checkFirebaseAvailability() {
  if (firebaseChecked) return useFirebase;
  firebaseChecked = true;
  
  try {
    // 嘗試列出圖片來檢查 Firestore 是否可用
    const images = await FirebaseGallery.getAllImages(1);
    // 如果沒有錯誤，Firebase 可用
    useFirebase = true;
    console.log('[ImageGallery] Firebase is available');
  } catch (e) {
    console.warn('[ImageGallery] Firebase not available, using IndexedDB:', e.message);
    useFirebase = false;
  }
  
  return useFirebase;
}

/**
 * 取得所有圖片（同步版本，從快取讀取）
 * @returns {GalleryImage[]}
 */
export function getAllImages() {
  if (typeof window === 'undefined') return [];
  
  // 返回快取的資料
  if (imageCache && Date.now() - cacheTimestamp < CACHE_TTL) {
    return imageCache;
  }
  
  return imageCache || [];
}

/**
 * 取得所有圖片（異步版本）
 * @returns {Promise<GalleryImage[]>}
 */
export async function getAllImagesAsync() {
  // 首次呼叫時檢查 Firebase 可用性
  await checkFirebaseAvailability();
  
  try {
    if (useFirebase) {
      const images = await FirebaseGallery.getAllImages();
      // 合併尚未落盤的暫存圖片
      const tempImages = (imageCache || []).filter(img => img.id?.startsWith('temp-'));
      const merged = tempImages.length > 0
        ? [...tempImages, ...images.filter(img => !tempImages.some(t => t.imageUrl === img.imageUrl))]
        : images;
      imageCache = merged;
      cacheTimestamp = Date.now();
      return merged;
    }
  } catch (e) {
    console.warn('[ImageGallery] Firebase failed, falling back to IndexedDB:', e);
    useFirebase = false;
  }
  
  // Fallback to IndexedDB
  const images = await ImageGalleryDB.getAllImages();
  imageCache = images;
  cacheTimestamp = Date.now();
  return images;
}

/**
 * 儲存圖片到圖庫
 * @param {Object} imageData
 * @returns {GalleryImage | null}
 */
export function saveImage(imageData) {
  if (typeof window === 'undefined') return null;
  
  // 建立臨時 ID
  const tempImage = {
    id: `temp-${Date.now()}`,
    createdAt: new Date().toISOString(),
    favorite: false,
    tags: [],
    category: 'other',
    ...imageData,
  };

  // 立即更新本地快取
  if (imageCache) {
    imageCache = [tempImage, ...imageCache];
  }

  // 異步存到 Firebase
  if (useFirebase) {
    FirebaseGallery.saveImage(imageData).then(saved => {
      if (saved) {
        console.log('[ImageGallery] Saved to Firebase:', saved.id);
        // 更新快取中的 ID
        if (imageCache) {
          const idx = imageCache.findIndex(img => img.id === tempImage.id);
          if (idx !== -1) {
            imageCache[idx] = saved;
          }
        }
      }
    }).catch(err => {
      console.error('[ImageGallery] Firebase save failed:', err);
      useFirebase = false;
      // Fallback: 存到 IndexedDB
      ImageGalleryDB.saveImage(imageData);
    });
  } else {
    ImageGalleryDB.saveImage(imageData);
  }

  return tempImage;
}

/**
 * 儲存圖片到圖庫（異步，回傳實際儲存結果）
 * @param {Object} imageData
 * @returns {Promise<GalleryImage | null>}
 */
export async function saveImageAsync(imageData) {
  if (typeof window === 'undefined') return null;

  // 首次呼叫時檢查 Firebase 可用性
  await checkFirebaseAvailability();

  const updateCache = (saved) => {
    if (!saved) return;
    if (imageCache) {
      imageCache = [
        saved,
        ...imageCache.filter(img => img.id !== saved.id && img.imageUrl !== saved.imageUrl),
      ];
    } else {
      imageCache = [saved];
    }
    cacheTimestamp = Date.now();
  };

  if (useFirebase) {
    try {
      const saved = await FirebaseGallery.saveImage(imageData);
      if (saved) {
        updateCache(saved);
        return saved;
      }
    } catch (err) {
      console.error('[ImageGallery] Firebase save failed:', err);
      useFirebase = false;
    }
  }

  // 使用 IndexedDB 儲存（保留原始 base64）
  const saved = await ImageGalleryDB.saveImage(imageData);
  if (saved) {
    updateCache(saved);
  }
  return saved;
}

/**
 * 更新圖片資訊
 */
export function updateImage(imageId, updates) {
  if (imageCache) {
    const index = imageCache.findIndex(img => img.id === imageId);
    if (index !== -1) {
      imageCache[index] = { ...imageCache[index], ...updates };
    }
  }

  if (useFirebase) {
    FirebaseGallery.updateImage(imageId, updates).catch(console.error);
  } else {
    ImageGalleryDB.updateImage(imageId, updates).catch(console.error);
  }

  return imageCache?.find(img => img.id === imageId) || null;
}

/**
 * 刪除圖片
 */
export function deleteImage(imageId) {
  if (imageCache) {
    imageCache = imageCache.filter(img => img.id !== imageId);
  }

  if (useFirebase) {
    FirebaseGallery.deleteImage(imageId).catch(console.error);
  } else {
    ImageGalleryDB.deleteImage(imageId).catch(console.error);
  }
}

/**
 * 切換收藏狀態
 */
export function toggleFavorite(imageId) {
  if (!imageCache) return false;
  
  const index = imageCache.findIndex(img => img.id === imageId);
  if (index !== -1) {
    imageCache[index].favorite = !imageCache[index].favorite;
    
    if (useFirebase) {
      FirebaseGallery.toggleFavorite(imageId);
    } else {
      ImageGalleryDB.updateImage(imageId, { favorite: imageCache[index].favorite });
    }
    
    return imageCache[index].favorite;
  }
  return false;
}

/**
 * 根據分類篩選圖片
 */
export function getImagesByCategory(category) {
  const images = getAllImages();
  if (category === 'all') return images;
  return images.filter(img => img.category === category);
}

/**
 * 搜尋圖片
 */
export function searchImages(searchTerm) {
  const term = searchTerm.toLowerCase();
  return getAllImages().filter(img => {
    return (
      img.prompt?.toLowerCase().includes(term) ||
      img.tags?.some(tag => tag.toLowerCase().includes(term)) ||
      img.cardContent?.toLowerCase().includes(term)
    );
  });
}

/**
 * 取得收藏的圖片
 */
export function getFavoriteImages() {
  return getAllImages().filter(img => img.favorite);
}

/**
 * 新增標籤
 */
export function addTagToImage(imageId, tag) {
  if (!imageCache) return;
  
  const index = imageCache.findIndex(img => img.id === imageId);
  if (index !== -1 && !imageCache[index].tags?.includes(tag)) {
    imageCache[index].tags = [...(imageCache[index].tags || []), tag];
    
    if (useFirebase) {
      FirebaseGallery.addTagToImage(imageId, tag);
    } else {
      ImageGalleryDB.updateImage(imageId, { tags: imageCache[index].tags });
    }
  }
}

/**
 * 移除標籤
 */
export function removeTagFromImage(imageId, tag) {
  if (!imageCache) return;
  
  const index = imageCache.findIndex(img => img.id === imageId);
  if (index !== -1) {
    imageCache[index].tags = imageCache[index].tags?.filter(t => t !== tag) || [];
    
    if (useFirebase) {
      FirebaseGallery.removeTagFromImage(imageId, tag);
    } else {
      ImageGalleryDB.updateImage(imageId, { tags: imageCache[index].tags });
    }
  }
}

/**
 * 設定圖片分類
 */
export function setImageCategory(imageId, category) {
  return updateImage(imageId, { category });
}

/**
 * 取得所有標籤
 */
export function getAllTags() {
  const images = getAllImages();
  const tagSet = new Set();
  images.forEach(img => {
    img.tags?.forEach(tag => tagSet.add(tag));
  });
  return Array.from(tagSet);
}

/**
 * 清空圖庫
 */
export function clearGallery() {
  imageCache = [];
  if (useFirebase) {
    FirebaseGallery.clearGallery().catch(console.error);
  } else {
    ImageGalleryDB.clearGallery().catch(console.error);
  }
}

/**
 * 刷新快取
 */
export async function refreshCache() {
  imageCache = await getAllImagesAsync();
  cacheTimestamp = Date.now();
  return imageCache;
}
