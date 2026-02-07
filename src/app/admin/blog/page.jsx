'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Plus, Trash2, Edit2, Save, X, Eye, 
  Image as ImageIcon, Tag, FileText, Upload, Youtube, Bold, Italic, List, Heading, LogOut, Sparkles, Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { BLOG_CATEGORIES, BLOG_ARTICLES } from '@/data/blogData';
import AuthGuard from '@/components/AuthGuard';
import { useAuth } from '@/context/AuthContext';
import { getAllImagesAsync, saveImageAsync } from '@/lib/imageGallery';

const STORAGE_KEY = 'blogsys_articles';
const IMAGES_STORAGE_KEY = 'blogsys_images';

function BlogAdminContent() {
  const { logout } = useAuth();
  const searchParams = useSearchParams();
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [insertTarget, setInsertTarget] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const contentRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const formatBookingTime = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `Booking : ${year}.${month}.${day}.${ampm}${hours}:${minutes}`;
  };
  
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    categoryId: '',
    tags: '',
    image: '',
    content: '',
    status: 'draft',
    scheduledAt: ''
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setArticles(JSON.parse(stored));
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(BLOG_ARTICLES));
        setArticles(BLOG_ARTICLES);
      }
      
      const storedImages = localStorage.getItem(IMAGES_STORAGE_KEY);
      if (storedImages) {
        setUploadedImages(JSON.parse(storedImages));
      }

      // 檢查是否從 AI 編輯器過來
      const fromAI = searchParams.get('from') === 'ai';
      if (fromAI) {
        const aiDraft = sessionStorage.getItem('ai_article_draft');
        if (aiDraft) {
          const draft = JSON.parse(aiDraft);
          setFormData({
            title: draft.title || '',
            excerpt: draft.excerpt || '',
            categoryId: draft.categoryId || BLOG_CATEGORIES[0]?.id || '',
            tags: Array.isArray(draft.tags) ? draft.tags.join(', ') : '',
            image: draft.image || '/blog/demo_1.png',
            content: draft.content || '',
            status: 'draft',
            scheduledAt: ''
          });
          setSelectedArticle(null);
          setIsEditing(true);
          sessionStorage.removeItem('ai_article_draft');
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setArticles(BLOG_ARTICLES);
    } finally {
      setIsLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    if (showImagePicker) {
      loadGalleryImages();
    }
  }, [showImagePicker]);

  useEffect(() => {
    const checkScheduledPublish = () => {
      const now = new Date();
      let hasUpdates = false;
      
      const updatedArticles = articles.map(article => {
        if (article.status === 'booking' && article.scheduledAt) {
          const scheduledTime = new Date(article.scheduledAt);
          if (scheduledTime <= now) {
            hasUpdates = true;
            return { 
              ...article, 
              status: 'published',
              publishedAt: now.toISOString(),
              scheduledAt: null 
            };
          }
        }
        return article;
      });
      
      if (hasUpdates) {
        saveToStorage(updatedArticles);
      }
    };
    
    if (articles.length > 0) {
      checkScheduledPublish();
    }
    
    const interval = setInterval(checkScheduledPublish, 60000);
    return () => clearInterval(interval);
  }, [articles]);

  const saveToStorage = (newArticles) => {
    try {
      const articlesToSave = newArticles.map(article => ({
        ...article,
        image: article.image?.length > 50000 ? '/blog/demo_1.png' : article.image,
        content: article.content?.replace(/!\[([^\]]*)\]\(data:image[^)]{50000,}\)/g, '![圖片](/blog/demo_1.png)')
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(articlesToSave));
      setArticles(articlesToSave);
    } catch (error) {
      console.error('Storage error:', error);
      if (error.name === 'QuotaExceededError' || error.code === 22) {
        alert('儲存空間不足！請刪除一些已上傳的圖片，或使用 URL 連結圖片而非上傳。');
      } else {
        alert('儲存失敗：' + error.message);
      }
    }
  };

  const saveImagesToStorage = (images) => {
    try {
      const limitedImages = images.slice(-10);
      localStorage.setItem(IMAGES_STORAGE_KEY, JSON.stringify(limitedImages));
      setUploadedImages(limitedImages);
    } catch (error) {
      console.error('Image storage error:', error);
      if (error.name === 'QuotaExceededError' || error.code === 22) {
        alert('圖片儲存空間不足！將自動清除舊圖片。');
        localStorage.removeItem(IMAGES_STORAGE_KEY);
        setUploadedImages([]);
      }
    }
  };

  const loadGalleryImages = async () => {
    setGalleryLoading(true);
    try {
      const images = await getAllImagesAsync();
      setGalleryImages(images);
    } catch (error) {
      console.error('Gallery load error:', error);
      setGalleryImages([]);
    } finally {
      setGalleryLoading(false);
    }
  };

  const compressImage = (file, maxWidth = 800, quality = 0.7) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        try {
          const compressedData = await compressImage(file);
          
          const saved = await saveImageAsync({
            imageUrl: compressedData,
            prompt: file.name,
            cardContent: 'Admin upload',
            category: 'other',
          });
          const finalUrl = saved?.imageUrl || compressedData;

          const newImage = {
            id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            data: finalUrl,
            uploadedAt: new Date().toISOString()
          };
          
          const updated = [...uploadedImages, newImage];
          saveImagesToStorage(updated);
          
          if (insertTarget === 'cover') {
            setFormData({ ...formData, image: compressedData });
            setShowImagePicker(false);
          }
        } catch (error) {
          console.error('Image upload error:', error);
          alert('圖片處理失敗，請重試');
        }
      }
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const insertImageToContent = (imageUrl) => {
    if (insertTarget === 'cover') {
      setFormData({ ...formData, image: imageUrl });
    } else {
      const textarea = contentRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = formData.content;
        const imageMarkdown = `\n![圖片](${imageUrl})\n`;
        const newContent = text.substring(0, start) + imageMarkdown + text.substring(end);
        setFormData({ ...formData, content: newContent });
      }
    }
    setShowImagePicker(false);
  };

  const getYoutubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const insertYoutube = () => {
    const videoId = getYoutubeId(youtubeUrl);
    if (videoId) {
      const textarea = contentRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = formData.content;
        const youtubeEmbed = `\n[youtube:${videoId}]\n`;
        const newContent = text.substring(0, start) + youtubeEmbed + text.substring(end);
        setFormData({ ...formData, content: newContent });
      }
      setYoutubeUrl('');
      setShowYoutubeModal(false);
    }
  };

  const insertFormat = (format) => {
    const textarea = contentRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.content;
    const selectedText = text.substring(start, end);
    
    let newText = '';
    switch (format) {
      case 'bold':
        newText = `**${selectedText || '粗體文字'}**`;
        break;
      case 'italic':
        newText = `*${selectedText || '斜體文字'}*`;
        break;
      case 'heading':
        newText = `\n## ${selectedText || '標題'}\n`;
        break;
      case 'list':
        newText = `\n- ${selectedText || '列表項目'}\n`;
        break;
      default:
        return;
    }
    
    const newContent = text.substring(0, start) + newText + text.substring(end);
    setFormData({ ...formData, content: newContent });
  };

  const deleteUploadedImage = (imageId) => {
    const updated = uploadedImages.filter(img => img.id !== imageId);
    saveImagesToStorage(updated);
  };

  const handleNew = () => {
    setFormData({
      title: '',
      excerpt: '',
      categoryId: BLOG_CATEGORIES[0]?.id || '',
      tags: '',
      image: '/blog/demo_1.png',
      content: '',
      status: 'draft',
      scheduledAt: ''
    });
    setSelectedArticle(null);
    setIsEditing(true);
  };

  const handleEdit = (article) => {
    setFormData({
      title: article.title,
      excerpt: article.excerpt,
      categoryId: article.categoryId,
      tags: article.tags.join(', '),
      image: article.image,
      content: article.content,
      status: article.status || 'draft',
      scheduledAt: article.scheduledAt || ''
    });
    setSelectedArticle(article);
    setIsEditing(true);
  };

  const handleSave = () => {
    const now = new Date();
    
    let publishedAt = selectedArticle?.publishedAt || null;
    if (formData.status === 'published' && !publishedAt) {
      publishedAt = now.toISOString();
    }
    
    const articleData = {
      ...formData,
      tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
      date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      updatedAt: now.toISOString(),
      scheduledAt: formData.status === 'booking' ? formData.scheduledAt : null,
      publishedAt: publishedAt
    };

    if (selectedArticle) {
      const updated = articles.map(a => 
        a.id === selectedArticle.id 
          ? { ...a, ...articleData }
          : a
      );
      saveToStorage(updated);
      setSelectedArticle({ ...selectedArticle, ...articleData });
    } else {
      const newArticle = {
        ...articleData,
        id: `article-${Date.now()}`,
        createdAt: now.toISOString()
      };
      saveToStorage([newArticle, ...articles]);
    }

    setIsEditing(false);
  };

  const handleDelete = (id) => {
    const filtered = articles.filter(a => a.id !== id);
    saveToStorage(filtered);
    setShowDeleteConfirm(null);
    setSelectedArticle(null);
  };

  const toggleStatus = (article) => {
    const now = new Date();
    let newStatus;
    let publishedAt = article.publishedAt;
    
    if (article.status === 'published') {
      newStatus = 'draft';
    } else {
      newStatus = 'published';
      if (!publishedAt) {
        publishedAt = now.toISOString();
      }
    }
    
    const updatedArticle = { 
      ...article, 
      status: newStatus,
      scheduledAt: null,
      publishedAt: publishedAt
    };
    
    const updated = articles.map(a => 
      a.id === article.id ? updatedArticle : a
    );
    saveToStorage(updated);
    setSelectedArticle(updatedArticle);
  };

  const handleReset = () => {
    if (confirm('確定要重置為預設文章？這將會覆蓋所有變更。')) {
      saveToStorage(BLOG_ARTICLES);
      setSelectedArticle(null);
    }
  };

  const handleClearStorage = () => {
    if (confirm('確定要清除所有儲存的資料（包含文章和圖片）？這將釋放儲存空間。')) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(IMAGES_STORAGE_KEY);
      setArticles(BLOG_ARTICLES);
      setUploadedImages([]);
      setSelectedArticle(null);
      alert('已清除所有儲存資料');
    }
  };

  const getCategoryColor = (categoryId) => {
    const cat = BLOG_CATEGORIES.find(c => c.id === categoryId);
    return cat?.color || '#00FF99';
  };

  const getCategoryName = (categoryId) => {
    const cat = BLOG_CATEGORIES.find(c => c.id === categoryId);
    return cat?.subtitle || 'Unknown';
  };

  const defaultImages = [
    '/blog/demo_1.png',
    '/blog/demo_2.png',
    '/blog/demo_3.png',
    '/blog/demo_4.png',
    '/blog/demo_5.png',
    '/blog/demo_6.png',
    '/blog/demo_7.png',
    '/blog/demo_8.png',
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-[#00FF99] font-mono text-lg animate-pulse mb-4">LOADING...</div>
          <div className="text-[#555] text-sm">正在載入後台管理</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-[#EAEAEA] font-mono">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 border-b border-[#222] backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link 
            href="/"
            className="flex items-center gap-2 text-sm hover:text-[#00FF99] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            HOME
          </Link>
          <span className="text-xs tracking-widest">
            ADMIN<span className="text-[#333]">_PANEL</span>
          </span>
          <div className="flex items-center gap-4">
            <Link
              href="/blog"
              className="flex items-center gap-2 text-sm hover:text-[#00FF99] transition-colors"
            >
              <Eye className="w-4 h-4" />
              VIEW SITE
            </Link>
            <button
              onClick={logout}
              className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              登出
            </button>
          </div>
        </div>
      </header>

      <div className="pt-14 flex">
        {/* Sidebar - Article List */}
        <aside className="w-80 h-[calc(100vh-56px)] bg-[#050505] border-r border-[#222] flex flex-col">
          <div className="p-4 border-b border-[#222] flex items-center justify-between">
            <h2 className="text-sm font-bold">ARTICLES ({articles.length})</h2>
            <div className="flex gap-2">
              <button
                onClick={handleClearStorage}
                className="text-xs text-red-500/60 hover:text-red-500 transition-colors"
                title="清除儲存空間"
              >
                Clear
              </button>
              <button
                onClick={handleReset}
                className="text-xs text-[#555] hover:text-[#888] transition-colors"
              >
                Reset
              </button>
              <button
                onClick={handleNew}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#00FF99] text-black text-xs font-bold hover:bg-[#00CC7A] transition-colors"
              >
                <Plus className="w-3 h-3" />
                NEW
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {articles.map(article => {
              const isBooking = article.status === 'booking';
              const isLive = article.status === 'published';
              
              return (
                <div
                  key={article.id}
                  className={`p-4 border-b border-[#222] cursor-pointer hover:bg-[#111] transition-colors ${
                    selectedArticle?.id === article.id && !isEditing ? 'bg-[#111] border-l-2 border-l-[#00FF99]' : ''
                  }`}
                  onClick={() => {
                    if (!isEditing) {
                      setSelectedArticle(article);
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span 
                      className="px-2 py-0.5 text-[10px]"
                      style={{ backgroundColor: getCategoryColor(article.categoryId), color: '#000' }}
                    >
                      {getCategoryName(article.categoryId)}
                    </span>
                    <span className={`text-[10px] ${isLive ? 'text-[#00FF99]' : isBooking ? 'text-yellow-500' : 'text-[#888]'}`}>
                      {isLive ? '● LIVE' : isBooking ? '⏰ BOOKED' : '○ DRAFT'}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-white mb-1 line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-[10px] text-[#555]">
                    {article.date}
                  </p>
                  {isBooking && article.scheduledAt && (
                    <p className="text-[10px] text-yellow-500 mt-1">
                      [{formatBookingTime(article.scheduledAt)}]
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 h-[calc(100vh-56px)] overflow-y-auto">
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.div
                key="editor"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-6"
              >
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold">
                      {selectedArticle ? 'EDIT ARTICLE' : 'NEW ARTICLE'}
                    </h2>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          if (!selectedArticle) setSelectedArticle(null);
                        }}
                        className="flex items-center gap-1 px-4 py-2 border border-[#333] text-sm hover:border-[#555] transition-colors"
                      >
                        <X className="w-4 h-4" />
                        CANCEL
                      </button>
                      <button
                        onClick={handleSave}
                        className="flex items-center gap-1 px-4 py-2 bg-[#00FF99] text-black text-sm font-bold hover:bg-[#00CC7A] transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        SAVE
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Title */}
                    <div>
                      <label className="block text-xs text-[#888] mb-2">
                        <FileText className="w-3 h-3 inline mr-1" />
                        TITLE
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full bg-[#111] border border-[#333] px-4 py-3 text-white focus:outline-none focus:border-[#00FF99]"
                        placeholder="Article title..."
                      />
                    </div>

                    {/* Category & Status */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-[#888] mb-2">CATEGORY</label>
                        <select
                          value={formData.categoryId}
                          onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                          className="w-full bg-[#111] border border-[#333] px-4 py-3 text-white focus:outline-none focus:border-[#00FF99]"
                        >
                          {BLOG_CATEGORIES.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.subtitle}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-[#888] mb-2">STATUS</label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value, scheduledAt: e.target.value === 'booking' ? formData.scheduledAt : '' })}
                          className="w-full bg-[#111] border border-[#333] px-4 py-3 text-white focus:outline-none focus:border-[#00FF99]"
                        >
                          <option value="draft">Draft (草稿)</option>
                          <option value="booking">Booking (預約發布)</option>
                          <option value="published">Published (已發布)</option>
                        </select>
                      </div>
                    </div>

                    {/* Scheduled Publish */}
                    {formData.status === 'booking' && (
                      <div>
                        <label className="block text-xs text-[#888] mb-2">
                          📅 BOOKING TIME (選擇預約發布時間)
                        </label>
                        <input
                          type="datetime-local"
                          value={formData.scheduledAt}
                          onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                          className="w-full bg-[#111] border border-[#333] px-4 py-3 text-white focus:outline-none focus:border-[#00FF99]"
                        />
                      </div>
                    )}

                    {/* Cover Image */}
                    <div>
                      <label className="block text-xs text-[#888] mb-2">
                        <ImageIcon className="w-3 h-3 inline mr-1" />
                        COVER IMAGE
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formData.image}
                          onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                          className="flex-1 bg-[#111] border border-[#333] px-4 py-3 text-white focus:outline-none focus:border-[#00FF99]"
                          placeholder="Image URL or upload..."
                        />
                        <button
                          onClick={() => {
                            setInsertTarget('cover');
                            setShowImagePicker(true);
                          }}
                          className="px-4 py-3 bg-[#222] border border-[#333] hover:border-[#555] transition-colors"
                        >
                          <Upload className="w-4 h-4" />
                        </button>
                      </div>
                      {formData.image && (
                        <div className="mt-3 border border-[#222] p-2">
                          <img 
                            src={formData.image} 
                            alt="Cover Preview" 
                            className="w-full max-w-md h-40 object-cover"
                            onError={(e) => e.target.style.display = 'none'}
                          />
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    <div>
                      <label className="block text-xs text-[#888] mb-2">
                        <Tag className="w-3 h-3 inline mr-1" />
                        TAGS (comma separated)
                      </label>
                      <input
                        type="text"
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                        className="w-full bg-[#111] border border-[#333] px-4 py-3 text-white focus:outline-none focus:border-[#00FF99]"
                        placeholder="design, tech, marketing"
                      />
                    </div>

                    {/* Excerpt */}
                    <div>
                      <label className="block text-xs text-[#888] mb-2">EXCERPT</label>
                      <textarea
                        value={formData.excerpt}
                        onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                        rows={3}
                        className="w-full bg-[#111] border border-[#333] px-4 py-3 text-white focus:outline-none focus:border-[#00FF99] resize-none"
                        placeholder="Brief description of the article..."
                      />
                    </div>

                    {/* Content Editor */}
                    <div>
                      <label className="block text-xs text-[#888] mb-2">CONTENT</label>
                      
                      {/* Toolbar */}
                      <div className="flex gap-1 mb-2 p-2 bg-[#111] border border-[#333] border-b-0">
                        <button
                          onClick={() => insertFormat('heading')}
                          className="p-2 hover:bg-[#222] transition-colors"
                          title="Heading"
                        >
                          <Heading className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => insertFormat('bold')}
                          className="p-2 hover:bg-[#222] transition-colors"
                          title="Bold"
                        >
                          <Bold className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => insertFormat('italic')}
                          className="p-2 hover:bg-[#222] transition-colors"
                          title="Italic"
                        >
                          <Italic className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => insertFormat('list')}
                          className="p-2 hover:bg-[#222] transition-colors"
                          title="List"
                        >
                          <List className="w-4 h-4" />
                        </button>
                        <div className="w-px bg-[#333] mx-1" />
                        <button
                          onClick={() => {
                            setInsertTarget('content');
                            setShowImagePicker(true);
                          }}
                          className="p-2 hover:bg-[#222] transition-colors flex items-center gap-1"
                          title="Insert Image"
                        >
                          <ImageIcon className="w-4 h-4" />
                          <span className="text-xs">圖片</span>
                        </button>
                        <button
                          onClick={() => setShowYoutubeModal(true)}
                          className="p-2 hover:bg-[#222] transition-colors flex items-center gap-1"
                          title="Insert YouTube"
                        >
                          <Youtube className="w-4 h-4 text-red-500" />
                          <span className="text-xs">YouTube</span>
                        </button>
                      </div>
                      
                      <textarea
                        ref={contentRef}
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        rows={20}
                        className="w-full bg-[#111] border border-[#333] px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-[#00FF99] resize-none"
                        placeholder="Write your article content here..."
                      />
                      <p className="text-[10px] text-[#555] mt-2">
                        Tip: 使用 ## 標題、**粗體**、*斜體*、- 列表、![alt](url) 圖片、[youtube:VIDEO_ID] YouTube 影片
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : selectedArticle ? (
              <motion.div
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-6"
              >
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedArticle(null)}
                        className="flex items-center gap-1 px-3 py-2 border border-[#333] text-sm text-[#888] hover:border-[#00FF99] hover:text-[#00FF99] transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        BACK
                      </button>
                      <h2 className="text-lg font-bold">ARTICLE PREVIEW</h2>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleStatus(selectedArticle)}
                        className={`px-4 py-2 text-sm border transition-colors ${
                          selectedArticle.status === 'published'
                            ? 'border-[#00FF99] text-[#00FF99]'
                            : selectedArticle.status === 'booking'
                            ? 'border-yellow-500 text-yellow-500'
                            : 'border-[#333] text-[#888] hover:border-[#555]'
                        }`}
                      >
                        {selectedArticle.status === 'published' ? 'UNPUBLISH' : selectedArticle.status === 'booking' ? 'BOOKED' : 'PUBLISH NOW'}
                      </button>
                      <button
                        onClick={() => handleEdit(selectedArticle)}
                        className="flex items-center gap-1 px-4 py-2 border border-[#333] text-sm hover:border-[#555] transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                        EDIT
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(selectedArticle.id)}
                        className="flex items-center gap-1 px-4 py-2 border border-red-500/50 text-red-500 text-sm hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        DELETE
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#0A0A0A] border border-[#222]">
                    <div className="aspect-video overflow-hidden">
                      <img 
                        src={selectedArticle.image} 
                        alt={selectedArticle.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-6">
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span 
                          className="px-2 py-0.5 text-[10px]"
                          style={{ backgroundColor: getCategoryColor(selectedArticle.categoryId), color: '#000' }}
                        >
                          {getCategoryName(selectedArticle.categoryId)}
                        </span>
                        <span className="text-xs text-[#555]">{selectedArticle.date}</span>
                        <span className={`text-xs ${selectedArticle.status === 'published' ? 'text-[#00FF99]' : selectedArticle.status === 'booking' ? 'text-yellow-500' : 'text-[#888]'}`}>
                          {selectedArticle.status === 'published' ? '● Published' : selectedArticle.status === 'booking' ? `[${formatBookingTime(selectedArticle.scheduledAt)}]` : '○ Draft'}
                        </span>
                      </div>
                      <h1 className="text-2xl font-bold text-white mb-4">{selectedArticle.title}</h1>
                      <p className="text-[#888] mb-4">{selectedArticle.excerpt}</p>
                      <div className="flex gap-2 mb-6">
                        {selectedArticle.tags?.map((tag, i) => (
                          <span key={i} className="text-xs text-[#555]">#{tag}</span>
                        ))}
                      </div>
                      <div className="border-t border-[#222] pt-6">
                        <ArticleContentPreview content={selectedArticle.content} />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex items-center justify-center"
              >
                <div className="text-center">
                  <FileText className="w-16 h-16 text-[#333] mx-auto mb-4" />
                  <p className="text-[#555] mb-6">SELECT AN ARTICLE TO PREVIEW</p>
                  <div className="flex flex-col gap-3 max-w-xs mx-auto">
                    <button
                      onClick={handleNew}
                      className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-[#00FF99] text-[#00FF99] text-sm font-bold tracking-wider hover:bg-[#00FF99] hover:text-black transition-all duration-200 group"
                    >
                      <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
                      CREATE NEW ARTICLE
                    </button>
                    <Link
                      href="/admin/blog/ai-editor"
                      className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-[#FF00FF] text-[#FF00FF] text-sm font-bold tracking-wider hover:bg-[#FF00FF] hover:text-black transition-all duration-200 group"
                    >
                      <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                      CREATE BY AI
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Image Picker Modal */}
      <AnimatePresence>
        {showImagePicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setShowImagePicker(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-[#111] border border-[#333] p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">
                  {insertTarget === 'cover' ? 'SELECT COVER IMAGE' : 'INSERT IMAGE'}
                </h3>
                <button onClick={() => setShowImagePicker(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6">
                <h4 className="text-sm text-[#888] mb-3">AI 圖庫</h4>
                {galleryLoading ? (
                  <div className="flex items-center gap-2 text-xs text-[#555]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    載入中...
                  </div>
                ) : galleryImages.length > 0 ? (
                  <div className="grid grid-cols-4 gap-3">
                    {galleryImages.map(img => (
                      <div key={img.id} className="relative group">
                        <img
                          src={img.imageUrl}
                          alt={img.prompt || 'gallery'}
                          className="w-full aspect-square object-cover cursor-pointer border border-[#333] hover:border-[#00FF99] transition-colors"
                          onClick={() => insertImageToContent(img.imageUrl)}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#555]">目前沒有 AI 圖庫圖片</p>
                )}
              </div>
              
              <div className="mb-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="flex items-center justify-center gap-2 p-8 border-2 border-dashed border-[#333] hover:border-[#00FF99] cursor-pointer transition-colors"
                >
                  <Upload className="w-6 h-6" />
                  <span>點擊上傳圖片或拖放檔案</span>
                </label>
              </div>
              
              {uploadedImages.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm text-[#888] mb-3">已上傳的圖片</h4>
                  <div className="grid grid-cols-4 gap-3">
                    {uploadedImages.map(img => (
                      <div key={img.id} className="relative group">
                        <img
                          src={img.data}
                          alt={img.name}
                          className="w-full aspect-square object-cover cursor-pointer border border-[#333] hover:border-[#00FF99] transition-colors"
                          onClick={() => insertImageToContent(img.data)}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteUploadedImage(img.id);
                          }}
                          className="absolute top-1 right-1 p-1 bg-red-500/80 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <h4 className="text-sm text-[#888] mb-3">預設圖片</h4>
                <div className="grid grid-cols-4 gap-3">
                  {defaultImages.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt={`Default ${i + 1}`}
                      className="w-full aspect-square object-cover cursor-pointer border border-[#333] hover:border-[#00FF99] transition-colors"
                      onClick={() => insertImageToContent(img)}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* YouTube Modal */}
      <AnimatePresence>
        {showYoutubeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setShowYoutubeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-[#111] border border-[#333] p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Youtube className="w-5 h-5 text-red-500" />
                  INSERT YOUTUBE VIDEO
                </h3>
                <button onClick={() => setShowYoutubeModal(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <input
                type="text"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full bg-[#0A0A0A] border border-[#333] px-4 py-3 text-white focus:outline-none focus:border-[#00FF99] mb-4"
              />
              
              {getYoutubeId(youtubeUrl) && (
                <div className="mb-4">
                  <p className="text-xs text-[#555] mb-2">PREVIEW</p>
                  <div className="aspect-video">
                    <iframe
                      src={`https://www.youtube.com/embed/${getYoutubeId(youtubeUrl)}`}
                      className="w-full h-full"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowYoutubeModal(false)}
                  className="px-4 py-2 border border-[#333] text-sm hover:border-[#555] transition-colors"
                >
                  CANCEL
                </button>
                <button
                  onClick={insertYoutube}
                  disabled={!getYoutubeId(youtubeUrl)}
                  className="px-4 py-2 bg-[#00FF99] text-black text-sm font-bold hover:bg-[#00CC7A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  INSERT
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-[#111] border border-[#333] p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-2">DELETE ARTICLE?</h3>
              <p className="text-sm text-[#888] mb-6">
                This action cannot be undone. The article will be permanently removed.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 border border-[#333] text-sm hover:border-[#555] transition-colors"
                >
                  CANCEL
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="px-4 py-2 bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors"
                >
                  DELETE
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ArticleContentPreview({ content }) {
  if (!content) return null;

  const hasHtmlContent = (content.includes('<div') || content.includes('<img'));
  if (hasHtmlContent) {
    return (
      <div className="prose prose-invert max-w-none">
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    );
  }
  
  const lines = content.split('\n');
  
  return (
    <div className="prose prose-invert max-w-none">
      {lines.map((line, index) => {
        const youtubeMatch = line.match(/\[youtube:([a-zA-Z0-9_-]+)\]/);
        if (youtubeMatch) {
          return (
            <div key={index} className="my-4 aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${youtubeMatch[1]}`}
                className="w-full h-full"
                allowFullScreen
              />
            </div>
          );
        }
        
        const imageMatch = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
        if (imageMatch) {
          return (
            <div key={index} className="my-4">
              <img 
                src={imageMatch[2]} 
                alt={imageMatch[1]} 
                className="max-w-full h-auto"
              />
              {imageMatch[1] && (
                <p className="text-xs text-[#555] mt-1">{imageMatch[1]}</p>
              )}
            </div>
          );
        }
        
        if (line.startsWith('## ')) {
          return (
            <h2 key={index} className="text-xl font-bold text-white mt-6 mb-3">
              {line.substring(3)}
            </h2>
          );
        }
        
        if (line.startsWith('- ')) {
          return (
            <li key={index} className="text-[#888] ml-4">
              {line.substring(2)}
            </li>
          );
        }
        
        let text = line;
        text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        
        if (!line.trim()) {
          return <br key={index} />;
        }
        
        return (
          <p 
            key={index} 
            className="text-[#888] mb-2"
            dangerouslySetInnerHTML={{ __html: text }}
          />
        );
      })}
    </div>
  );
}

// 主頁面組件，包裝 AuthGuard 保護
export default function BlogAdminPage() {
  return (
    <AuthGuard>
      <BlogAdminContent />
    </AuthGuard>
  );
}
