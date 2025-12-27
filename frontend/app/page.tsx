'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Stats {
    data: {
        total_terms: number;
        unique_labels: number;
    };
    history: {
        total_records: number;
        type_counts: Record<string, number>;
    };
}

export default function Home() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/stats')
            .then(res => res.json())
            .then(data => {
                setStats(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('获取统计信息失败:', err);
                setLoading(false);
            });
    }, []);

    return (
        <div className="container mx-auto px-4 py-12">
            {/* 欢迎部分 */}
            <div className="text-center mb-16">
                <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                    金融术语标准化系统
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
                    基于语义理解的智能金融术语查询与标准化平台
                </p>
            </div>

            {/* 统计信息 */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">加载中...</p>
                </div>
            ) : stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-t-4 border-primary-500">
                        <div className="text-4xl font-bold text-primary-600 mb-2">
                            {stats.data.total_terms.toLocaleString()}
                        </div>
                        <div className="text-gray-600 dark:text-gray-400">标准术语总数</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-t-4 border-green-500">
                        <div className="text-4xl font-bold text-green-600 mb-2">
                            {stats.data.unique_labels}
                        </div>
                        <div className="text-gray-600 dark:text-gray-400">术语分类数</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-t-4 border-blue-500">
                        <div className="text-4xl font-bold text-blue-600 mb-2">
                            {stats.history.total_records}
                        </div>
                        <div className="text-gray-600 dark:text-gray-400">历史查询记录</div>
                    </div>
                </div>
            )}

            {/* 功能卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Link href="/search" className="group">
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                        <div className="text-5xl mb-4">🔍</div>
                        <h2 className="text-2xl font-bold mb-3 text-purple-900 dark:text-purple-100">
                            语义搜索
                        </h2>
                        <p className="text-purple-700 dark:text-purple-300">
                            基于 BAAI/bge-m3 向量模型，通过语义理解找到最相关的金融术语
                        </p>
                        <div className="mt-4 text-purple-600 dark:text-purple-400 group-hover:translate-x-2 transition-transform inline-flex items-center">
                            开始搜索 →
                        </div>
                    </div>
                </Link>

                <Link href="/standardize" className="group">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                        <div className="text-5xl mb-4">📝</div>
                        <h2 className="text-2xl font-bold mb-3 text-blue-900 dark:text-blue-100">
                            文本术语识别
                        </h2>
                        <p className="text-blue-700 dark:text-blue-300">
                            输入一段文本，自动识别其中的金融术语并替换为标准术语
                        </p>
                        <div className="mt-4 text-blue-600 dark:text-blue-400 group-hover:translate-x-2 transition-transform inline-flex items-center">
                            开始识别 →
                        </div>
                    </div>
                </Link>

                <Link href="/history" className="group">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                        <div className="text-5xl mb-4">📊</div>
                        <h2 className="text-2xl font-bold mb-3 text-green-900 dark:text-green-100">
                            历史记录
                        </h2>
                        <p className="text-green-700 dark:text-green-300">
                            查看和管理您的查询历史，快速复用之前的搜索结果
                        </p>
                        <div className="mt-4 text-green-600 dark:text-green-400 group-hover:translate-x-2 transition-transform inline-flex items-center">
                            查看历史 →
                        </div>
                    </div>
                </Link>
            </div>

            {/* 特性说明 */}
            <div className="mt-16 bg-gradient-to-r from-primary-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-8">
                <h2 className="text-2xl font-bold mb-6 text-center">系统特性</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-start gap-3">
                        <div className="text-2xl">🚀</div>
                        <div>
                            <h3 className="font-bold mb-1">高性能搜索</h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                基于 ChromaDB 向量数据库，毫秒级响应
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="text-2xl">🎯</div>
                        <div>
                            <h3 className="font-bold mb-1">智能匹配</h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                结合模糊匹配和语义搜索，提供最准确的结果
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="text-2xl">📝</div>
                        <div>
                            <h3 className="font-bold mb-1">批量处理</h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                支持批量术语标准化，提高工作效率
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="text-2xl">💾</div>
                        <div>
                            <h3 className="font-bold mb-1">历史追踪</h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                自动记录查询历史，方便回顾和管理
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
