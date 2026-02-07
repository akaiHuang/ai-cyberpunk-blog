'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Sparkles, Heart, Brain, Gamepad2, Beaker, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { BLOG_CATEGORIES as DATA_CATEGORIES, getArticlesByCategory } from '@/data/blogData';

/**
 * Blog 首頁元件
 * 顯示所有分類，每個分類顯示三張最新文章卡片
 */

// 圖標映射
const ICON_MAP = {
  'wishlist': Sparkles,
  'sense': Heart,
  'ai-lab': Brain,
  'game-labs': Gamepad2,
  'ops-labs': Beaker,
};

// 從資料來源獲取分類，並加入圖標
const BLOG_CATEGORIES = DATA_CATEGORIES.map(cat => ({
  ...cat,
  icon: ICON_MAP[cat.id] || Sparkles,
  // 取得該分類前 3 篇文章
  articles: getArticlesByCategory(cat.id).slice(0, 3).map(article => ({
    id: article.id,
    title: article.title,
    image: article.image,
    date: article.date,
    tags: article.tags,
  })),
}));

// 文章卡片元件
const ArticleCard = ({ article, categoryColor, index }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <Link href={`/blog/${article.id}`}>
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        viewport={{ once: true }}
        className="group relative bg-[#0A0A0A] border border-[#222] overflow-hidden cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* 圖片區域 */}
        <div className="relative aspect-[4/3] overflow-hidden bg-[#111]">
          <img 
            src={article.image}
            alt={article.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
          
          {/* Hover overlay */}
          <motion.div 
            className="absolute inset-0 bg-black/60 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <span 
              className="px-4 py-2 border text-xs font-mono tracking-wider"
              style={{ borderColor: categoryColor, color: categoryColor }}
            >
              READ MORE
            </span>
          </motion.div>
          
          {/* Corner decorations */}
          <div className="absolute top-2 left-2 w-3 h-3 border-l border-t border-[#333]" />
          <div className="absolute top-2 right-2 w-3 h-3 border-r border-t border-[#333]" />
          <div className="absolute bottom-2 left-2 w-3 h-3 border-l border-b border-[#333]" />
          <div className="absolute bottom-2 right-2 w-3 h-3 border-r border-b border-[#333]" />
        </div>
        
        {/* 內容區域 */}
        <div className="p-4">
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-3">
            {article.tags.map((tag, i) => (
              <span 
                key={i}
                className="text-[10px] font-mono px-2 py-0.5 bg-[#151515] text-[#666]"
              >
                {tag}
              </span>
            ))}
          </div>
          
          {/* Title */}
          <h4 className="font-bold text-white text-sm mb-3 line-clamp-2 group-hover:text-[#00FF99] transition-colors">
            {article.title}
          </h4>
          
          {/* Date */}
          <div className="flex items-center justify-between text-[10px] font-mono text-[#555]">
            <span>{article.date}</span>
            <ArrowUpRight 
              className="w-3 h-3 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
              style={{ color: categoryColor }}
            />
          </div>
        </div>
        
        {/* Bottom accent line */}
        <motion.div 
          className="absolute bottom-0 left-0 h-0.5"
          style={{ backgroundColor: categoryColor }}
          initial={{ width: 0 }}
          animate={{ width: isHovered ? '100%' : 0 }}
          transition={{ duration: 0.3 }}
        />
      </motion.article>
    </Link>
  );
};

// 分類區塊元件
const CategorySection = ({ category, index }) => {
  const IconComponent = category.icon;
  
  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      className="border-b border-[#222] py-16"
    >
      <div className="max-w-7xl mx-auto px-4">
        {/* Category Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div className="flex items-start gap-4 mb-4 md:mb-0">
            <div 
              className="p-3 border"
              style={{ borderColor: category.color + '33', backgroundColor: category.color + '11' }}
            >
              <IconComponent className="w-6 h-6" style={{ color: category.color }} />
            </div>
            <div>
              <div className="text-[10px] font-mono text-[#666] tracking-widest mb-1">
                {String(index + 1).padStart(2, '0')} // {category.subtitle}
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
                {category.title}
              </h3>
              <p className="text-sm text-[#666] mt-1 max-w-md">
                {category.description}
              </p>
            </div>
          </div>
          
          <Link 
            href={`/blog?category=${category.id}`}
            className="flex items-center gap-2 text-xs font-mono px-4 py-2 border border-[#333] hover:border-[#555] transition-colors group"
            style={{ color: category.color }}
          >
            VIEW ALL
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        
        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {category.articles.map((article, articleIndex) => (
            <ArticleCard 
              key={article.id} 
              article={article} 
              categoryColor={category.color}
              index={articleIndex}
            />
          ))}
        </div>
      </div>
    </motion.section>
  );
};

// Blog 首頁主元件
export default function BlogHomePage() {
  return (
    <div className="min-h-screen bg-black text-[#EAEAEA] font-mono">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 border-b border-[#222] backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-xs tracking-widest font-bold">
            BitLOG<span className="text-[#333]">_SYS</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/blog" className="text-xs hover:text-[#00FF99] transition-colors">
              ALL POSTS
            </Link>
            <Link href="/admin/blog" className="text-xs hover:text-[#00FF99] transition-colors">
              ADMIN
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section id="blog" className="bg-[#050505] pt-14">
        {/* Section Header */}
        <div className="border-b border-[#222] py-12">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-px bg-[#00FF99]" />
              <span className="text-[10px] font-mono text-[#00FF99] tracking-[0.3em]">
                KNOWLEDGE BASE
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
              BitLOG
            </h2>
            <p className="text-[#666] mt-2 text-sm md:text-base max-w-2xl">
              我們的實驗紀錄、靈感來源、技術研究。每一篇文章都是我們對數位世界的探索足跡。
            </p>
          </div>
        </div>
        
        {/* Category Sections */}
        {BLOG_CATEGORIES.map((category, index) => (
          <CategorySection key={category.id} category={category} index={index} />
        ))}
      </section>

      {/* Footer */}
      <footer className="border-t border-[#222] py-8 text-center text-xs text-[#555]">
        <p>BitLOGSYS © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
