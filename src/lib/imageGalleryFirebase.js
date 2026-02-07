/**
 * 圖庫管理系統 - Firebase 版本
 * 使用 Firebase Storage 存儲圖片，Firestore 存儲元資料
 */

import { db, storage } from './firebase';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import {
  ref,
  uploadString,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';

const COLLECTION_NAME = 'image_gallery';
const STORAGE_PATH = 'gallery_images';

/**
 * 圖片資料結構
 * @typedef {Object} GalleryImage
 * @property {string} id - 唯一識別碼
 * @property {string} imageUrl - 圖片 URL (Firebase Storage)
 * @property {string} prompt - 生成時使用的 Prompt
 * @property {string} cardContent - 來源卡片內容
 * @property {string[]} tags - 標籤陣列
 * @property {string} category - 分類
 * @property {Date} createdAt - 建立時間
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

/**
 * 上傳 Base64 圖片到 Firebase Storage
 * @param {string} base64Data - Base64 編碼的圖片
 * @param {string} imageId - 圖片 ID
 * @returns {Promise<string>} 圖片 URL
 */
async function uploadImageToStorage(base64Data, imageId) {
  // 如果已經是 URL，直接返回
  if (!base64Data.startsWith('data:')) {
    return base64Data;
  }

  const storageRef = ref(storage, `${STORAGE_PATH}/${imageId}`);
  
  // 上傳 base64 字串
  await uploadString(storageRef, base64Data, 'data_url');
  
  // 取得下載 URL
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
}

/**
 * 從 Firebase Storage 刪除圖片
 * @param {string} imageId - 圖片 ID
 */
async function deleteImageFromStorage(imageId) {
  try {
    const storageRef = ref(storage, `${STORAGE_PATH}/${imageId}`);
    await deleteObject(storageRef);
  } catch (e) {
    console.warn('[FirebaseGallery] Failed to delete from storage:', e);
  }
}

/**
 * 取得所有圖片
 * @param {number} limitCount - 限制數量 (預設 100)
 * @returns {Promise<GalleryImage[]>}
 */
export async function getAllImages(limitCount = 100) {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    }));
  } catch (e) {
    console.error('[FirebaseGallery] Failed to get images:', e);
    return [];
  }
}

/**
 * 儲存圖片到圖庫
 * @param {Object} imageData
 * @returns {Promise<GalleryImage | null>}
 */
export async function saveImage(imageData) {
  try {
    const imageId = `img-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // 上傳圖片到 Storage
    const imageUrl = await uploadImageToStorage(imageData.imageUrl, imageId);
    
    // 儲存元資料到 Firestore
    const docData = {
      imageUrl,
      originalBase64: imageData.imageUrl?.startsWith('data:') ? true : false,
      prompt: imageData.prompt || '',
      cardContent: imageData.cardContent || '',
      tags: imageData.tags || [],
      category: imageData.category || 'other',
      favorite: false,
      createdAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(collection(db, COLLECTION_NAME), docData);
    
    console.log('[FirebaseGallery] Image saved:', docRef.id);
    
    return {
      id: docRef.id,
      ...docData,
      createdAt: new Date().toISOString(),
    };
  } catch (e) {
    console.error('[FirebaseGallery] Failed to save image:', e);
    return null;
  }
}

/**
 * 更新圖片資訊
 * @param {string} imageId
 * @param {Partial<GalleryImage>} updates
 * @returns {Promise<boolean>}
 */
export async function updateImage(imageId, updates) {
  try {
    const docRef = doc(db, COLLECTION_NAME, imageId);
    await updateDoc(docRef, updates);
    return true;
  } catch (e) {
    console.error('[FirebaseGallery] Failed to update image:', e);
    return false;
  }
}

/**
 * 刪除圖片
 * @param {string} imageId
 * @returns {Promise<boolean>}
 */
export async function deleteImage(imageId) {
  try {
    // 刪除 Storage 中的圖片
    await deleteImageFromStorage(imageId);
    
    // 刪除 Firestore 文檔
    await deleteDoc(doc(db, COLLECTION_NAME, imageId));
    
    console.log('[FirebaseGallery] Image deleted:', imageId);
    return true;
  } catch (e) {
    console.error('[FirebaseGallery] Failed to delete image:', e);
    return false;
  }
}

/**
 * 切換收藏狀態
 * @param {string} imageId
 * @returns {Promise<boolean>}
 */
export async function toggleFavorite(imageId) {
  try {
    const docRef = doc(db, COLLECTION_NAME, imageId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const currentFavorite = docSnap.data().favorite;
      await updateDoc(docRef, { favorite: !currentFavorite });
      return !currentFavorite;
    }
    return false;
  } catch (e) {
    console.error('[FirebaseGallery] Failed to toggle favorite:', e);
    return false;
  }
}

/**
 * 依分類取得圖片
 * @param {string} category
 * @returns {Promise<GalleryImage[]>}
 */
export async function getImagesByCategory(category) {
  if (category === 'all') return getAllImages();
  
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('category', '==', category),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    }));
  } catch (e) {
    console.error('[FirebaseGallery] Failed to get by category:', e);
    return [];
  }
}

/**
 * 取得收藏的圖片
 * @returns {Promise<GalleryImage[]>}
 */
export async function getFavoriteImages() {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('favorite', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    }));
  } catch (e) {
    console.error('[FirebaseGallery] Failed to get favorites:', e);
    return [];
  }
}

/**
 * 搜尋圖片
 * @param {string} searchTerm
 * @returns {Promise<GalleryImage[]>}
 */
export async function searchImages(searchTerm) {
  // Firestore 不支援全文搜尋，所以先取全部再過濾
  const images = await getAllImages(500);
  const term = searchTerm.toLowerCase();
  
  return images.filter(img =>
    img.prompt?.toLowerCase().includes(term) ||
    img.cardContent?.toLowerCase().includes(term) ||
    img.tags?.some(tag => tag.toLowerCase().includes(term))
  );
}

/**
 * 新增標籤
 * @param {string} imageId
 * @param {string} tag
 */
export async function addTagToImage(imageId, tag) {
  try {
    const docRef = doc(db, COLLECTION_NAME, imageId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const tags = docSnap.data().tags || [];
      if (!tags.includes(tag)) {
        await updateDoc(docRef, { tags: [...tags, tag] });
      }
    }
  } catch (e) {
    console.error('[FirebaseGallery] Failed to add tag:', e);
  }
}

/**
 * 移除標籤
 * @param {string} imageId
 * @param {string} tag
 */
export async function removeTagFromImage(imageId, tag) {
  try {
    const docRef = doc(db, COLLECTION_NAME, imageId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const tags = docSnap.data().tags || [];
      await updateDoc(docRef, { tags: tags.filter(t => t !== tag) });
    }
  } catch (e) {
    console.error('[FirebaseGallery] Failed to remove tag:', e);
  }
}

/**
 * 設定圖片分類
 * @param {string} imageId
 * @param {string} category
 */
export async function setImageCategory(imageId, category) {
  return updateImage(imageId, { category });
}

/**
 * 清空圖庫 (危險操作)
 */
export async function clearGallery() {
  console.warn('[FirebaseGallery] clearGallery called - this will delete all images!');
  const images = await getAllImages(1000);
  
  for (const img of images) {
    await deleteImage(img.id);
  }
}

/**
 * 從 IndexedDB 遷移到 Firebase
 * @returns {Promise<number>} 遷移的圖片數量
 */
export async function migrateFromIndexedDB() {
  if (typeof window === 'undefined') return 0;

  try {
    // 嘗試從 IndexedDB 讀取
    const { getAllImages: getFromIDB } = await import('./imageGalleryDB');
    const idbImages = await getFromIDB();
    
    if (!idbImages || idbImages.length === 0) return 0;
    
    console.log(`[FirebaseGallery] Migrating ${idbImages.length} images from IndexedDB...`);
    
    let migrated = 0;
    for (const img of idbImages) {
      try {
        await saveImage({
          imageUrl: img.imageUrl,
          prompt: img.prompt,
          cardContent: img.cardContent,
          tags: img.tags,
          category: img.category,
        });
        migrated++;
      } catch (e) {
        console.warn('[FirebaseGallery] Failed to migrate image:', img.id);
      }
    }
    
    console.log(`[FirebaseGallery] Migration complete: ${migrated} images`);
    return migrated;
  } catch (e) {
    console.error('[FirebaseGallery] Migration error:', e);
    return 0;
  }
}
