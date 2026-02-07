'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, Filter, Grid, List } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { BLOG_CATEGORIES, getAllPublishedArticles, getCategoryById } from '@/data/blogData';

function BlogListContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [allArticles, setAllArticles] = useState([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setAllArticles(getAllPublishedArticles());
  }, []);

  useEffect(() => {
    if (categoryParam && BLOG_CATEGORIES.find(c => c.id === categoryParam)) {
      setSelectedCategory(categoryParam);
    }
  }, [categoryParam]);

  const filteredArticles = useMemo(() => {
    return allArticles
      .filter(article => {
        if (selectedCategory !== 'all' && article.categoryId !== selectedCategory) {
          return false;
        }
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return (
            article.title.toLowerCase().includes(query) ||
            article.excerpt.toLowerCase().includes(query) ||
            article.tags.some(tag => tag.toLowerCase().includes(query))
          );
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [allArticles, selectedCategory, searchQuery]);

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
          <span className="text-xs tracking-widest font-bold">
            BLOG<span className="text-[#333]">_SYS</span>
          </span>
          <div className="w-20" />
        </div>
      </header>

      {/* Hero */}
      <div className="pt-14 bg-gradient-to-b from-[#0A0A0A] to-black">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3 className="text-xs font-mono text-[#00FF99] tracking-widest mb-2">
              // ALL ARTICLES
            </h3>
            <h1 
              className="text-4xl md:text-5xl font-bold text-white mb-4"
              style={{ fontFamily: "'Chakra Petch', sans-serif" }}
            >
              BLOG
            </h1>
            <p className="text-[#666] max-w-2xl">
              探索我們的創意實驗、技術分享、設計靈感與行銷洞察。
            </p>
          </motion.div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-y border-[#222] bg-[#050505] sticky top-14 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 text-xs border transition-colors ${
                  selectedCategory === 'all'
                    ? 'border-[#00FF99] text-[#00FF99] bg-[#00FF99]/10'
                    : 'border-[#333] text-[#888] hover:border-[#555]'
                }`}
              >
                ALL
              </button>
              {BLOG_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 text-xs border transition-colors ${
                    selectedCategory === cat.id
                      ? 'border-[#00FF99] text-[#00FF99] bg-[#00FF99]/10'
                      : 'border-[#333] text-[#888] hover:border-[#555]'
                  }`}
                >
                  {cat.subtitle}
                </button>
              ))}
            </div>

            {/* Search & View Mode */}
            <div className="flex gap-4 items-center w-full md:w-auto">
              <div className="relative flex-1 md:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full md:w-64 bg-[#111] border border-[#333] pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[#00FF99]"
                />
              </div>
              <div className="flex border border-[#333]">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-[#222] text-white' : 'text-[#555]'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-[#222] text-white' : 'text-[#555]'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Articles */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-xs text-[#555] mb-8">
          {isClient ? `SHOWING ${filteredArticles.length} ARTICLES` : 'LOADING...'}
        </div>

        {!isClient ? (
          <div className="text-center py-20">
            <div className="text-[#00FF99] animate-pulse">LOADING...</div>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#555] mb-4">NO ARTICLES FOUND</p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="text-[#00FF99] text-sm hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredArticles.map((article, index) => {
              const category = getCategoryById(article.categoryId);
              return (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link 
                    href={`/blog/${article.id}`}
                    className="group block bg-[#0A0A0A] border border-[#222] hover:border-[#333] transition-all"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img 
                        src={article.image} 
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      {category && (
                        <div 
                          className="absolute top-3 left-3 px-2 py-1 text-[10px] font-mono"
                          style={{ backgroundColor: category.color, color: '#000' }}
                        >
                          {category.subtitle}
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-3 text-[10px] text-[#666] mb-3">
                        <span>{article.date}</span>
                        <span>•</span>
                        <span>{article.tags[0]}</span>
                      </div>
                      <h3 className="font-bold text-white mb-2 group-hover:text-[#00FF99] transition-colors line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-xs text-[#666] line-clamp-2">
                        {article.excerpt}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {filteredArticles.map((article, index) => {
              const category = getCategoryById(article.categoryId);
              return (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Link 
                    href={`/blog/${article.id}`}
                    className="group flex gap-6 bg-[#0A0A0A] border border-[#222] hover:border-[#333] transition-all p-4"
                  >
                    <div className="w-48 flex-shrink-0">
                      <div className="aspect-video overflow-hidden">
                        <img 
                          src={article.image} 
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    </div>
                    <div className="flex-1 py-2">
                      <div className="flex items-center gap-3 mb-2">
                        {category && (
                          <span 
                            className="px-2 py-0.5 text-[10px] font-mono"
                            style={{ backgroundColor: category.color, color: '#000' }}
                          >
                            {category.subtitle}
                          </span>
                        )}
                        <span className="text-[10px] text-[#666]">{article.date}</span>
                      </div>
                      <h3 className="font-bold text-white mb-2 group-hover:text-[#00FF99] transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-xs text-[#666] line-clamp-2">
                        {article.excerpt}
                      </p>
                      <div className="flex gap-2 mt-3">
                        {article.tags.map((tag, i) => (
                          <span key={i} className="text-[10px] text-[#555]">#{tag}</span>
                        ))}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#222] py-8 text-center text-xs text-[#555]">
        <p>BLOGSYS © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

export default function BlogListPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>}>
      <BlogListContent />
    </Suspense>
  );
}
