'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Tag, Share2, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { getArticleById, getCategoryById, getArticlesByCategory } from '@/data/blogData';

export default function BlogArticleClient({ id }) {
  const router = useRouter();
  const [article, setArticle] = useState(null);
  const [category, setCategory] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);

  useEffect(() => {
    const articleData = getArticleById(id);
    if (articleData) {
      setArticle(articleData);
      const categoryData = getCategoryById(articleData.categoryId);
      setCategory(categoryData);
      const related = getArticlesByCategory(articleData.categoryId)
        .filter(a => a.id !== articleData.id)
        .slice(0, 3);
      setRelatedArticles(related);
    }
  }, [id]);

  if (!article) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-[#00FF99] font-mono animate-pulse">LOADING...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-[#EAEAEA] font-mono">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 border-b border-[#222] backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm hover:text-[#00FF99] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            BACK
          </button>
          <Link href="/" className="text-xs tracking-widest font-bold">
            BLOG<span className="text-[#333]">_SYS</span>
          </Link>
          <button className="flex items-center gap-2 text-sm hover:text-[#00FF99] transition-colors">
            <Share2 className="w-4 h-4" />
            SHARE
          </button>
        </div>
      </header>

      {/* Hero Image */}
      <div className="pt-14">
        <div className="relative h-[40vh] md:h-[50vh] overflow-hidden">
          <img 
            src={article.image} 
            alt={article.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          
          {category && (
            <div 
              className="absolute top-8 left-4 md:left-8 px-3 py-1 text-xs font-mono"
              style={{ backgroundColor: category.color, color: '#000' }}
            >
              {category.subtitle}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-12">
        {/* Meta Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-wrap items-center gap-4 text-xs text-[#666] mb-4">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {article.date}
            </span>
            <span className="flex items-center gap-1">
              <Tag className="w-3 h-3" />
              {article.tags.join(' • ')}
            </span>
          </div>
          
          <h1 
            className="text-3xl md:text-4xl font-bold text-white mb-4"
            style={{ fontFamily: "'Chakra Petch', sans-serif" }}
          >
            {article.title}
          </h1>
          
          <p className="text-[#888] text-lg">
            {article.excerpt}
          </p>
        </motion.div>

        {/* Article Content */}
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="prose prose-invert prose-lg max-w-none
            prose-headings:font-bold prose-headings:text-white
            prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
            prose-p:text-[#AAA] prose-p:leading-relaxed
            prose-li:text-[#AAA]
            prose-strong:text-white
            prose-a:text-[#00FF99] prose-a:no-underline hover:prose-a:underline
            prose-blockquote:border-l-[#00FF99] prose-blockquote:text-[#888]
            prose-code:text-[#00FF99] prose-code:bg-[#111] prose-code:px-1 prose-code:rounded
          "
        >
          {article.content.split('\n').map((line, index) => {
            // YouTube embed
            const youtubeMatch = line.match(/\[youtube:([a-zA-Z0-9_-]+)\]/);
            if (youtubeMatch) {
              return (
                <div key={index} className="my-6 aspect-video not-prose">
                  <iframe
                    src={`https://www.youtube.com/embed/${youtubeMatch[1]}`}
                    className="w-full h-full"
                    allowFullScreen
                    title="YouTube video"
                  />
                </div>
              );
            }
            
            // Image
            const imageMatch = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
            if (imageMatch) {
              return (
                <figure key={index} className="my-6 not-prose">
                  <img 
                    src={imageMatch[2]} 
                    alt={imageMatch[1]} 
                    className="w-full h-auto rounded"
                  />
                  {imageMatch[1] && (
                    <figcaption className="text-xs text-[#555] mt-2 text-center">
                      {imageMatch[1]}
                    </figcaption>
                  )}
                </figure>
              );
            }
            
            if (line.startsWith('# ')) {
              return <h1 key={index}>{line.slice(2)}</h1>;
            }
            if (line.startsWith('## ')) {
              return <h2 key={index}>{line.slice(3)}</h2>;
            }
            if (line.startsWith('### ')) {
              return <h3 key={index}>{line.slice(4)}</h3>;
            }
            if (line.startsWith('- ')) {
              return <li key={index}>{line.slice(2)}</li>;
            }
            
            let text = line;
            if (text.includes('**') || text.includes('*')) {
              text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
              text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
              if (text.trim() === '') return <br key={index} />;
              return <p key={index} dangerouslySetInnerHTML={{ __html: text }} />;
            }
            
            if (line.trim() === '') {
              return <br key={index} />;
            }
            return <p key={index}>{line}</p>;
          })}
        </motion.article>

        {/* Tags */}
        <div className="mt-12 pt-8 border-t border-[#222]">
          <div className="flex flex-wrap gap-2">
            {article.tags.map((tag, index) => (
              <span 
                key={index}
                className="px-3 py-1 bg-[#111] border border-[#333] text-xs text-[#888]"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <div className="mt-16">
            <h3 className="text-xs font-mono text-[#555] tracking-widest mb-6">
              // RELATED ARTICLES
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {relatedArticles.map((related) => (
                <Link 
                  key={related.id}
                  href={`/blog/${related.id}`}
                  className="group block bg-[#0A0A0A] border border-[#222] hover:border-[#00FF99] transition-colors"
                >
                  <div className="aspect-video overflow-hidden">
                    <img 
                      src={related.image} 
                      alt={related.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-[#666] mb-2">{related.date}</p>
                    <h4 className="text-sm font-bold text-white group-hover:text-[#00FF99] transition-colors line-clamp-2">
                      {related.title}
                    </h4>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Back to Blog */}
        <div className="mt-16 text-center">
          <Link 
            href="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 border border-[#333] hover:border-[#00FF99] hover:text-[#00FF99] transition-colors text-sm"
          >
            VIEW ALL ARTICLES
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#222] py-8 text-center text-xs text-[#555]">
        <p>BLOGSYS © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
