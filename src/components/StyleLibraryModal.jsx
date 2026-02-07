'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Search, Trash2, Edit2, Plus, Upload, FileText,
  Image as ImageIcon, Loader2, Sparkles, Wand2, Check,
  Palette, Type, Copy
} from 'lucide-react';
import {
  getAllStyles,
  getStylesByType,
  saveStyle,
  updateStyle,
  deleteStyle,
  searchStyles,
  STYLE_TYPES,
} from '@/lib/styleLibrary';

export default function StyleLibraryModal({
  isOpen,
  onClose,
  onSelectStyle,
  filterType = null,
}) {
  const [styles, setStyles] = useState([]);
  const [activeTab, setActiveTab] = useState(filterType || 'all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createType, setCreateType] = useState(STYLE_TYPES.WRITING);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [editingStyle, setEditingStyle] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // 新增風格表單
  const [newStyle, setNewStyle] = useState({
    name: '',
    description: '',
    sourceContent: '',
    imageBase64: null,
  });

  const fileInputRef = useRef(null);

  // 載入風格
  useEffect(() => {
    if (isOpen) {
      loadStyles();
    }
  }, [isOpen, activeTab, searchTerm]);

  const loadStyles = () => {
    let result;
    if (searchTerm) {
      result = searchStyles(searchTerm);
    } else if (activeTab === 'all') {
      result = getAllStyles();
    } else {
      result = getStylesByType(activeTab);
    }
    setStyles(result);
  };

  const handleDelete = (styleId, e) => {
    e.stopPropagation();
    if (confirm('確定要刪除這個風格嗎？')) {
      deleteStyle(styleId);
      loadStyles();
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setNewStyle({ ...newStyle, imageBase64: ev.target?.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeAndSave = async () => {
    if (!newStyle.name.trim()) {
      alert('請輸入風格名稱');
      return;
    }

    if (createType === STYLE_TYPES.WRITING && !newStyle.sourceContent.trim()) {
      alert('請輸入要分析的文章內容');
      return;
    }

    if (createType === STYLE_TYPES.VISUAL && !newStyle.imageBase64) {
      alert('請上傳要分析的圖片');
      return;
    }

    setIsAnalyzing(true);

    try {
      const res = await fetch('/api/analyze-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: createType,
          content: newStyle.sourceContent,
          imageBase64: newStyle.imageBase64,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // 儲存風格
      const savedStyle = saveStyle({
        name: newStyle.name.trim(),
        type: createType,
        description: newStyle.description.trim() || data.analysis.summary,
        analysis: JSON.stringify(data.analysis),
        sourceContent: createType === STYLE_TYPES.WRITING
          ? newStyle.sourceContent
          : newStyle.imageBase64,
        prompt: data.analysis.promptForAI,
        tags: data.analysis.uniqueTraits || [],
      });

      // 重置表單
      setNewStyle({
        name: '',
        description: '',
        sourceContent: '',
        imageBase64: null,
      });
      setIsCreating(false);
      loadStyles();

      alert('風格已儲存！');
    } catch (err) {
      console.error('Analyze error:', err);
      alert('分析失敗: ' + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelect = (style) => {
    if (onSelectStyle) {
      onSelectStyle(style);
      onClose();
    }
  };

  const copyToClipboard = async (text, id) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getAnalysisData = (style) => {
    try {
      return JSON.parse(style.analysis);
    } catch {
      return { summary: style.analysis };
    }
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
        className="bg-[#0A0A0A] border border-[#333] w-full max-w-4xl h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-[#222] flex items-center justify-between">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <Palette className="w-4 h-4 text-[#FF00FF]" />
            STYLE LIBRARY
            <span className="text-[10px] text-[#555] font-normal">Skill System</span>
          </h2>
          <button
            onClick={onClose}
            className="text-[#555] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs & Search */}
        <div className="p-4 border-b border-[#222] flex flex-wrap items-center gap-4">
          {/* Tabs */}
          <div className="flex items-center border border-[#333]">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 text-xs transition-colors ${
                activeTab === 'all'
                  ? 'bg-[#FF00FF] text-black font-bold'
                  : 'text-[#888] hover:text-white'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setActiveTab(STYLE_TYPES.WRITING)}
              className={`px-4 py-2 text-xs transition-colors flex items-center gap-1 ${
                activeTab === STYLE_TYPES.WRITING
                  ? 'bg-[#00FF99] text-black font-bold'
                  : 'text-[#888] hover:text-white'
              }`}
            >
              <Type className="w-3 h-3" />
              文風
            </button>
            <button
              onClick={() => setActiveTab(STYLE_TYPES.VISUAL)}
              className={`px-4 py-2 text-xs transition-colors flex items-center gap-1 ${
                activeTab === STYLE_TYPES.VISUAL
                  ? 'bg-[#FFD700] text-black font-bold'
                  : 'text-[#888] hover:text-white'
              }`}
            >
              <ImageIcon className="w-3 h-3" />
              視覺
            </button>
          </div>

          {/* Search */}
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜尋風格..."
              className="w-full bg-[#111] border border-[#333] pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-[#FF00FF]"
            />
          </div>

          {/* Add Button */}
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1 px-4 py-2 bg-[#FF00FF] text-black text-xs font-bold hover:bg-[#FF00FF]/80 transition-colors"
          >
            <Plus className="w-3 h-3" />
            新增風格
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isCreating ? (
            /* Create Style Form */
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#FF00FF]" />
                  新增風格
                </h3>
                <button
                  onClick={() => setIsCreating(false)}
                  className="text-xs text-[#555] hover:text-white"
                >
                  取消
                </button>
              </div>

              {/* Type Selection */}
              <div className="flex gap-4">
                <button
                  onClick={() => setCreateType(STYLE_TYPES.WRITING)}
                  className={`flex-1 p-4 border ${
                    createType === STYLE_TYPES.WRITING
                      ? 'border-[#00FF99] bg-[#00FF99]/10'
                      : 'border-[#333] hover:border-[#555]'
                  } transition-colors`}
                >
                  <Type className={`w-6 h-6 mb-2 ${createType === STYLE_TYPES.WRITING ? 'text-[#00FF99]' : 'text-[#555]'}`} />
                  <h4 className="text-xs font-bold">文風分析</h4>
                  <p className="text-[10px] text-[#555] mt-1">上傳文章，AI 分析寫作風格</p>
                </button>
                <button
                  onClick={() => setCreateType(STYLE_TYPES.VISUAL)}
                  className={`flex-1 p-4 border ${
                    createType === STYLE_TYPES.VISUAL
                      ? 'border-[#FFD700] bg-[#FFD700]/10'
                      : 'border-[#333] hover:border-[#555]'
                  } transition-colors`}
                >
                  <ImageIcon className={`w-6 h-6 mb-2 ${createType === STYLE_TYPES.VISUAL ? 'text-[#FFD700]' : 'text-[#555]'}`} />
                  <h4 className="text-xs font-bold">視覺風格分析</h4>
                  <p className="text-[10px] text-[#555] mt-1">上傳圖片，AI 分析視覺風格</p>
                </button>
              </div>

              {/* Name */}
              <div>
                <label className="text-[10px] text-[#555] block mb-2">風格名稱 *</label>
                <input
                  type="text"
                  value={newStyle.name}
                  onChange={(e) => setNewStyle({ ...newStyle, name: e.target.value })}
                  placeholder="例如：科技感專業文風、復古電影色調..."
                  className="w-full bg-[#111] border border-[#333] px-4 py-3 text-sm focus:outline-none focus:border-[#FF00FF]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] text-[#555] block mb-2">描述 (選填)</label>
                <input
                  type="text"
                  value={newStyle.description}
                  onChange={(e) => setNewStyle({ ...newStyle, description: e.target.value })}
                  placeholder="簡短描述這個風格的特點..."
                  className="w-full bg-[#111] border border-[#333] px-4 py-3 text-sm focus:outline-none focus:border-[#FF00FF]"
                />
              </div>

              {/* Content Input */}
              {createType === STYLE_TYPES.WRITING ? (
                <div>
                  <label className="text-[10px] text-[#555] block mb-2">文章內容 *</label>
                  <textarea
                    value={newStyle.sourceContent}
                    onChange={(e) => setNewStyle({ ...newStyle, sourceContent: e.target.value })}
                    placeholder="貼上你喜歡的文章內容，AI 會分析其寫作風格..."
                    className="w-full bg-[#111] border border-[#333] px-4 py-3 text-sm focus:outline-none focus:border-[#FF00FF] min-h-[200px] resize-none"
                  />
                  <p className="text-[10px] text-[#555] mt-1">建議貼上 500-2000 字的內容以獲得最佳分析效果</p>
                </div>
              ) : (
                <div>
                  <label className="text-[10px] text-[#555] block mb-2">參考圖片 *</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  {newStyle.imageBase64 ? (
                    <div className="relative inline-block">
                      <img
                        src={newStyle.imageBase64}
                        alt="Preview"
                        className="max-h-48 border border-[#333]"
                      />
                      <button
                        onClick={() => setNewStyle({ ...newStyle, imageBase64: null })}
                        className="absolute -top-2 -right-2 p-1 bg-black border border-[#333] rounded-full hover:border-red-500 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-8 border-2 border-dashed border-[#333] hover:border-[#FFD700] transition-colors flex flex-col items-center gap-2"
                    >
                      <Upload className="w-8 h-8 text-[#555]" />
                      <span className="text-xs text-[#555]">點擊上傳圖片</span>
                    </button>
                  )}
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleAnalyzeAndSave}
                disabled={isAnalyzing}
                className="w-full py-3 bg-gradient-to-r from-[#FF00FF] to-[#00FF99] text-black font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    AI 分析中...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    分析並儲存風格
                  </>
                )}
              </button>
            </motion.div>
          ) : styles.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[#555]">
              <Palette className="w-12 h-12 mb-4 opacity-30" />
              <p className="text-sm">尚無風格</p>
              <p className="text-xs mt-1">點擊「新增風格」開始建立你的風格庫</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {styles.map((style) => {
                const analysis = getAnalysisData(style);
                return (
                  <motion.div
                    key={style.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`bg-[#111] border hover:border-[#FF00FF] transition-colors cursor-pointer ${
                      style.type === STYLE_TYPES.WRITING
                        ? 'border-[#00FF99]/30'
                        : 'border-[#FFD700]/30'
                    }`}
                    onClick={() => handleSelect(style)}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {style.type === STYLE_TYPES.WRITING ? (
                            <Type className="w-4 h-4 text-[#00FF99]" />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-[#FFD700]" />
                          )}
                          <h3 className="text-sm font-bold">{style.name}</h3>
                        </div>
                        <button
                          onClick={(e) => handleDelete(style.id, e)}
                          className="p-1 text-[#444] hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <p className="text-xs text-[#888] mb-3 line-clamp-2">
                        {style.description || analysis.summary}
                      </p>

                      {/* Visual Preview */}
                      {style.type === STYLE_TYPES.VISUAL && style.sourceContent && (
                        <div className="mb-3">
                          <img
                            src={style.sourceContent}
                            alt={style.name}
                            className="w-full h-24 object-cover border border-[#222]"
                          />
                        </div>
                      )}

                      {/* Tags */}
                      {style.tags && style.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {style.tags.slice(0, 3).map((tag, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 bg-[#222] text-[#888] text-[9px]"
                            >
                              {tag}
                            </span>
                          ))}
                          {style.tags.length > 3 && (
                            <span className="text-[9px] text-[#555]">
                              +{style.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Prompt Preview */}
                      <div className="relative bg-[#0A0A0A] border border-[#222] p-2">
                        <p className="text-[10px] text-[#666] line-clamp-2 pr-6">
                          {style.prompt}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(style.prompt, style.id);
                          }}
                          className="absolute top-2 right-2 p-1 hover:bg-[#222] rounded"
                        >
                          {copiedId === style.id ? (
                            <Check className="w-3 h-3 text-[#00FF99]" />
                          ) : (
                            <Copy className="w-3 h-3 text-[#555]" />
                          )}
                        </button>
                      </div>

                      {/* Date */}
                      <p className="text-[9px] text-[#444] mt-2">
                        {new Date(style.createdAt).toLocaleDateString('zh-TW')}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
