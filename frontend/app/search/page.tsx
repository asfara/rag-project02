'use client';

import { useState } from 'react';

interface SearchResult {
    term: string;
    similarity: number;
    distance: number;
    match_type: string;
}

export default function SearchPage() {
    const [query, setQuery] = useState('');
    const [topK, setTopK] = useState(10);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async () => {
        if (!query.trim()) {
            setError('请输入搜索内容');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query, top_k: topK }),
            });

            if (!response.ok) {
                throw new Error('搜索失败');
            }

            const data = await response.json();
            setResults(data.results || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : '搜索失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="max-w-4xl mx-auto">
                {/* 标题 */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                        🔍 语义搜索
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        基于 BAAI/bge-m3 向量模型，通过语义理解找到最相关的金融术语
                    </p>
                </div>

                {/* 搜索框 */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">
                            搜索内容
                        </label>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="输入术语或描述，例如：stock market, 股票..."
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">
                            返回结果数量: {topK}
                        </label>
                        <input
                            type="range"
                            min="1"
                            max="50"
                            value={topK}
                            onChange={(e) => setTopK(parseInt(e.target.value))}
                            className="w-full"
                        />
                    </div>

                    <button
                        onClick={handleSearch}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-purple-600 to-purple-800 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-purple-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? '搜索中...' : '开始搜索'}
                    </button>

                    {error && (
                        <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}
                </div>

                {/* 搜索结果 */}
                {results.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                        <h2 className="text-2xl font-bold mb-4">
                            搜索结果 ({results.length})
                        </h2>
                        <div className="space-y-3">
                            {results.map((result, index) => (
                                <div
                                    key={index}
                                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                                                {result.term}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                相似度: {(result.similarity * 100).toFixed(2)}%
                                            </div>
                                        </div>
                                        <div className="ml-4">
                                            <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 px-3 py-1 rounded-full text-sm">
                                                #{index + 1}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-2">
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                            <div
                                                className="bg-gradient-to-r from-purple-500 to-purple-700 h-2 rounded-full transition-all"
                                                style={{ width: `${result.similarity * 100}%` }}
                                            />
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
