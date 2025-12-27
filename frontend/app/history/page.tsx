'use client';

import { useEffect, useState } from 'react';

interface HistoryRecord {
    query: string;
    type: string;
    results_count: number;
    timestamp: string;
}

export default function HistoryPage() {
    const [history, setHistory] = useState<HistoryRecord[]>([]);
    const [filter, setFilter] = useState<string>('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadHistory = async (type?: string) => {
        setLoading(true);
        setError('');

        try {
            const url = type && type !== 'all'
                ? `/api/history?query_type=${type}&limit=100`
                : '/api/history?limit=100';

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error('加载历史记录失败');
            }

            const data = await response.json();
            setHistory(data.history || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : '加载失败');
        } finally {
            setLoading(false);
        }
    };

    const handleClearHistory = async () => {
        if (!confirm('确定要清空所有历史记录吗？')) {
            return;
        }

        try {
            const response = await fetch('/api/history', {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('清空历史记录失败');
            }

            setHistory([]);
        } catch (err) {
            setError(err instanceof Error ? err.message : '清空失败');
        }
    };

    useEffect(() => {
        loadHistory(filter);
    }, [filter]);

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'search':
                return '语义搜索';
            case 'standardize':
                return '术语标准化';
            case 'batch_standardize':
                return '批量标准化';
            case 'fuzzy_match':
                return '模糊匹配';
            default:
                return type;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'search':
                return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400';
            case 'standardize':
                return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400';
            case 'batch_standardize':
                return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
            case 'fuzzy_match':
                return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400';
            default:
                return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400';
        }
    };

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return '刚刚';
        if (minutes < 60) return `${minutes}分钟前`;
        if (hours < 24) return `${hours}小时前`;
        if (days < 7) return `${days}天前`;

        return date.toLocaleDateString('zh-CN');
    };

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="max-w-4xl mx-auto">
                {/* 标题 */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                        📊 历史记录
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        查看和管理您的查询历史
                    </p>
                </div>

                {/* 过滤和操作 */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
                    <div className="flex flex-wrap gap-4 items-center justify-between">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFilter('all')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === 'all'
                                        ? 'bg-gradient-to-r from-green-600 to-green-800 text-white'
                                        : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                                    }`}
                            >
                                全部
                            </button>
                            <button
                                onClick={() => setFilter('search')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === 'search'
                                        ? 'bg-gradient-to-r from-purple-600 to-purple-800 text-white'
                                        : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                                    }`}
                            >
                                搜索
                            </button>
                            <button
                                onClick={() => setFilter('standardize')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === 'standardize'
                                        ? 'bg-gradient-to-r from-blue-600 to-blue-800 text-white'
                                        : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                                    }`}
                            >
                                标准化
                            </button>
                        </div>

                        <button
                            onClick={handleClearHistory}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all"
                        >
                            清空历史
                        </button>
                    </div>
                </div>

                {/* 历史记录列表 */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                        <p className="mt-4 text-gray-600 dark:text-gray-400">加载中...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-6 py-4 rounded-lg">
                        {error}
                    </div>
                ) : history.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
                        <div className="text-6xl mb-4">📭</div>
                        <h3 className="text-xl font-semibold mb-2">暂无历史记录</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            开始使用搜索或标准化功能来创建历史记录
                        </p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                        <h2 className="text-2xl font-bold mb-4">
                            历史记录 ({history.length})
                        </h2>
                        <div className="space-y-3 max-h-[600px] overflow-y-auto">
                            {history.map((record, index) => (
                                <div
                                    key={index}
                                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1">
                                            <div className="font-semibold text-lg mb-1">
                                                {record.query}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                结果数量: {record.results_count}
                                            </div>
                                        </div>
                                        <div className="ml-4 flex flex-col items-end gap-2">
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(record.type)}`}>
                                                {getTypeLabel(record.type)}
                                            </span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {formatTimestamp(record.timestamp)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
