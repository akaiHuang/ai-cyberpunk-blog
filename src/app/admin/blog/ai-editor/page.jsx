'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Send, Pin, PinOff, Sparkles, Trash2, Edit2,
  Image as ImageIcon, Eye, ChevronRight, X, ChevronUp, ChevronDown,
  FileText, Loader2, RefreshCw, History, Plus, Download, Upload,
  Wand2, MessageSquare, Clock, Layers, Type, Copy, Check, Zap,
  GripVertical, LayoutGrid, LayoutList, Palette, FolderOpen,
  AlignLeft, AlignCenter, AlignRight, Columns
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useChat } from '@ai-sdk/react';
import ReactMarkdown from 'react-markdown';
import AuthGuard from '@/components/AuthGuard';
import { BLOG_CATEGORIES } from '@/data/blogData';
import ImageGalleryModal from '@/components/ImageGalleryModal';
import StyleLibraryModal from '@/components/StyleLibraryModal';
import { saveImageAsync } from '@/lib/imageGallery';
import { getAllStyles, STYLE_TYPES } from '@/lib/styleLibrary';

// 靈感卡片類型
const CARD_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
};

// LocalStorage Keys
const STORAGE_KEYS = {
  AI_HISTORY: 'botlog_ai_history',
};

function AIEditorContent() {
  const router = useRouter();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const imageInputRef = useRef(null);
  
  // 創作白板狀態
  const [pinnedCards, setPinnedCards] = useState([]);
  const [showCanvas, setShowCanvas] = useState(true);
  const [editingCardId, setEditingCardId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [expandedCardId, setExpandedCardId] = useState(null);
  
  // 歷史紀錄狀態
  const [showHistory, setShowHistory] = useState(false);
  const [aiHistory, setAiHistory] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  
  // 圖片工具狀態
  const [showImageTool, setShowImageTool] = useState(false);
  const [selectedCardForImage, setSelectedCardForImage] = useState(null);
  const [imagePrompt, setImagePrompt] = useState('');
  const [referenceImage, setReferenceImage] = useState(null);
  const [analyzingCard, setAnalyzingCard] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [imageSuggestion, setImageSuggestion] = useState(null);
  const [promptOptions, setPromptOptions] = useState([]);
  const [selectedPromptIndex, setSelectedPromptIndex] = useState(0);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  
  // 新功能: 場景化配圖（將段落拆分成多個場景，每個場景配一張圖）
  const [scenes, setScenes] = useState([]); // [{sceneIndex, originalText, promptSuggestions, generatedImage}]
  const [globalStyle, setGlobalStyle] = useState('童話插畫'); // 全局風格選擇
  const [coverImageSuggestion, setCoverImageSuggestion] = useState(null); // 封面圖建議
  
  // Input state (managed separately in AI SDK v6)
  const [inputValue, setInputValue] = useState('');

  // 新功能: 圖庫和風格庫
  const [showGallery, setShowGallery] = useState(false);
  const [showStyleLibrary, setShowStyleLibrary] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState(null);
  
  // 新功能: 編輯時插入圖片
  const [insertImageForCardId, setInsertImageForCardId] = useState(null);

  // 新功能: 卡片 Layout 配置
  const [cardLayouts, setCardLayouts] = useState({}); // { cardId: 'left' | 'right' | 'center' | 'full' }

  // 新功能: 拖拉排序
  const [draggedCardId, setDraggedCardId] = useState(null);
  const [dragOverCardId, setDragOverCardId] = useState(null);

  // 新功能: 整篇文章圖片分析
  const [showArticleAnalysis, setShowArticleAnalysis] = useState(false);
  const [articleAnalysis, setArticleAnalysis] = useState(null);
  const [analyzingArticle, setAnalyzingArticle] = useState(false);
  const [generatingForParagraph, setGeneratingForParagraph] = useState(null);

  const selectedCardIndex = selectedCardForImage
    ? pinnedCards.findIndex(c => c.id === selectedCardForImage.id)
    : -1;
  const selectedCardSnippet = selectedCardForImage?.content
    ? selectedCardForImage.content.replace(/\s+/g, ' ').trim().slice(0, 120)
    : '';

  // AI Chat - AI SDK v6 API
  const { messages, sendMessage, status, error, setMessages } = useChat({
    api: '/api/chat',
    onError: (err) => {
      console.error('Chat error:', err);
    },
  });
  
  const isLoading = status === 'streaming' || status === 'submitted';

  // Helper: 提取訊息內容 (AI SDK v6 使用 parts 結構)
  const getMessageContent = (message) => {
    if (message.parts && Array.isArray(message.parts)) {
      return message.parts
        .filter(part => part.type === 'text')
        .map(part => part.text)
        .join('');
    }
    return message.content || '';
  };

  // 載入歷史紀錄
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.AI_HISTORY);
      if (stored) {
        setAiHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load AI history:', e);
    }
  }, []);

  // 自動儲存當前對話
  useEffect(() => {
    if (messages.length > 0) {
      saveCurrentSession();
    }
  }, [messages, pinnedCards]);

  // 自動捲動到最新訊息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 儲存當前對話
  const saveCurrentSession = () => {
    if (messages.length === 0) return;
    
    const sessionId = currentSessionId || `session-${Date.now()}`;
    if (!currentSessionId) {
      setCurrentSessionId(sessionId);
    }
    
    const firstUserMessage = messages.find(m => m.role === 'user');
    const title = firstUserMessage 
      ? getMessageContent(firstUserMessage).substring(0, 50) + '...'
      : '新對話';
    
    const canvasForHistory = pinnedCards.map(card => ({
      ...card,
      image: null,
      imagePrompt: null,
      images: [],
    }));

    const session = {
      id: sessionId,
      title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: messages.map(m => ({
        id: m.id,
        role: m.role,
        content: getMessageContent(m),
      })),
      canvas: canvasForHistory,
    };
    
    setAiHistory(prev => {
      const existing = prev.findIndex(h => h.id === sessionId);
      let updated;
      if (existing >= 0) {
        updated = [...prev];
        updated[existing] = session;
      } else {
        updated = [session, ...prev];
      }
      // 最多保留 20 筆
      updated = updated.slice(0, 20);
      
      // 安全儲存到 localStorage，處理配額超出錯誤
      try {
        localStorage.setItem(STORAGE_KEYS.AI_HISTORY, JSON.stringify(updated));
      } catch (e) {
        if (e.name === 'QuotaExceededError' || e.code === 22) {
          console.warn('localStorage quota exceeded, cleaning up old data...');
          // 嘗試清理：只保留最新 10 筆並移除 canvas 圖片
          const trimmed = updated.slice(0, 10).map(session => ({
            ...session,
            canvas: session.canvas?.map(card => ({
              ...card,
              image: null, // 移除圖片以節省空間
              imagePrompt: null,
              images: [],
            })) || [],
          }));
          try {
            localStorage.setItem(STORAGE_KEYS.AI_HISTORY, JSON.stringify(trimmed));
          } catch (e2) {
            // 如果還是失敗，清空歷史
            console.error('Still exceeds quota, clearing history');
            localStorage.removeItem(STORAGE_KEYS.AI_HISTORY);
          }
        }
      }
      return updated;
    });
  };

  // 載入歷史對話
  const loadSession = (session) => {
    // 轉換訊息格式以供 useChat 使用
    const loadedMessages = session.messages.map(m => ({
      id: m.id,
      role: m.role,
      content: m.content,
    }));
    
    setMessages(loadedMessages);
    setPinnedCards(session.canvas || []);
    setCurrentSessionId(session.id);
    setShowHistory(false);
  };

  // 開始新對話
  const startNewSession = () => {
    // 先儲存當前對話
    if (messages.length > 0) {
      saveCurrentSession();
    }
    
    setMessages([]);
    setPinnedCards([]);
    setCurrentSessionId(null);
    setShowHistory(false);
  };

  // 刪除歷史紀錄
  const deleteSession = (sessionId, e) => {
    e.stopPropagation();
    setAiHistory(prev => {
      const updated = prev.filter(h => h.id !== sessionId);
      try {
        localStorage.setItem(STORAGE_KEYS.AI_HISTORY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save after delete:', e);
      }
      return updated;
    });
  };

  // Pin 訊息到創作白板
  const handlePin = (message) => {
    const content = getMessageContent(message);
    const newCard = {
      id: `card-${Date.now()}`,
      type: CARD_TYPES.TEXT,
      content: content,
      createdAt: new Date().toISOString(),
      image: null,
      imagePrompt: null,
    };
    setPinnedCards(prev => [...prev, newCard]);
  };

  // 檢查訊息是否已被 Pin
  const isPinned = (messageId) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return false;
    const content = getMessageContent(message);
    return pinnedCards.some(card => card.content === content);
  };

  // 刪除卡片
  const handleDeleteCard = (cardId) => {
    setPinnedCards(prev => prev.filter(card => card.id !== cardId));
  };

  // 編輯卡片 - 同時展開卡片
  const handleEditCard = (card) => {
    setEditingCardId(card.id);
    setEditingContent(card.content);
    setExpandedCardId(card.id); // 編輯時保持展開
  };

  // 儲存編輯
  const handleSaveEdit = () => {
    setPinnedCards(prev => prev.map(card => 
      card.id === editingCardId 
        ? { ...card, content: editingContent }
        : card
    ));
    setEditingCardId(null);
    setEditingContent('');
    // 儲存後保持展開
  };

  // 移動卡片
  const moveCard = (cardId, direction) => {
    setPinnedCards(prev => {
      const index = prev.findIndex(c => c.id === cardId);
      if ((direction === 'up' && index === 0) || (direction === 'down' && index === prev.length - 1)) {
        return prev;
      }
      const newCards = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      [newCards[index], newCards[targetIndex]] = [newCards[targetIndex], newCards[index]];
      return newCards;
    });
  };

  // 複製卡片
  const duplicateCard = (card) => {
    const newCard = {
      ...card,
      id: `card-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setPinnedCards(prev => {
      const index = prev.findIndex(c => c.id === card.id);
      return [...prev.slice(0, index + 1), newCard, ...prev.slice(index + 1)];
    });
  };

  // 新增空白卡片
  const addEmptyCard = () => {
    const newCard = {
      id: `card-${Date.now()}`,
      type: CARD_TYPES.TEXT,
      content: '',
      createdAt: new Date().toISOString(),
      image: null,
      imagePrompt: null,
    };
    setPinnedCards(prev => [...prev, newCard]);
    setEditingCardId(newCard.id);
    setEditingContent('');
  };

  // 開啟圖片工具 - 如果已有分析結果則載入
  const openImageTool = (card) => {
    setSelectedCardForImage(card);
    setImagePrompt(card.imagePrompt || '');
    setReferenceImage(card.referenceImage || null); // 載入已有的參考圖
    setImageSuggestion(null);
    setPromptOptions([]);
    
    // 如果卡片已有場景分析結果，載入它們
    if (card.scenes && card.scenes.length > 0) {
      setScenes(card.scenes);
      setCoverImageSuggestion(card.coverImageSuggestion || null);
    } else {
      setScenes([]);
      setCoverImageSuggestion(null);
    }
    
    setSelectedPromptIndex(0);
    setShowImageTool(true);
  };

  // 上傳參考圖片
  const handleReferenceImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setReferenceImage(ev.target?.result);
      reader.readAsDataURL(file);
    }
  };

  // 解析多個 Prompt 選項
  const parsePromptOptions = (suggestion) => {
    const options = [];
    
    // 分割 Prompt 區塊 (### Prompt N: ...)
    const promptBlocks = suggestion.split(/###\s*Prompt\s*\d+[\s:：]*/i).slice(1);
    
    promptBlocks.forEach((block, idx) => {
      // 提取風格名稱 - 支援多種格式:
      // 1. **風格名稱** (帶星號)
      // 2. [風格名稱] (帶方括號) 
      // 3. 風格名稱 (純文字)
      let style = `風格 ${idx + 1}`;
      let styleMatch = block.match(/^\s*\*\*([^*\n]+)\*\*/);
      if (!styleMatch) {
        styleMatch = block.match(/^\s*\[([^\]\n]+)\]/);
      }
      if (!styleMatch) {
        styleMatch = block.match(/^\s*([^\n*\[\]]+)/);
      }
      if (styleMatch) {
        style = styleMatch[1].trim();
      }
      
      // 提取說明 - 支援 **說明**: 或 **說明:** 格式
      const descMatch = block.match(/\*\*說明[\*:：]+[\s]*([^\n]+)/i);
      const description = descMatch ? descMatch[1].replace(/^\*\*\s*/, '').trim() : '';
      
      // 提取 Prompt - 支援多種格式
      let prompt = null;
      
      // 格式 1: **Prompt**: "..." 或 **Prompt:** "..." (帶引號)
      let promptMatch = block.match(/\*\*Prompt[\*:：]+[\s]*[\""\u201C]([^\"\"\u201D]+)[\""\u201D]/i);
      
      // 格式 2: **Prompt**: [內容直到換行或 ###] (不帶引號)
      if (!promptMatch) {
        promptMatch = block.match(/\*\*Prompt[\*:：]+[\s]*([^\n#]+)/i);
      }
      
      if (promptMatch) {
        prompt = promptMatch[1].trim();
      }
      
      if (prompt && prompt.length > 10) {
        options.push({
          id: String(idx + 1),
          style: style.replace(/[\[\]]/g, ''),
          description,
          prompt,
        });
      }
    });
    
    // 備選方案: 如果上述方法沒有匹配到，直接提取所有 **Prompt**: ... 
    if (options.length === 0) {
      const promptRegex = /\*\*Prompt[\*:：]+[\s]*([^\n#]+)/gi;
      let match;
      let idx = 0;
      while ((match = promptRegex.exec(suggestion)) !== null) {
        const p = match[1].replace(/^[\""\u201C]|[\""\u201D]$/g, '').trim();
        if (p.length > 10) {
          options.push({
            id: String(idx + 1),
            style: `選項 ${idx + 1}`,
            description: '',
            prompt: p,
          });
          idx++;
        }
      }
    }
    
    console.log('[parsePromptOptions] Found', options.length, 'options');
    return options;
  };

  // 風格選項列表
  const STYLE_OPTIONS = [
    '童話插畫',
    '水彩插畫',
    '電影劇照',
    '日式動漫',
    '寫實攝影',
    '復古海報',
    '極簡線條',
    '油畫風格',
  ];

  // 分析圖片建議 - 場景化分析（將段落拆分成多個場景，每個場景配一張圖）
  const handleAnalyzeForImage = async () => {
    if (!selectedCardForImage) return;
    setAnalyzingCard(true);
    setScenes([]);
    setPromptOptions([]);
    setCoverImageSuggestion(null);
    
    try {
      const res = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: selectedCardForImage.content,
          style: globalStyle, // 傳送選擇的風格
        }),
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      // 新格式：場景列表
      if (data.scenes && data.scenes.length > 0) {
        const scenesWithState = data.scenes.map((scene, idx) => ({
          ...scene,
          sceneIndex: idx,
          generating: false,
          generatedImage: null,
          editablePrompt: scene.prompt, // 可編輯的 prompt
          referenceImage: null, // 每個場景獨立的參考圖片
        }));
        setScenes(scenesWithState);
        
        // 設置封面圖建議
        if (data.coverImage) {
          setCoverImageSuggestion({
            ...data.coverImage,
            generating: false,
            generatedImage: null,
            editablePrompt: data.coverImage.prompt,
            referenceImage: null, // 封面圖獨立的參考圖片
          });
        }
        
        console.log('[handleAnalyzeForImage] Found', scenesWithState.length, 'scenes');
      } else {
        // 舊格式 fallback
        setImageSuggestion(data.suggestion);
        const options = parsePromptOptions(data.suggestion);
        setPromptOptions(options);
        setSelectedPromptIndex(0);
        if (options.length > 0) {
          setImagePrompt(options[0].prompt);
        }
      }
    } catch (err) {
      console.error('Analyze error:', err);
      alert('分析失敗: ' + err.message);
    } finally {
      setAnalyzingCard(false);
    }
  };
  
  // 為指定場景生成圖片（只影響該場景的 loading 狀態）
  const handleGenerateForScene = async (sceneIndex, prompt) => {
    // 只設置當前場景為 generating
    setScenes(prev => prev.map((s, i) => 
      i === sceneIndex ? { ...s, generating: true } : s
    ));
    
    try {
      const scene = scenes[sceneIndex];
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt,
          cardContent: scene.originalText,
          // 優先使用場景自己的參考圖片，其次使用全局參考圖片
          referenceImage: scene.referenceImage || referenceImage,
        }),
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      // 儲存到圖庫
      const savedImage = await saveImageAsync({
        imageUrl: data.imageUrl,
        prompt: prompt,
        cardContent: scene.originalText?.substring(0, 100) || '',
        category: 'ai-generated',
      });
      const finalUrl = savedImage?.imageUrl || data.imageUrl;
      
      // 只更新當前場景狀態
      setScenes(prev => prev.map((s, i) => 
        i === sceneIndex ? { ...s, generatedImage: finalUrl, generating: false, editablePrompt: prompt } : s
      ));
    } catch (err) {
      console.error('Generate error:', err);
      alert('圖片生成失敗: ' + err.message);
      setScenes(prev => prev.map((s, i) => 
        i === sceneIndex ? { ...s, generating: false } : s
      ));
    }
  };

  // 生成封面圖片
  const handleGenerateCoverImage = async () => {
    if (!coverImageSuggestion) return;
    
    setCoverImageSuggestion(prev => ({ ...prev, generating: true }));
    
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: coverImageSuggestion.editablePrompt || coverImageSuggestion.prompt,
          cardContent: selectedCardForImage?.content || '',
          // 優先使用封面自己的參考圖片，其次使用全局參考圖片
          referenceImage: coverImageSuggestion.referenceImage || referenceImage,
        }),
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      const savedImage = await saveImageAsync({
        imageUrl: data.imageUrl,
        prompt: coverImageSuggestion.editablePrompt || coverImageSuggestion.prompt,
        cardContent: 'cover-image',
        category: 'cover',
      });
      const finalUrl = savedImage?.imageUrl || data.imageUrl;
      
      setCoverImageSuggestion(prev => ({ 
        ...prev, 
        generatedImage: finalUrl, 
        generating: false 
      }));
    } catch (err) {
      console.error('Generate cover error:', err);
      alert('封面圖生成失敗: ' + err.message);
      setCoverImageSuggestion(prev => ({ ...prev, generating: false }));
    }
  };

  // 選擇 Prompt 選項
  const selectPromptOption = (option, index) => {
    setImagePrompt(option.prompt);
    setSelectedPromptIndex(index);
  };

  // 生成圖片 (含自動儲存到圖庫)
  const handleGenerateImage = async () => {
    if (!selectedCardForImage || !imagePrompt.trim()) {
      alert('請先輸入圖片 Prompt');
      return;
    }

    setGeneratingImage(true);

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imagePrompt,
          cardContent: selectedCardForImage.content,
          referenceImage: referenceImage,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // 自動儲存到圖庫（回寫 URL）
      const saved = await saveImageAsync({
        imageUrl: data.imageUrl,
        prompt: imagePrompt,
        cardContent: selectedCardForImage.content,
        category: 'illustration',
      });
      const finalUrl = saved?.imageUrl || data.imageUrl;

      // 更新卡片（支援多圖）
      setPinnedCards(prev => prev.map(c => {
        if (c.id !== selectedCardForImage.id) return c;
        const existingImages = c.images || [];
        if (existingImages.length === 0 && c.image) {
          existingImages.push({ url: c.image, prompt: c.imagePrompt || '' });
        }
        return {
          ...c,
          images: [...existingImages, { url: finalUrl, prompt: imagePrompt }],
          image: c.image || finalUrl,
          imagePrompt: c.imagePrompt || imagePrompt,
        };
      }));

      setShowImageTool(false);
    } catch (err) {
      console.error('Generate error:', err);
      alert('圖片生成失敗: ' + err.message);
    } finally {
      setGeneratingImage(false);
    }
  };

  // 從圖庫選擇圖片 - 支援多圖
  const handleSelectFromGallery = (galleryImage) => {
    // 如果是從編輯模式插入圖片
    if (insertImageForCardId) {
      setPinnedCards(prev => prev.map(c => {
        if (c.id !== insertImageForCardId) return c;
        // 新增到圖片陣列
        const existingImages = c.images || [];
        // 如果還沒有 images 陣列，把舊的 image 也加進去
        if (existingImages.length === 0 && c.image) {
          existingImages.push({ url: c.image, prompt: c.imagePrompt || '' });
        }
        return {
          ...c,
          images: [...existingImages, { url: galleryImage.imageUrl, prompt: galleryImage.prompt }],
          image: c.image || galleryImage.imageUrl, // 保留第一張作為封面
          imagePrompt: c.imagePrompt || galleryImage.prompt,
        };
      }));
      setInsertImageForCardId(null);
    }
    // 如果是從 Image Tool 選擇
    else if (selectedCardForImage) {
      setPinnedCards(prev => prev.map(c => {
        if (c.id !== selectedCardForImage.id) return c;
        const existingImages = c.images || [];
        if (existingImages.length === 0 && c.image) {
          existingImages.push({ url: c.image, prompt: c.imagePrompt || '' });
        }
        return {
          ...c,
          images: [...existingImages, { url: galleryImage.imageUrl, prompt: galleryImage.prompt }],
          image: c.image || galleryImage.imageUrl,
          imagePrompt: c.imagePrompt || galleryImage.prompt,
        };
      }));
    }
    setShowGallery(false);
  };

  // 從卡片移除指定圖片
  const removeImageFromCard = (cardId, imageIndex) => {
    setPinnedCards(prev => prev.map(c => {
      if (c.id !== cardId) return c;
      const images = [...(c.images || [])];
      images.splice(imageIndex, 1);
      return {
        ...c,
        images,
        image: images.length > 0 ? images[0].url : null,
        imagePrompt: images.length > 0 ? images[0].prompt : null,
      };
    }));
  };

  // 開啟圖庫選擇圖片（用於編輯時插入）
  const openGalleryForCard = (cardId) => {
    setInsertImageForCardId(cardId);
    setShowGallery(true);
  };

  // 設定卡片 Layout
  const setCardLayout = (cardId, layout) => {
    setCardLayouts(prev => ({ ...prev, [cardId]: layout }));
  };

  // 拖拉排序處理
  const handleDragStart = (e, cardId) => {
    setDraggedCardId(cardId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, cardId) => {
    e.preventDefault();
    if (draggedCardId && draggedCardId !== cardId) {
      setDragOverCardId(cardId);
    }
  };

  const handleDragLeave = () => {
    setDragOverCardId(null);
  };

  const handleDrop = (e, targetCardId) => {
    e.preventDefault();
    if (!draggedCardId || draggedCardId === targetCardId) return;

    setPinnedCards(prev => {
      const cards = [...prev];
      const draggedIndex = cards.findIndex(c => c.id === draggedCardId);
      const targetIndex = cards.findIndex(c => c.id === targetCardId);

      if (draggedIndex === -1 || targetIndex === -1) return prev;

      const [draggedCard] = cards.splice(draggedIndex, 1);
      cards.splice(targetIndex, 0, draggedCard);

      return cards;
    });

    setDraggedCardId(null);
    setDragOverCardId(null);
  };

  const handleDragEnd = () => {
    setDraggedCardId(null);
    setDragOverCardId(null);
  };

  // 分析整篇文章，找出適合插圖的段落
  const handleAnalyzeArticle = async () => {
    if (pinnedCards.length === 0) {
      alert('請先新增一些內容卡片');
      return;
    }

    setAnalyzingArticle(true);
    setArticleAnalysis(null);

    try {
      const res = await fetch('/api/analyze-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cards: pinnedCards.map(c => ({ 
            id: c.id, 
            content: c.content 
          })) 
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setArticleAnalysis(data.analysis);
      setShowArticleAnalysis(true);
    } catch (err) {
      console.error('Article analysis error:', err);
      alert('文章分析失敗: ' + err.message);
    } finally {
      setAnalyzingArticle(false);
    }
  };

  // 為指定段落生成圖片
  const handleGenerateForParagraph = async (paragraphIndex, prompt) => {
    if (paragraphIndex < 0 || paragraphIndex >= pinnedCards.length) {
      alert('段落索引無效');
      return;
    }

    setGeneratingForParagraph(paragraphIndex);

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt,
          cardContent: pinnedCards[paragraphIndex].content,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // 儲存到圖庫
      const saved = await saveImageAsync({
        imageUrl: data.imageUrl,
        prompt: prompt,
        cardContent: pinnedCards[paragraphIndex].content?.substring(0, 100) || '',
        category: 'ai-generated',
      });
      const finalUrl = saved?.imageUrl || data.imageUrl;

      // 更新對應卡片的圖片
      setPinnedCards(prev => prev.map((card, idx) => {
        if (idx !== paragraphIndex) return card;
        const existingImages = card.images || [];
        if (existingImages.length === 0 && card.image) {
          existingImages.push({ url: card.image, prompt: card.imagePrompt || '' });
        }
        return {
          ...card,
          images: [...existingImages, { url: finalUrl, prompt }],
          image: card.image || finalUrl,
          imagePrompt: card.imagePrompt || prompt,
        };
      }));

      // 更新分析結果，標記已生成
      setArticleAnalysis(prev => ({
        ...prev,
        imagePlacements: prev.imagePlacements.map(p => 
          p.paragraphIndex === paragraphIndex 
            ? { ...p, generated: true, generatedUrl: finalUrl }
            : p
        ),
      }));

    } catch (err) {
      console.error('Generate error:', err);
      alert('圖片生成失敗: ' + err.message);
    } finally {
      setGeneratingForParagraph(null);
    }
  };

  // 複製 Prompt 到剪貼簿
  const copyPromptToClipboard = () => {
    navigator.clipboard.writeText(imagePrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  // 預覽發布 - 組裝文章 (支援 Layout 配置)
  const handlePreviewPublish = async () => {
    if (pinnedCards.length === 0) {
      alert('請先 Pin 一些內容到創作白板');
      return;
    }

    // 儲存當前對話
    saveCurrentSession();

    const firstCard = pinnedCards[0];
    const firstImageCard = pinnedCards.find(c => c.image || (c.images && c.images.length > 0));

    const titleMatch = firstCard.content.match(/^#?\s*(.+?)(?:\n|$)/);
    const title = titleMatch ? titleMatch[1].replace(/^#+\s*/, '').trim() : '未命名文章';

    // 收集所有圖片並儲存到圖庫，回寫為可用 URL
    const resolvedCards = await Promise.all(
      pinnedCards.map(async (card) => {
        const allImages = card.images || (card.image ? [{ url: card.image, prompt: card.imagePrompt }] : []);
        const resolvedImages = await Promise.all(
          allImages.map(async (img) => {
            if (img.url && img.url.startsWith('data:')) {
              const saved = await saveImageAsync({
                imageUrl: img.url,
                prompt: img.prompt || '從文章生成',
                cardContent: card.content?.substring(0, 100) || '',
                category: 'ai-generated',
              });
              return {
                ...img,
                url: saved?.imageUrl || img.url,
              };
            }
            return img;
          })
        );

        const primaryImage = resolvedImages[0]?.url || card.image;
        const primaryPrompt = resolvedImages[0]?.prompt || card.imagePrompt;

        return {
          ...card,
          images: resolvedImages.length > 0 ? resolvedImages : card.images,
          image: primaryImage,
          imagePrompt: primaryPrompt,
        };
      })
    );

    // 根據 Layout 配置組裝內容 - 支援多圖 + 場景化配圖
    const content = resolvedCards
      .map((card, idx) => {
        const layout = cardLayouts[card.id] || 'full';
        let text = card.content;
        const allImages = card.images || (card.image ? [{ url: card.image, prompt: card.imagePrompt }] : []);
        
        if (allImages.length > 0) {
          // 檢查是否有場景化配圖（帶有 originalText）
          const sceneImages = allImages.filter(img => img.originalText);
          const regularImages = allImages.filter(img => !img.originalText);
          
          // 如果有場景化配圖，將圖片插入到對應原文後面
          if (sceneImages.length > 0) {
            // 按 sceneIndex 排序（從後往前插入，避免位置錯亂）
            const sortedSceneImages = [...sceneImages].sort((a, b) => 
              (b.sceneIndex || 0) - (a.sceneIndex || 0)
            );
            
            sortedSceneImages.forEach(img => {
              if (img.originalText && text.includes(img.originalText)) {
                const imgMarkdown = `\n\n![配圖](${img.url})\n\n`;
                text = text.replace(
                  img.originalText, 
                  img.originalText + imgMarkdown
                );
              }
            });
            
            // 普通圖片放在最後
            if (regularImages.length > 0) {
              const regularImagesHtml = regularImages.map((img, imgIdx) => {
                const imgAlt = `文章配圖-${idx + 1}-${imgIdx + 1}`;
                return `![${imgAlt}](${img.url})`;
              }).join('\n\n');
              text = `${text}\n\n${regularImagesHtml}`;
            }
          } else {
            // 沒有場景化配圖，使用原本的 layout 邏輯
            const imagesHtml = allImages.map((img, imgIdx) => {
              const imgAlt = `文章配圖-${idx + 1}-${imgIdx + 1}`;
              return `![${imgAlt}](${img.url})`;
            }).join('\n\n');
            
            switch (layout) {
              case 'left':
                text = `<div class="flex flex-col md:flex-row gap-4 items-start">\n<div class="w-full md:w-1/2 space-y-4">\n${allImages.map((img, i) => `<img src="${img.url}" alt="配圖-${i+1}" class="w-full object-cover rounded" />`).join('\n')}\n</div>\n<div class="flex-1">\n\n${text}\n\n</div>\n</div>`;
                break;
              case 'right':
                text = `<div class="flex flex-col md:flex-row gap-4 items-start">\n<div class="flex-1">\n\n${text}\n\n</div>\n<div class="w-full md:w-1/2 space-y-4">\n${allImages.map((img, i) => `<img src="${img.url}" alt="配圖-${i+1}" class="w-full object-cover rounded" />`).join('\n')}\n</div>\n</div>`;
                break;
              case 'center':
                text = `<div class="text-center space-y-4 my-6">\n${allImages.map((img, i) => `<img src="${img.url}" alt="配圖-${i+1}" class="mx-auto max-w-lg rounded" />`).join('\n')}\n</div>\n\n${text}`;
                break;
              default:
                // full width - 圖片放在段落之後
                text = `${text}\n\n${imagesHtml}`;
            }
          }
        }
        return text;
      })
      .join('\n\n---\n\n');

    // 取得封面圖
    const resolvedFirstImageCard = resolvedCards.find(c => c.image || (c.images && c.images.length > 0));
    const coverImage = resolvedFirstImageCard?.image || 
               (resolvedFirstImageCard?.images?.[0]?.url) || 
               '/blog/demo_1.png';

    const articleDraft = {
      title,
      excerpt: firstCard.content.substring(0, 100).replace(/[#*_]/g, '') + '...',
      content,
      image: coverImage,
      categoryId: BLOG_CATEGORIES[0]?.id || 'ai-lab',
      tags: ['AI Generated'],
      status: 'draft',
      hasAIImages: true,
    };

    // 嘗試儲存，如果超過限制則移除圖片
    try {
      sessionStorage.setItem('ai_article_draft', JSON.stringify(articleDraft));
    } catch (e) {
      // sessionStorage 超過限制，移除 base64 圖片使用 placeholder
      console.warn('sessionStorage quota exceeded, removing base64 images');
      const cleanedContent = content.replace(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/g, '/blog/demo_1.png');
      articleDraft.content = cleanedContent;
      articleDraft.image = '/blog/demo_1.png';
      articleDraft.hasAIImages = false;
      sessionStorage.setItem('ai_article_draft', JSON.stringify(articleDraft));
      alert('圖片過大，已使用預設圖片。建議將生成的圖片手動上傳到文章中。');
    }

    router.push('/admin/blog?from=ai');
  };

  return (
    <div className="min-h-screen bg-black text-[#EAEAEA] font-mono">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 border-b border-[#222] backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link 
            href="/admin/blog"
            className="flex items-center gap-2 text-sm hover:text-[#00FF99] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            BACK
          </Link>
          
          <div className="flex items-center gap-4">
            {/* History Button */}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`flex items-center gap-2 text-sm transition-colors ${
                showHistory ? 'text-[#FF00FF]' : 'hover:text-[#FF00FF]'
              }`}
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">AI 紀錄</span>
              {aiHistory.length > 0 && (
                <span className="text-xs bg-[#FF00FF]/20 text-[#FF00FF] px-1.5 rounded">
                  {aiHistory.length}
                </span>
              )}
            </button>
            
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#FF00FF]" />
              <span className="text-xs tracking-widest">
                BOTLOG<span className="text-[#FF00FF]">_AI</span>
              </span>
            </div>
          </div>
          
          <button
            onClick={() => setShowCanvas(!showCanvas)}
            className="flex items-center gap-2 text-sm hover:text-[#00FF99] transition-colors"
          >
            {showCanvas ? 'HIDE' : 'SHOW'} CANVAS
            <ChevronRight className={`w-4 h-4 transition-transform ${showCanvas ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </header>

      {/* History Panel */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, x: -320 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -320 }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed left-0 top-14 w-80 h-[calc(100vh-56px)] bg-[#050505] border-r border-[#222] z-40 flex flex-col"
          >
            <div className="p-4 border-b border-[#222]">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <History className="w-4 h-4 text-[#FF00FF]" />
                  AI 對話紀錄
                </h2>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-[#555] hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={startNewSession}
                className="w-full py-2 bg-[#00FF99] text-black text-xs font-bold hover:bg-[#00CC7A] transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-3 h-3" />
                開始新對話
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {aiHistory.length === 0 ? (
                <div className="p-4 text-center text-[#555] text-xs">
                  <Clock className="w-8 h-8 mx-auto mb-3 opacity-50" />
                  <p>尚無對話紀錄</p>
                </div>
              ) : (
                aiHistory.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => loadSession(session)}
                    className={`p-4 border-b border-[#222] cursor-pointer hover:bg-[#111] transition-colors group ${
                      currentSessionId === session.id ? 'bg-[#111] border-l-2 border-l-[#FF00FF]' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-bold truncate mb-1">
                          {session.title}
                        </h3>
                        <div className="flex items-center gap-2 text-[10px] text-[#555]">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {session.messages.length}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {session.canvas?.length || 0}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#444] mt-1">
                          {new Date(session.updatedAt).toLocaleDateString('zh-TW')}
                        </p>
                      </div>
                      <button
                        onClick={(e) => deleteSession(session.id, e)}
                        className="p-1 text-[#333] hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-14 flex h-[calc(100vh-56px)]">
        {/* Chat Area */}
        <div className={`flex-1 flex flex-col transition-all duration-300 ${showCanvas ? 'mr-80 lg:mr-96' : ''} ${showHistory ? 'ml-80' : ''}`}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Welcome Message */}
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl mx-auto text-center py-20"
              >
                <div className="w-20 h-20 mx-auto mb-6 border-2 border-[#FF00FF] flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-[#FF00FF]" />
                </div>
                <h1 className="text-2xl font-bold mb-4">
                  BOTLOG<span className="text-[#FF00FF]">_AI</span>
                </h1>
                <p className="text-[#555] mb-8">
                  我是你的 AI 創作夥伴。告訴我你想寫什麼主題的文章，
                  <br />我會幫你發想內容、組織結構。
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {['寫一篇關於 AI 設計趨勢的文章', '幫我構思一個產品發表會的宣傳文案', '分析 Web3 對創意產業的影響'].map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInputValue(suggestion);
                        inputRef.current?.focus();
                      }}
                      className="px-4 py-2 text-xs border border-[#333] text-[#888] hover:border-[#FF00FF] hover:text-[#FF00FF] transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
                
                {/* 快速載入最近對話 */}
                {aiHistory.length > 0 && (
                  <div className="mt-8 pt-8 border-t border-[#222]">
                    <p className="text-xs text-[#555] mb-4">或繼續之前的對話：</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {aiHistory.slice(0, 3).map((session) => (
                        <button
                          key={session.id}
                          onClick={() => loadSession(session)}
                          className="px-4 py-2 text-xs bg-[#111] border border-[#333] text-[#888] hover:border-[#00FF99] hover:text-[#00FF99] transition-colors flex items-center gap-2"
                        >
                          <History className="w-3 h-3" />
                          {session.title.substring(0, 20)}...
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Chat Messages */}
            {messages.map((message) => {
              const content = getMessageContent(message);
              return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] ${message.role === 'user' ? 'order-1' : ''}`}>
                  {/* Message Bubble */}
                  <div
                    className={`p-4 ${
                      message.role === 'user'
                        ? 'bg-[#00FF99]/10 border border-[#00FF99]/30'
                        : 'bg-[#111] border border-[#222]'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown>{content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm">{content}</p>
                    )}
                  </div>
                  
                  {/* Pin Button (only for assistant) */}
                  {message.role === 'assistant' && (
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={() => handlePin(message)}
                        disabled={isPinned(message.id)}
                        className={`flex items-center gap-1 px-2 py-1 text-xs transition-colors ${
                          isPinned(message.id)
                            ? 'text-[#555] cursor-not-allowed'
                            : 'text-[#888] hover:text-[#FF00FF]'
                        }`}
                      >
                        {isPinned(message.id) ? (
                          <>
                            <PinOff className="w-3 h-3" />
                            PINNED
                          </>
                        ) : (
                          <>
                            <Pin className="w-3 h-3" />
                            PIN TO CANVAS
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )})}

            {/* Loading indicator */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-[#111] border border-[#222] p-4">
                  <div className="flex items-center gap-2 text-[#FF00FF]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-xs">THINKING...</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 p-4 text-red-400 text-sm">
                發生錯誤: {error.message}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-[#222] p-4">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (inputValue.trim() && !isLoading) {
                  sendMessage({ role: 'user', content: inputValue.trim() });
                  setInputValue('');
                }
              }} 
              className="flex gap-2"
            >
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="告訴我你想寫什麼..."
                  className="w-full bg-[#111] border border-[#333] px-4 py-3 text-sm placeholder-[#555] focus:outline-none focus:border-[#FF00FF] transition-colors"
                  disabled={isLoading}
                />
                {/* Corner decorations */}
                <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-[#FF00FF]" />
                <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-[#FF00FF]" />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-[#FF00FF]" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-[#FF00FF]" />
              </div>
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="px-6 py-3 bg-[#FF00FF] text-black font-bold text-sm hover:bg-[#FF00FF]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                SEND
              </button>
            </form>
          </div>
        </div>

        {/* Canvas Tool v1.1 */}
        <AnimatePresence>
          {showCanvas && (
            <motion.aside
              initial={{ x: 384, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 384, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed right-0 top-14 w-80 lg:w-96 h-[calc(100vh-56px)] bg-[#050505] border-l border-[#222] flex flex-col"
            >
              {/* Canvas Header */}
              <div className="p-4 border-b border-[#222]">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#00FF99]" />
                    CANVAS TOOL
                    <span className="text-[10px] text-[#555] font-normal">v2.0</span>
                  </h2>
                  <span className="text-xs text-[#555]">{pinnedCards.length} cards</span>
                </div>
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={addEmptyCard}
                    className="flex-1 py-2 border border-[#333] text-xs text-[#888] hover:border-[#00FF99] hover:text-[#00FF99] transition-colors flex items-center justify-center gap-1"
                  >
                    <Type className="w-3 h-3" />
                    ADD TEXT
                  </button>
                  {pinnedCards.length > 0 && (
                    <button
                      onClick={() => setPinnedCards([])}
                      className="px-3 py-2 border border-[#333] text-xs text-red-500/60 hover:border-red-500 hover:text-red-500 transition-colors"
                    >
                      CLEAR
                    </button>
                  )}
                </div>
                {/* 圖庫和風格庫快捷按鈕 */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowGallery(true)}
                    className="flex-1 py-2 border border-[#333] text-xs text-[#888] hover:border-[#FFD700] hover:text-[#FFD700] transition-colors flex items-center justify-center gap-1"
                  >
                    <FolderOpen className="w-3 h-3" />
                    圖庫
                  </button>
                  <button
                    onClick={() => setShowStyleLibrary(true)}
                    className="flex-1 py-2 border border-[#333] text-xs text-[#888] hover:border-[#FF00FF] hover:text-[#FF00FF] transition-colors flex items-center justify-center gap-1"
                  >
                    <Palette className="w-3 h-3" />
                    風格庫
                  </button>
                </div>
              </div>

              {/* Pinned Cards */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {pinnedCards.length === 0 ? (
                  <div className="text-center py-10 text-[#555] text-xs">
                    <Layers className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="mb-1">Pin AI responses here</p>
                    <p className="text-[#444]">or add text manually</p>
                  </div>
                ) : (
                  pinnedCards.map((card, index) => (
                    <motion.div
                      key={card.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className={`bg-[#0A0A0A] border border-[#222] group relative ${
                        expandedCardId === card.id ? 'ring-1 ring-[#00FF99]' : ''
                      }`}
                    >
                      {/* Card Header */}
                      <div className="flex items-center justify-between px-3 py-2 border-b border-[#1a1a1a] bg-[#080808]">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 bg-[#00FF99] text-black text-[10px] font-bold flex items-center justify-center">
                            {index + 1}
                          </span>
                          <span className="text-[10px] text-[#555]">
                            {card.images?.length > 0 || card.image ? 'TEXT + IMAGE' : 'TEXT'}
                          </span>
                          {/* 顯示是否有配圖建議 */}
                          {articleAnalysis?.imagePlacements?.some(p => p.paragraphIndex === index) && (
                            <span className={`text-[9px] px-1.5 py-0.5 ${
                              articleAnalysis.imagePlacements.find(p => p.paragraphIndex === index)?.generated
                                ? 'bg-[#00FF99]/20 text-[#00FF99]'
                                : 'bg-[#00BFFF]/20 text-[#00BFFF]'
                            }`}>
                              {articleAnalysis.imagePlacements.find(p => p.paragraphIndex === index)?.generated
                                ? '✓ 已配圖'
                                : '💡 建議配圖'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => moveCard(card.id, 'up')}
                            disabled={index === 0}
                            className="p-1 text-[#444] hover:text-white disabled:opacity-30 transition-colors"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => moveCard(card.id, 'down')}
                            disabled={index === pinnedCards.length - 1}
                            className="p-1 text-[#444] hover:text-white disabled:opacity-30 transition-colors"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setExpandedCardId(expandedCardId === card.id ? null : card.id)}
                            className="p-1 text-[#444] hover:text-[#00FF99] transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-3">
                        {editingCardId === card.id ? (
                          <div className="space-y-2">
                            {/* Back Button Header */}
                            <div className="flex items-center justify-between pb-2 border-b border-[#222]">
                              <button
                                onClick={() => setEditingCardId(null)}
                                className="flex items-center gap-1 text-[10px] text-[#888] hover:text-[#00FF99] transition-colors"
                              >
                                <ArrowLeft className="w-3 h-3" />
                                BACK
                              </button>
                              <span className="text-[10px] text-[#555]">EDITING</span>
                            </div>
                            
                            {/* 編輯時的圖片預覽 - 支援多圖 */}
                            {(card.images?.length > 0 || card.image) && (
                              <div className="space-y-2">
                                {/* 主圖 */}
                                <div className="relative aspect-video bg-[#111] overflow-hidden rounded group/editimg">
                                  <img 
                                    src={card.images?.[0]?.url || card.image} 
                                    alt="" 
                                    className="w-full h-full object-cover" 
                                  />
                                  <button
                                    onClick={() => removeImageFromCard(card.id, 0)}
                                    className="absolute top-2 right-2 p-1.5 bg-red-500/80 text-white hover:bg-red-500 transition-colors opacity-0 group-hover/editimg:opacity-100"
                                    title="移除圖片"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                                
                                {/* 其他圖片縮圖 */}
                                {card.images?.length > 1 && (
                                  <div className="flex gap-1 overflow-x-auto pb-1">
                                    {card.images.slice(1).map((img, idx) => (
                                      <div 
                                        key={idx} 
                                        className="relative flex-shrink-0 w-12 h-12 bg-[#111] overflow-hidden rounded group/thumb"
                                      >
                                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                                        <button
                                          onClick={() => removeImageFromCard(card.id, idx + 1)}
                                          className="absolute inset-0 bg-red-500/80 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity"
                                        >
                                          <X className="w-3 h-3 text-white" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                {/* 圖片數量指示 */}
                                <div className="text-[9px] text-[#555] text-center">
                                  {card.images?.length || 1} 張圖片
                                </div>
                              </div>
                            )}
                            
                            <textarea
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              className="w-full bg-[#111] border border-[#333] p-2 text-xs resize-none focus:outline-none focus:border-[#00FF99] min-h-[100px]"
                              rows={6}
                              autoFocus
                            />
                            
                            {/* 插入圖片按鈕 */}
                            <div className="flex gap-2">
                              <button
                                onClick={() => openGalleryForCard(card.id)}
                                className="flex-1 py-1.5 border border-[#FFD700] text-[#FFD700] text-xs hover:bg-[#FFD700]/10 transition-colors flex items-center justify-center gap-1"
                              >
                                <FolderOpen className="w-3 h-3" />
                                從圖庫插入
                              </button>
                              <button
                                onClick={() => openImageTool(card)}
                                className="flex-1 py-1.5 border border-[#FF00FF] text-[#FF00FF] text-xs hover:bg-[#FF00FF]/10 transition-colors flex items-center justify-center gap-1"
                              >
                                <Sparkles className="w-3 h-3" />
                                AI 生成
                              </button>
                            </div>
                            
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingCardId(null)}
                                className="px-3 py-1.5 border border-[#333] text-xs hover:bg-[#111] transition-colors flex items-center gap-1"
                              >
                                <X className="w-3 h-3" />
                                CANCEL
                              </button>
                              <button
                                onClick={handleSaveEdit}
                                className="flex-1 py-1.5 bg-[#00FF99] text-black text-xs font-bold hover:bg-[#00CC7A] transition-colors flex items-center justify-center gap-1"
                              >
                                <Check className="w-3 h-3" />
                                SAVE
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {/* 展開時顯示圖片插在對應原文位置 */}
                            {expandedCardId === card.id && card.images?.some(img => img.originalText) ? (
                              <div className="space-y-3">
                                {/* 根據 originalText 將內容分段並插入圖片 */}
                                {(() => {
                                  const content = card.content || '';
                                  const imagesWithText = card.images?.filter(img => img.originalText) || [];
                                  
                                  if (imagesWithText.length === 0) {
                                    return (
                                      <>
                                        <p className="text-xs text-[#888]">{content}</p>
                                        {card.images?.map((img, imgIdx) => (
                                          <div key={imgIdx} className="relative group/img">
                                            <img src={img.url} alt="" className="max-h-32 w-auto border border-[#333]" />
                                            <button
                                              onClick={() => removeImageFromCard(card.id, imgIdx)}
                                              className="absolute top-1 right-1 p-1 bg-black/80 text-red-500 opacity-0 group-hover/img:opacity-100"
                                            >
                                              <X className="w-3 h-3" />
                                            </button>
                                          </div>
                                        ))}
                                      </>
                                    );
                                  }
                                  
                                  // 按 sceneIndex 排序
                                  const sortedImages = [...imagesWithText].sort((a, b) => (a.sceneIndex || 0) - (b.sceneIndex || 0));
                                  
                                  // 分割內容並插入圖片
                                  let remainingContent = content;
                                  const elements = [];
                                  
                                  sortedImages.forEach((img, idx) => {
                                    if (img.originalText && remainingContent.includes(img.originalText)) {
                                      const parts = remainingContent.split(img.originalText);
                                      // 前面的文字
                                      if (parts[0]) {
                                        elements.push(
                                          <p key={`text-${idx}-before`} className="text-xs text-[#888]">{parts[0]}</p>
                                        );
                                      }
                                      // 原文 + 圖片
                                      elements.push(
                                        <div key={`scene-${idx}`} className="space-y-2">
                                          <p className="text-xs text-[#EAEAEA] font-medium">{img.originalText}</p>
                                          <div className="relative group/img pl-4 border-l-2 border-[#00FF99]">
                                            <img src={img.url} alt="" className="max-h-32 w-auto border border-[#333]" />
                                            <button
                                              onClick={() => removeImageFromCard(card.id, card.images.findIndex(i => i.url === img.url))}
                                              className="absolute top-1 right-1 p-1 bg-black/80 text-red-500 opacity-0 group-hover/img:opacity-100"
                                            >
                                              <X className="w-3 h-3" />
                                            </button>
                                          </div>
                                        </div>
                                      );
                                      remainingContent = parts.slice(1).join(img.originalText);
                                    }
                                  });
                                  
                                  // 剩餘文字
                                  if (remainingContent) {
                                    elements.push(
                                      <p key="text-remaining" className="text-xs text-[#888]">{remainingContent}</p>
                                    );
                                  }
                                  
                                  // 沒有 originalText 的圖片（舊格式或手動添加）
                                  const imagesWithoutText = card.images?.filter(img => !img.originalText) || [];
                                  if (imagesWithoutText.length > 0) {
                                    elements.push(
                                      <div key="extra-images" className="flex gap-1 flex-wrap mt-2">
                                        {imagesWithoutText.map((img, imgIdx) => (
                                          <div key={imgIdx} className="relative w-16 h-16 group/thumb">
                                            <img src={img.url} alt="" className="w-full h-full object-cover border border-[#333]" />
                                            <button
                                              onClick={() => removeImageFromCard(card.id, card.images.findIndex(i => i.url === img.url))}
                                              className="absolute inset-0 bg-black/70 text-red-500 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center"
                                            >
                                              <X className="w-4 h-4" />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    );
                                  }
                                  
                                  return elements;
                                })()}
                              </div>
                            ) : (
                              <>
                                <p className={`text-xs text-[#888] ${expandedCardId === card.id ? '' : 'line-clamp-3'}`}>
                                  {card.content || <span className="text-[#444] italic">Empty card - click edit to add content</span>}
                                </p>
                            
                                {/* Card Images Preview - 支援多圖 */}
                                {(card.images?.length > 0 || card.image) && (
                                  <div className="mt-3 space-y-2">
                                    {/* 主圖（第一張或 card.image） */}
                                    <div className="aspect-video bg-[#111] overflow-hidden relative group/img rounded">
                                      <img 
                                        src={card.images?.[0]?.url || card.image} 
                                        alt="" 
                                        className="w-full h-full object-cover" 
                                      />
                                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button
                                          onClick={() => openImageTool(card)}
                                          className="p-2 bg-[#FF00FF] text-black text-xs hover:bg-[#FF00FF]/80 transition-colors"
                                          title="Edit Image"
                                        >
                                          <Edit2 className="w-3 h-3" />
                                        </button>
                                        <a
                                          href={card.images?.[0]?.url || card.image}
                                          download
                                          className="p-2 bg-[#00FF99] text-black text-xs hover:bg-[#00FF99]/80 transition-colors"
                                          title="Download"
                                        >
                                          <Download className="w-3 h-3" />
                                        </a>
                                        <button
                                          onClick={() => removeImageFromCard(card.id, 0)}
                                          className="p-2 bg-red-500 text-white text-xs hover:bg-red-600 transition-colors"
                                          title="Remove"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                
                                    {/* 更多圖片（縮圖列表） */}
                                {card.images?.length > 1 && (
                                  <div className="flex gap-1 overflow-x-auto pb-1">
                                    {card.images.slice(1).map((img, imgIdx) => (
                                      <div 
                                        key={imgIdx}
                                        className="relative flex-shrink-0 w-16 h-16 bg-[#111] rounded overflow-hidden group/thumb"
                                      >
                                        <img 
                                          src={img.url} 
                                          alt={`圖片 ${imgIdx + 2}`}
                                          className="w-full h-full object-cover"
                                        />
                                        <button
                                          onClick={() => removeImageFromCard(card.id, imgIdx + 1)}
                                          className="absolute inset-0 bg-black/70 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center"
                                        >
                                          <X className="w-4 h-4 text-red-500" />
                                        </button>
                                      </div>
                                    ))}
                                    <div className="flex-shrink-0 w-16 h-16 border border-dashed border-[#333] rounded flex items-center justify-center text-[#555] text-[10px]">
                                      {card.images.length} 張
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                              </>
                            )}

                            {/* Card Actions */}
                            <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#1a1a1a]">
                              <div className="flex gap-1">
                                <button
                                  onClick={() => openGalleryForCard(card.id)}
                                  className="flex items-center gap-1 px-2 py-1 text-[10px] border border-[#333] text-[#666] hover:border-[#FFD700] hover:text-[#FFD700] transition-colors"
                                >
                                  <FolderOpen className="w-3 h-3" />
                                  圖庫
                                </button>
                                <button
                                  onClick={() => openImageTool(card)}
                                  className="flex items-center gap-1 px-2 py-1 text-[10px] border border-[#333] text-[#666] hover:border-[#FF00FF] hover:text-[#FF00FF] transition-colors"
                                >
                                  <Sparkles className="w-3 h-3" />
                                  AI
                                </button>
                              </div>
                              
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => duplicateCard(card)}
                                  className="p-1.5 text-[#444] hover:text-[#00BFFF] transition-colors"
                                  title="Duplicate"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleEditCard(card)}
                                  className="p-1.5 text-[#444] hover:text-[#00FF99] transition-colors"
                                  title="Edit"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCard(card.id)}
                                  className="p-1.5 text-[#444] hover:text-red-500 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Preview Publish Button */}
              {pinnedCards.length > 0 && (
                <div className="p-4 border-t border-[#222]">
                  <button
                    onClick={handlePreviewPublish}
                    className="w-full py-3 bg-gradient-to-r from-[#FF00FF] to-[#00FF99] text-black font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    PREVIEW & PUBLISH
                  </button>
                </div>
              )}
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Image Tool Modal - Redesigned */}
      <AnimatePresence>
        {showImageTool && selectedCardForImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
            onClick={() => {
              // 如果有任何選項正在生成中，顯示確認對話框
              const isGenerating = promptOptions.some(opt => opt.generating);
              const hasUnsavedImages = promptOptions.some(opt => opt.generatedImage);
              if (isGenerating) {
                alert('圖片正在生成中，請稍候...');
                return;
              }
              if (hasUnsavedImages && !confirm('有未儲存的生成圖片，確定要關閉嗎？')) {
                return;
              }
              setShowImageTool(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0A0A0A] border border-[#333] max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-[#222] flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[#FFD700]" />
                  IMAGE GENERATOR
                  <span className="text-[10px] text-[#555] font-normal">場景化配圖</span>
                </h3>
                <button
                  onClick={() => {
                    const isGenerating = promptOptions.some(opt => opt.generating) || scenes.some(s => s.generating);
                    const hasUnsavedImages = promptOptions.some(opt => opt.generatedImage) || scenes.some(s => s.generatedImage);
                    if (isGenerating) {
                      alert('圖片正在生成中，請稍候...');
                      return;
                    }
                    if (hasUnsavedImages && !confirm('有未儲存的生成圖片，確定要關閉嗎？')) {
                      return;
                    }
                    setShowImageTool(false);
                  }}
                  className="text-[#555] hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {selectedCardForImage && (
                <div className="px-4 py-3 border-b border-[#1a1a1a] text-[10px] text-[#666]">
                  <span className="text-[#FFD700] font-bold">段落 {selectedCardIndex + 1}</span>
                  {selectedCardSnippet && (
                    <span className="ml-2 text-[#888]">{selectedCardSnippet}{selectedCardSnippet.length >= 120 ? '…' : ''}</span>
                  )}
                </div>
              )}
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Source Content Preview */}
                <div className="bg-[#111] border border-[#222] p-3">
                  <p className="text-[10px] text-[#555] mb-2">SOURCE CONTENT</p>
                  <p className="text-xs text-[#888]">
                    {selectedCardForImage.content}
                  </p>
                </div>

                {/* Style Selector + Reference Image */}
                <div className="flex gap-3">
                  {/* Global Style Selector */}
                  <div className="flex-1">
                    <p className="text-[10px] text-[#555] mb-2">🎨 統一風格 {scenes.length > 0 && <span className="text-[#FFD700]">（更換後需重新分析）</span>}</p>
                    <div className="flex flex-wrap gap-1">
                      {STYLE_OPTIONS.map((style) => (
                        <button
                          key={style}
                          onClick={() => {
                            setGlobalStyle(style);
                            // 如果已有場景分析，提示需要重新分析
                            if (scenes.length > 0) {
                              // 清除舊的分析結果，讓用戶重新分析
                              setScenes([]);
                              setCoverImageSuggestion(null);
                            }
                          }}
                          className={`px-2 py-1 text-[10px] border transition-all ${
                            globalStyle === style
                              ? 'border-[#FFD700] bg-[#FFD700]/20 text-[#FFD700]'
                              : 'border-[#333] text-[#666] hover:border-[#555]'
                          }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Global Reference Image Upload */}
                  <div className="w-32">
                    <p className="text-[10px] text-[#555] mb-2">📷 全局參考</p>
                    {referenceImage ? (
                      <div className="relative">
                        <img 
                          src={referenceImage} 
                          alt="Reference" 
                          className="w-full h-20 object-cover border border-[#333]"
                        />
                        <button
                          onClick={() => setReferenceImage(null)}
                          className="absolute -top-1 -right-1 p-0.5 bg-black border border-[#333] text-[#888] hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => imageInputRef.current?.click()}
                        className="w-full h-20 border border-dashed border-[#333] flex flex-col items-center justify-center text-[#555] hover:border-[#00BFFF] hover:text-[#00BFFF] transition-colors"
                      >
                        <Upload className="w-4 h-4 mb-1" />
                        <span className="text-[9px]">上傳參考</span>
                      </button>
                    )}
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleReferenceImageUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Analyze Button */}
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-[#555] flex items-center gap-1">
                    <Wand2 className="w-3 h-3" />
                    AI IMAGE SUGGESTIONS
                  </p>
                  <button
                    onClick={handleAnalyzeForImage}
                    disabled={analyzingCard}
                    className="flex items-center gap-1 px-4 py-2 text-[10px] border-2 border-[#00BFFF] text-[#00BFFF] font-bold hover:bg-[#00BFFF] hover:text-black transition-all disabled:opacity-50"
                  >
                    {analyzingCard ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                    {analyzingCard ? 'ANALYZING...' : 'ANALYZE & SUGGEST'}
                  </button>
                </div>

                {/* Prompt Options List - New Design */}
                {promptOptions.length > 0 && scenes.length === 0 && (
                  <div className="space-y-3">
                    <p className="text-[10px] text-[#FFD700] font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      IMAGE SUGGESTIONS ({promptOptions.length})
                    </p>
                    
                    {promptOptions.map((option, idx) => (
                      <motion.div
                        key={option.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-[#111] border border-[#333] p-4 group"
                      >
                        <div className="flex gap-4">
                          {/* Left: Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="w-6 h-6 flex-shrink-0 flex items-center justify-center text-[10px] font-bold bg-[#FFD700] text-black">
                                {idx + 1}
                              </span>
                              <h4 className="text-sm font-bold text-[#EAEAEA]">{option.style}</h4>
                            </div>
                            {option.description && (
                              <p className="text-[11px] text-[#666] mb-2">{option.description}</p>
                            )}
                            <p className="text-[10px] text-[#888] font-mono leading-relaxed">
                              {option.prompt}
                            </p>
                            
                            {/* Reference Image Preview (if uploaded for this option) */}
                            {option.referenceImage && (
                              <div className="mt-3 relative inline-block">
                                <img 
                                  src={option.referenceImage} 
                                  alt="Reference" 
                                  className="h-16 w-auto border border-[#333]"
                                />
                                <button
                                  onClick={() => {
                                    setPromptOptions(prev => prev.map((p, i) => 
                                      i === idx ? { ...p, referenceImage: null } : p
                                    ));
                                  }}
                                  className="absolute -top-1 -right-1 p-0.5 bg-black border border-[#333] text-[#888] hover:text-red-500"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                            
                            {/* Generated Image Preview */}
                            {option.generatedImage && (
                              <div className="mt-3">
                                <p className="text-[9px] text-[#00FF99] mb-1">✓ GENERATED</p>
                                <img 
                                  src={option.generatedImage} 
                                  alt="Generated" 
                                  className="max-h-32 w-auto border border-[#00FF99]"
                                />
                              </div>
                            )}
                          </div>
                          
                          {/* Right: Action Buttons */}
                          <div className="flex flex-col gap-2 flex-shrink-0">
                            {/* Delete Button */}
                            <button
                              onClick={() => {
                                setPromptOptions(prev => prev.filter((_, i) => i !== idx));
                              }}
                              className="w-9 h-9 flex items-center justify-center border border-[#333] text-[#555] hover:border-red-500 hover:text-red-500 hover:bg-red-500/10 transition-all"
                              title="Remove this suggestion"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            
                            {/* Upload Reference Button */}
                            <button
                              onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/*';
                                input.onchange = (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (ev) => {
                                      setPromptOptions(prev => prev.map((p, i) => 
                                        i === idx ? { ...p, referenceImage: ev.target?.result } : p
                                      ));
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                };
                                input.click();
                              }}
                              className="w-9 h-9 flex items-center justify-center border border-[#333] text-[#555] hover:border-[#00BFFF] hover:text-[#00BFFF] hover:bg-[#00BFFF]/10 transition-all"
                              title="Upload reference image"
                            >
                              <Upload className="w-4 h-4" />
                            </button>
                            
                            {/* Generate Button */}
                            <button
                              onClick={async () => {
                                // Mark this option as generating
                                setPromptOptions(prev => prev.map((p, i) => 
                                  i === idx ? { ...p, generating: true } : p
                                ));
                                
                                try {
                                  const res = await fetch('/api/generate-image', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ 
                                      prompt: option.prompt,
                                      cardContent: selectedCardForImage.content,
                                      referenceImage: option.referenceImage,
                                    }),
                                  });
                                  
                                  const data = await res.json();
                                  if (data.error) throw new Error(data.error);
                                  
                                  // 自動儲存到圖庫（已處理 quota 錯誤）
                                  const savedImage = await saveImageAsync({
                                    imageUrl: data.imageUrl,
                                    prompt: option.prompt,
                                    cardContent: selectedCardForImage?.content?.substring(0, 100) || '',
                                    category: 'ai-generated',
                                  });
                                  const finalUrl = savedImage?.imageUrl || data.imageUrl;

                                  if (!savedImage && data.imageUrl?.startsWith('data:')) {
                                    console.warn('圖片儲存到圖庫失敗（空間不足），但圖片已生成');
                                  }
                                  
                                  // Update with generated image
                                  setPromptOptions(prev => prev.map((p, i) => 
                                    i === idx ? { ...p, generatedImage: finalUrl, generating: false } : p
                                  ));
                                } catch (err) {
                                  console.error('Generate error:', err);
                                  alert('圖片生成失敗: ' + err.message);
                                  setPromptOptions(prev => prev.map((p, i) => 
                                    i === idx ? { ...p, generating: false } : p
                                  ));
                                }
                              }}
                              disabled={option.generating}
                              className="w-9 h-9 flex items-center justify-center border border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700] hover:text-black transition-all disabled:opacity-50"
                              title="Generate image"
                            >
                              {option.generating ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Sparkles className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* 場景化配圖列表 - Scene-based Image Suggestions */}
                {scenes.length > 0 && (
                  <div className="space-y-4">
                    {/* 封面圖建議 */}
                    {coverImageSuggestion && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`border p-4 ${
                          coverImageSuggestion.generatedImage 
                            ? 'bg-[#1a0a1a] border-[#FF00FF]/50' 
                            : 'bg-[#111] border-[#FF00FF]/30'
                        }`}
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <span className="w-7 h-7 flex-shrink-0 flex items-center justify-center text-[10px] font-bold bg-[#FF00FF] text-black">
                            封面
                          </span>
                          <div className="flex-1">
                            <p className="text-xs text-[#FF00FF] font-medium">
                              {coverImageSuggestion.description}
                            </p>
                          </div>
                          {coverImageSuggestion.generatedImage && (
                            <span className="text-[9px] text-[#FF00FF] font-bold px-2 py-1 bg-[#FF00FF]/10 border border-[#FF00FF]/30">
                              ✓ 已生成
                            </span>
                          )}
                        </div>
                        
                        {coverImageSuggestion.generatedImage ? (
                          <div className="pl-10">
                            <img 
                              src={coverImageSuggestion.generatedImage} 
                              alt="Cover"
                              className="max-h-40 w-auto border border-[#FF00FF]"
                            />
                          </div>
                        ) : (
                          <div className="pl-10 space-y-2">
                            {/* 封面圖參考圖片上傳 */}
                            <div className="flex gap-2 items-start">
                              <div className="flex-1">
                                <textarea
                                  value={coverImageSuggestion.editablePrompt || coverImageSuggestion.prompt}
                                  onChange={(e) => setCoverImageSuggestion(prev => ({ ...prev, editablePrompt: e.target.value }))}
                                  className="w-full bg-[#0A0A0A] border border-[#333] p-2 text-[10px] text-[#888] font-mono resize-none focus:border-[#FF00FF] focus:outline-none"
                                  rows={3}
                                />
                              </div>
                              <div className="w-20 flex-shrink-0">
                                {coverImageSuggestion.referenceImage ? (
                                  <div className="relative">
                                    <img src={coverImageSuggestion.referenceImage} alt="Ref" className="w-full h-16 object-cover border border-[#333]" />
                                    <button
                                      onClick={() => setCoverImageSuggestion(prev => ({ ...prev, referenceImage: null }))}
                                      className="absolute -top-1 -right-1 p-0.5 bg-black border border-[#333] text-[#888] hover:text-red-500"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      const input = document.createElement('input');
                                      input.type = 'file';
                                      input.accept = 'image/*';
                                      input.onchange = (e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          const reader = new FileReader();
                                          reader.onload = (ev) => setCoverImageSuggestion(prev => ({ ...prev, referenceImage: ev.target?.result }));
                                          reader.readAsDataURL(file);
                                        }
                                      };
                                      input.click();
                                    }}
                                    className="w-full h-16 border border-dashed border-[#333] flex flex-col items-center justify-center text-[#555] hover:border-[#FF00FF] hover:text-[#FF00FF] transition-colors"
                                  >
                                    <Upload className="w-3 h-3" />
                                    <span className="text-[8px]">參考圖</span>
                                  </button>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={handleGenerateCoverImage}
                              disabled={coverImageSuggestion.generating}
                              className="px-4 py-2 text-[10px] border border-[#FF00FF] text-[#FF00FF] font-bold hover:bg-[#FF00FF] hover:text-black transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                              {coverImageSuggestion.generating ? (
                                <><Loader2 className="w-3 h-3 animate-spin" /> 生成封面中...</>
                              ) : (
                                <><Sparkles className="w-3 h-3" /> 生成封面圖</>
                              )}
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )}

                    <p className="text-[10px] text-[#FFD700] font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      場景配圖 ({scenes.length} 個場景)
                    </p>
                    
                    {scenes.map((scene, idx) => (
                      <motion.div
                        key={scene.sceneIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`border p-4 ${
                          scene.generatedImage 
                            ? 'bg-[#0a1a0a] border-[#00FF99]/50' 
                            : 'bg-[#111] border-[#333]'
                        }`}
                      >
                        {/* Scene Header */}
                        <div className="flex items-start gap-3 mb-3">
                          <span className={`w-7 h-7 flex-shrink-0 flex items-center justify-center text-[11px] font-bold ${
                            scene.generatedImage 
                              ? 'bg-[#00FF99] text-black' 
                              : 'bg-[#FFD700] text-black'
                          }`}>
                            {idx + 1}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm text-[#EAEAEA] font-medium leading-relaxed">
                              {scene.originalText}
                            </p>
                            {scene.sceneDescription && (
                              <p className="text-[10px] text-[#666] mt-1">場景：{scene.sceneDescription}</p>
                            )}
                          </div>
                          {scene.generatedImage && (
                            <span className="text-[9px] text-[#00FF99] font-bold px-2 py-1 bg-[#00FF99]/10 border border-[#00FF99]/30">
                              ✓ 已配圖
                            </span>
                          )}
                        </div>
                        
                        {/* Generated Image Preview */}
                        {scene.generatedImage ? (
                          <div className="pl-10">
                            <img 
                              src={scene.generatedImage} 
                              alt={`Scene ${idx + 1}`}
                              className="max-h-40 w-auto border border-[#00FF99]"
                            />
                          </div>
                        ) : (
                          /* Editable Prompt + Reference Image + Generate Button */
                          <div className="pl-10 space-y-2">
                            <div className="flex gap-2 items-start">
                              <div className="flex-1">
                                <textarea
                                  value={scene.editablePrompt || scene.prompt}
                                  onChange={(e) => {
                                    setScenes(prev => prev.map((s, i) => 
                                      i === idx ? { ...s, editablePrompt: e.target.value } : s
                                    ));
                                  }}
                                  className="w-full bg-[#0A0A0A] border border-[#333] p-2 text-[10px] text-[#888] font-mono resize-none focus:border-[#FFD700] focus:outline-none"
                                  rows={3}
                                />
                              </div>
                              <div className="w-20 flex-shrink-0">
                                {scene.referenceImage ? (
                                  <div className="relative">
                                    <img src={scene.referenceImage} alt="Ref" className="w-full h-16 object-cover border border-[#333]" />
                                    <button
                                      onClick={() => {
                                        setScenes(prev => prev.map((s, i) => 
                                          i === idx ? { ...s, referenceImage: null } : s
                                        ));
                                      }}
                                      className="absolute -top-1 -right-1 p-0.5 bg-black border border-[#333] text-[#888] hover:text-red-500"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      const input = document.createElement('input');
                                      input.type = 'file';
                                      input.accept = 'image/*';
                                      input.onchange = (e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          const reader = new FileReader();
                                          reader.onload = (ev) => {
                                            setScenes(prev => prev.map((s, i) => 
                                              i === idx ? { ...s, referenceImage: ev.target?.result } : s
                                            ));
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      };
                                      input.click();
                                    }}
                                    className="w-full h-16 border border-dashed border-[#333] flex flex-col items-center justify-center text-[#555] hover:border-[#FFD700] hover:text-[#FFD700] transition-colors"
                                  >
                                    <Upload className="w-3 h-3" />
                                    <span className="text-[8px]">參考圖</span>
                                  </button>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => handleGenerateForScene(idx, scene.editablePrompt || scene.prompt)}
                              disabled={scene.generating}
                              className="px-4 py-2 text-[10px] border border-[#FFD700] text-[#FFD700] font-bold hover:bg-[#FFD700] hover:text-black transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                              {scene.generating ? (
                                <><Loader2 className="w-3 h-3 animate-spin" /> 生成中...</>
                              ) : (
                                <><Sparkles className="w-3 h-3" /> 生成圖片</>
                              )}
                            </button>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Empty State */}
                {promptOptions.length === 0 && scenes.length === 0 && !analyzingCard && (
                  <div className="py-12 text-center border border-dashed border-[#333]">
                    <Wand2 className="w-8 h-8 text-[#333] mx-auto mb-3" />
                    <p className="text-xs text-[#555]">點擊 "ANALYZE & SUGGEST" 分析並建議配圖</p>
                  </div>
                )}
              </div>
              
              {/* Modal Footer - Save Button */}
              <div className="p-4 border-t border-[#222] flex gap-2">
                <button
                  onClick={() => setShowImageTool(false)}
                  className="flex-1 py-2.5 border border-[#333] text-sm hover:bg-[#111] transition-colors"
                >
                  CANCEL
                </button>
                <button
                  onClick={() => {
                    // 收集所有生成的圖片（包含場景）
                    let allGeneratedImages = [];
                    
                    // 從舊格式 promptOptions 收集
                    const optionImages = promptOptions
                      .filter(opt => opt.generatedImage)
                      .map(opt => ({ url: opt.generatedImage, prompt: opt.prompt || '' }));
                    allGeneratedImages = [...allGeneratedImages, ...optionImages];
                    
                    // 從場景列表收集（含原文對應）
                    const sceneImages = scenes
                      .filter(scene => scene.generatedImage)
                      .map(scene => ({ 
                        url: scene.generatedImage, 
                        prompt: scene.editablePrompt || scene.prompt || '',
                        originalText: scene.originalText, // 記錄對應的原文
                        sceneIndex: scene.sceneIndex,
                      }));
                    allGeneratedImages = [...allGeneratedImages, ...sceneImages];
                    
                    // 計算總圖片數（含封面）
                    const totalImages = allGeneratedImages.length + (coverImageSuggestion?.generatedImage ? 1 : 0);
                    
                    // 更新卡片狀態
                    setPinnedCards(prev => prev.map(c => {
                      if (c.id !== selectedCardForImage.id) return c;
                      const existingImages = c.images || [];
                      if (existingImages.length === 0 && c.image) {
                        existingImages.push({ url: c.image, prompt: c.imagePrompt || '' });
                      }
                      return {
                        ...c,
                        images: [...existingImages, ...allGeneratedImages],
                        image: coverImageSuggestion?.generatedImage || c.image || allGeneratedImages[0]?.url,
                        imagePrompt: c.imagePrompt || allGeneratedImages[0]?.prompt || '',
                        // 記憶場景分析結果（下次進入時可載入）
                        scenes: scenes,
                        coverImageSuggestion: coverImageSuggestion,
                        referenceImage: referenceImage,
                      };
                    }));
                    
                    setShowImageTool(false);
                  }}
                  disabled={!promptOptions.some(opt => opt.generatedImage) && !scenes.some(s => s.generatedImage) && !coverImageSuggestion?.generatedImage}
                  className="flex-1 py-2.5 bg-[#00FF99] text-black font-bold text-sm hover:bg-[#00FF99]/80 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check className="w-4 h-4" />
                  SAVE ({
                    (promptOptions.filter(opt => opt.generatedImage).length) + 
                    (scenes.filter(s => s.generatedImage).length) +
                    (coverImageSuggestion?.generatedImage ? 1 : 0)
                  } 張圖片)
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Gallery Modal */}
      <ImageGalleryModal
        isOpen={showGallery}
        onClose={() => setShowGallery(false)}
        onSelectImage={handleSelectFromGallery}
      />

      {/* Style Library Modal */}
      <StyleLibraryModal
        isOpen={showStyleLibrary}
        onClose={() => setShowStyleLibrary(false)}
        onSelectStyle={(style) => {
          setSelectedStyle(style);
          setShowStyleLibrary(false);
        }}
      />
    </div>
  );
}

// 主頁面組件，包裝 AuthGuard 保護
export default function AIEditorPage() {
  return (
    <AuthGuard>
      <AIEditorContent />
    </AuthGuard>
  );
}
