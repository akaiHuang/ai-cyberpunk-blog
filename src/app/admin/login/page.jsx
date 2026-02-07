'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, User, Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/admin/blog');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // 模擬延遲以防止暴力破解
    await new Promise(resolve => setTimeout(resolve, 500));

    const result = login(username, password);
    
    if (result.success) {
      router.push('/admin/blog');
    } else {
      setError(result.error);
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-[#00FF99] font-mono text-lg animate-pulse mb-4">LOADING...</div>
          <div className="text-[#555] text-sm">正在載入...</div>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 font-mono">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 border-b border-[#222] backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link 
            href="/"
            className="flex items-center gap-2 text-sm hover:text-[#00FF99] transition-colors text-[#EAEAEA]"
          >
            <ArrowLeft className="w-4 h-4" />
            HOME
          </Link>
          <span className="text-xs tracking-widest text-[#EAEAEA]">
            ADMIN<span className="text-[#333]">_LOGIN</span>
          </span>
          <div className="w-16" />
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        {/* 登入卡片 */}
        <div className="bg-[#0A0A0A] border border-[#222] p-8">
          {/* Corner decorations */}
          <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-[#00FF99]" />
          <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-[#00FF99]" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-[#00FF99]" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-[#00FF99]" />

          {/* Logo / 標題 */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 border-2 border-[#00FF99] mx-auto mb-4 flex items-center justify-center">
              <Lock className="w-8 h-8 text-[#00FF99]" />
            </div>
            <h1 className="text-xl font-bold text-[#EAEAEA] mb-2 tracking-wider">ADMIN_ACCESS</h1>
            <p className="text-[#555] text-xs tracking-wide">AUTHENTICATION REQUIRED</p>
          </div>

          {/* 錯誤訊息 */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-3 bg-red-500/10 border border-red-500/30 flex items-center gap-3"
            >
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span className="text-red-400 text-xs">{error}</span>
            </motion.div>
          )}

          {/* 登入表單 */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 帳號輸入 */}
            <div>
              <label className="block text-xs text-[#555] mb-2 tracking-wider">
                USERNAME
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full bg-[#111] border border-[#333] pl-10 pr-4 py-3 text-[#EAEAEA] text-sm placeholder-[#444] focus:outline-none focus:border-[#00FF99] transition-colors font-mono"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            {/* 密碼輸入 */}
            <div>
              <label className="block text-xs text-[#555] mb-2 tracking-wider">
                PASSWORD
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-[#111] border border-[#333] pl-10 pr-10 py-3 text-[#EAEAEA] text-sm placeholder-[#444] focus:outline-none focus:border-[#00FF99] transition-colors font-mono"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#888] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 登入按鈕 */}
            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
              whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
              className="w-full bg-[#00FF99] text-black font-bold py-3 text-sm tracking-wider hover:bg-[#00CC7A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  VERIFYING...
                </>
              ) : (
                'LOGIN'
              )}
            </motion.button>
          </form>

          {/* 底部提示 */}
          <p className="mt-6 text-center text-[10px] text-[#333] tracking-widest">
            BLOGSYS_ADMIN_v1.0
          </p>
        </div>
      </motion.div>
    </div>
  );
}
