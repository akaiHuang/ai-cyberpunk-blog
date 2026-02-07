/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // 取消註解以啟用靜態導出模式
  // basePath: '/blog', // 設定基礎路徑（部署到子目錄時啟用）
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
