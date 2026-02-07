'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Search, Heart, Trash2, Tag, Download, Copy, Check,
  FolderOpen, Image as ImageIcon, Filter, Grid, List, Loader2
} from 'lucide-react';
import {
  getAllImagesAsync,
  deleteImage,
  toggleFavorite,
  searchImages,
  getFavoriteImages,
  setImageCategory,
  addTagToImage,
  removeTagFromImage,
  IMAGE_CATEGORIES,
} from '@/lib/imageGallery';

export default function ImageGalleryModal({ isOpen, onClose, onSelectImage }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFavorites, setShowFavorites] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // grid | list
  const [editingTags, setEditingTags] = useState(null);
  const [newTag, setNewTag] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // 載入圖片
  useEffect(() => {
    if (isOpen) {
      loadImages();
    }
  }, [isOpen, selectedCategory, showFavorites, searchTerm]);

  const loadImages = async () => {
    setLoading(true);
    try {
      let result = await getAllImagesAsync();
      
      // 套用篩選
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        result = result.filter(img => 
          img.prompt?.toLowerCase().includes(term) ||
          img.tags?.some(tag => tag.toLowerCase().includes(term)) ||
          img.cardContent?.toLowerCase().includes(term)
        );
      } else if (showFavorites) {
        result = result.filter(img => img.favorite);
      } else if (selectedCategory !== 'all') {
        result = result.filter(img => img.category === selectedCategory);
      }
      
      setImages(result);
    } catch (e) {
      console.error('Failed to load images:', e);
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (imageId, e) => {
    e.stopPropagation();
    if (confirm('確定要刪除這張圖片嗎？')) {
      deleteImage(imageId);
      loadImages();
    }
  };

  const handleToggleFavorite = (imageId, e) => {
    e.stopPropagation();
    toggleFavorite(imageId);
    loadImages();
  };

  const handleCategoryChange = (imageId, category) => {
    setImageCategory(imageId, category);
    loadImages();
  };

  const handleAddTag = (imageId) => {
    if (newTag.trim()) {
      addTagToImage(imageId, newTag.trim());
      setNewTag('');
      loadImages();
    }
  };

  const handleRemoveTag = (imageId, tag) => {
    removeTagFromImage(imageId, tag);
    loadImages();
  };

  const handleSelect = (image) => {
    if (onSelectImage) {
      onSelectImage(image);
      onClose();
    }
  };

  const copyToClipboard = async (text, id) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0A0A0A] border border-[#333] w-full max-w-5xl h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-[#222] flex items-center justify-between">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-[#00FF99]" />
            IMAGE GALLERY
            <span className="text-[10px] text-[#555] font-normal">{images.length} images</span>
          </h2>
          <button
            onClick={onClose}
            className="text-[#555] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-[#222] flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜尋圖片..."
              className="w-full bg-[#111] border border-[#333] pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-[#00FF99]"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#555]" />
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setShowFavorites(false);
              }}
              className="bg-[#111] border border-[#333] px-3 py-2 text-xs focus:outline-none focus:border-[#00FF99]"
            >
              {IMAGE_CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Favorites Toggle */}
          <button
            onClick={() => setShowFavorites(!showFavorites)}
            className={`flex items-center gap-1 px-3 py-2 text-xs border transition-colors ${
              showFavorites
                ? 'border-[#FF004D] text-[#FF004D] bg-[#FF004D]/10'
                : 'border-[#333] text-[#888] hover:border-[#FF004D] hover:text-[#FF004D]'
            }`}
          >
            <Heart className={`w-3 h-3 ${showFavorites ? 'fill-current' : ''}`} />
            收藏
          </button>

          {/* View Mode */}
          <div className="flex items-center border border-[#333]">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-[#00FF99] text-black' : 'text-[#555] hover:text-white'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-[#00FF99] text-black' : 'text-[#555] hover:text-white'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-[#555]">
              <Loader2 className="w-8 h-8 animate-spin text-[#00FF99] mb-4" />
              <p className="text-sm">載入圖庫...</p>
            </div>
          ) : images.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[#555]">
              <FolderOpen className="w-12 h-12 mb-4 opacity-30" />
              <p className="text-sm">尚無圖片</p>
              <p className="text-xs mt-1">生成的圖片會自動儲存到這裡</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image) => (
                <motion.div
                  key={image.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="group relative bg-[#111] border border-[#222] overflow-hidden cursor-pointer hover:border-[#00FF99] transition-colors"
                  onClick={() => setSelectedImage(image)}
                >
                  <div className="aspect-square">
                    <img
                      src={image.imageUrl}
                      alt={image.prompt}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col">
                    <div className="flex-1 p-2 overflow-hidden">
                      <p className="text-[10px] text-[#888] line-clamp-3">{image.prompt}</p>
                    </div>
                    <div className="flex items-center justify-between p-2 border-t border-[#333]">
                      <button
                        onClick={(e) => handleToggleFavorite(image.id, e)}
                        className="p-1.5 hover:bg-[#222] rounded"
                      >
                        <Heart className={`w-4 h-4 ${image.favorite ? 'text-[#FF004D] fill-current' : 'text-[#555]'}`} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(image);
                        }}
                        className="px-2 py-1 bg-[#00FF99] text-black text-[10px] font-bold hover:bg-[#00CC7A]"
                      >
                        選擇
                      </button>
                      <button
                        onClick={(e) => handleDelete(image.id, e)}
                        className="p-1.5 hover:bg-[#222] rounded text-[#555] hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Favorite Badge */}
                  {image.favorite && (
                    <div className="absolute top-2 right-2">
                      <Heart className="w-4 h-4 text-[#FF004D] fill-current" />
                    </div>
                  )}

                  {/* Category Badge */}
                  <div
                    className="absolute top-2 left-2 px-1.5 py-0.5 text-[8px] font-bold"
                    style={{
                      backgroundColor: IMAGE_CATEGORIES.find(c => c.id === image.category)?.color + '20',
                      color: IMAGE_CATEGORIES.find(c => c.id === image.category)?.color,
                    }}
                  >
                    {IMAGE_CATEGORIES.find(c => c.id === image.category)?.name}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {images.map((image) => (
                <motion.div
                  key={image.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-4 p-3 bg-[#111] border border-[#222] hover:border-[#00FF99] transition-colors cursor-pointer"
                  onClick={() => setSelectedImage(image)}
                >
                  <img
                    src={image.imageUrl}
                    alt={image.prompt}
                    className="w-16 h-16 object-cover border border-[#333]"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#EAEAEA] line-clamp-1">{image.prompt}</p>
                    <p className="text-[10px] text-[#555] mt-1">
                      {new Date(image.createdAt).toLocaleDateString('zh-TW')}
                    </p>
                    {image.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {image.tags.map(tag => (
                          <span key={tag} className="px-1.5 py-0.5 bg-[#222] text-[#888] text-[8px]">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleToggleFavorite(image.id, e)}
                      className="p-2 hover:bg-[#222] rounded"
                    >
                      <Heart className={`w-4 h-4 ${image.favorite ? 'text-[#FF004D] fill-current' : 'text-[#555]'}`} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(image);
                      }}
                      className="px-3 py-1.5 bg-[#00FF99] text-black text-xs font-bold hover:bg-[#00CC7A]"
                    >
                      選擇
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Image Detail Modal */}
        <AnimatePresence>
          {selectedImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/95 flex"
              onClick={() => setSelectedImage(null)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 flex"
              >
                {/* Image Preview */}
                <div className="flex-1 flex items-center justify-center p-8">
                  <img
                    src={selectedImage.imageUrl}
                    alt={selectedImage.prompt}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>

                {/* Sidebar */}
                <div className="w-80 bg-[#0A0A0A] border-l border-[#222] flex flex-col">
                  <div className="p-4 border-b border-[#222] flex items-center justify-between">
                    <h3 className="text-sm font-bold">圖片詳情</h3>
                    <button
                      onClick={() => setSelectedImage(null)}
                      className="text-[#555] hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Prompt */}
                    <div>
                      <p className="text-[10px] text-[#555] mb-2">PROMPT</p>
                      <div className="relative">
                        <p className="text-xs text-[#888] bg-[#111] p-3 border border-[#222]">
                          {selectedImage.prompt}
                        </p>
                        <button
                          onClick={() => copyToClipboard(selectedImage.prompt, 'prompt')}
                          className="absolute top-2 right-2 p-1 hover:bg-[#222] rounded"
                        >
                          {copiedId === 'prompt' ? (
                            <Check className="w-3 h-3 text-[#00FF99]" />
                          ) : (
                            <Copy className="w-3 h-3 text-[#555]" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Category */}
                    <div>
                      <p className="text-[10px] text-[#555] mb-2">分類</p>
                      <select
                        value={selectedImage.category}
                        onChange={(e) => {
                          handleCategoryChange(selectedImage.id, e.target.value);
                          setSelectedImage({ ...selectedImage, category: e.target.value });
                        }}
                        className="w-full bg-[#111] border border-[#333] px-3 py-2 text-xs focus:outline-none focus:border-[#00FF99]"
                      >
                        {IMAGE_CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Tags */}
                    <div>
                      <p className="text-[10px] text-[#555] mb-2">標籤</p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {selectedImage.tags.map(tag => (
                          <span
                            key={tag}
                            className="flex items-center gap-1 px-2 py-1 bg-[#222] text-[#888] text-[10px] group"
                          >
                            {tag}
                            <button
                              onClick={() => {
                                handleRemoveTag(selectedImage.id, tag);
                                setSelectedImage({
                                  ...selectedImage,
                                  tags: selectedImage.tags.filter(t => t !== tag),
                                });
                              }}
                              className="opacity-0 group-hover:opacity-100 hover:text-red-500"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleAddTag(selectedImage.id);
                              setSelectedImage({
                                ...selectedImage,
                                tags: [...selectedImage.tags, newTag.trim()],
                              });
                            }
                          }}
                          placeholder="新增標籤..."
                          className="flex-1 bg-[#111] border border-[#333] px-2 py-1 text-xs focus:outline-none focus:border-[#00FF99]"
                        />
                        <button
                          onClick={() => {
                            handleAddTag(selectedImage.id);
                            setSelectedImage({
                              ...selectedImage,
                              tags: [...selectedImage.tags, newTag.trim()],
                            });
                          }}
                          className="px-2 py-1 bg-[#333] text-xs hover:bg-[#444]"
                        >
                          <Tag className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Date */}
                    <div>
                      <p className="text-[10px] text-[#555] mb-2">建立時間</p>
                      <p className="text-xs text-[#888]">
                        {new Date(selectedImage.createdAt).toLocaleString('zh-TW')}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 border-t border-[#222] space-y-2">
                    <button
                      onClick={() => {
                        handleSelect(selectedImage);
                        setSelectedImage(null);
                      }}
                      className="w-full py-2 bg-[#00FF99] text-black text-xs font-bold hover:bg-[#00CC7A] transition-colors"
                    >
                      選擇此圖片
                    </button>
                    <a
                      href={selectedImage.imageUrl}
                      download={`image-${selectedImage.id}.png`}
                      className="flex items-center justify-center gap-2 w-full py-2 border border-[#333] text-xs hover:bg-[#111] transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      下載
                    </a>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
