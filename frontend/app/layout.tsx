import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
    title: "金融术语标准化系统",
    description: "提供金融术语查询、匹配和标准化服务",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="zh-CN">
            <body className="antialiased">
                <div className="min-h-screen flex flex-col">
                    {/* 导航栏 */}
                    <nav className="bg-gradient-to-r from-primary-600 to-primary-800 text-white shadow-lg">
                        <div className="container mx-auto px-4 py-4">
                            <div className="flex justify-between items-center">
                                <Link href="/" className="text-2xl font-bold hover:text-primary-100 transition-colors">
                                    💼 金融术语标准化系统
                                </Link>
                                <div className="flex gap-6">
                                    <Link href="/" className="hover:text-primary-200 transition-colors">
                                        首页
                                    </Link>
                                    <Link href="/search" className="hover:text-primary-200 transition-colors">
                                        语义搜索
                                    </Link>
                                    <Link href="/standardize" className="hover:text-primary-200 transition-colors">
                                        文本术语识别
                                    </Link>
                                    <Link href="/history" className="hover:text-primary-200 transition-colors">
                                        历史记录
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </nav>

                    {/* 主要内容 */}
                    <main className="flex-1">
                        {children}
                    </main>

                    {/* 页脚 */}
                    <footer className="bg-gray-100 dark:bg-gray-900 mt-12">
                        <div className="container mx-auto px-4 py-6 text-center text-gray-600 dark:text-gray-400">
                            <p>金融术语标准化系统 © 2025 | 基于 Next.js + FastAPI 构建</p>
                        </div>
                    </footer>
                </div>
            </body>
        </html>
    );
}
