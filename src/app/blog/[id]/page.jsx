import { BLOG_ARTICLES } from '@/data/blogData';
import BlogArticleClient from './BlogArticleClient';

// 為靜態導出生成所有文章路徑
export function generateStaticParams() {
  return BLOG_ARTICLES.map((article) => ({
    id: article.id,
  }));
}

export default async function BlogArticlePage({ params }) {
  const { id } = await params;
  return <BlogArticleClient id={id} />;
}
