import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const metadata = {
  title: 'BlogSys - 部落格系統',
  description: '可移植的 Next.js 部落格系統',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-TW">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
