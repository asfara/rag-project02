'use client';

import { useState } from 'react';

interface Replacement {
    original: string;
    standard: string;
    count: number;
    similarity: number;
    match_type: string;
}

interface TextProcessResult {
    original_text: string;
    processed_text: string;
    identified_terms: any[];
    replacements: Replacement[];
    total_replacements: number;
    message: string;
}

export default function StandardizePage() {
    const [inputText, setInputText] = useState('');
    const [threshold, setThreshold] = useState(60);
    const [result, setResult] = useState<TextProcessResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleProcess = async () => {
        if (!inputText.trim()) {
            setError('请输入文本');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/standardize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ term: inputText, threshold }),
            });

            if (!response.ok) {
                throw new Error('处理失败');
            }

            const data = await response.json();
            setResult(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : '处理失败');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('已复制到剪贴板');
    };

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="max-w-5xl mx-auto">
                {/* 标题 */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                        ✨ 文本术语识别
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        输入一段文本，系统将自动识别其中的金融术语并替换为标准术语
                    </p>
                </div>

                {/* 输入区域 */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
                    {/* 阈值设置 */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2">
                            相似度阈值: {threshold}%
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={threshold}
                            onChange={(e) => setThreshold(parseInt(e.target.value))}
                            className="w-full"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            阈值越高，识别要求越严格
                        </p>
                    </div>

                    {/* 文本输入 */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            输入文本
                        </label>
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="例如：I want to invest in stock mkt and buy some shares. The equity market is growing."
                            rows={6}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 mb-4"
                        />
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                字符数: {inputText.length}
                            </span>
                            <button
                                onClick={handleProcess}
                                disabled={loading}
                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? '处理中...' : '🔍 识别术语'}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}
                </div>

                {/* 处理结果 */}
                {result && (
                    <div className="space-y-6">
                        {/* 统计信息 */}
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6">
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                        {result.replacements.length}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        识别的术语
                                    </div>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                                        {result.total_replacements}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        替换次数
                                    </div>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                                        {result.replacements.filter(r => r.match_type === 'semantic').length}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        语义匹配
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 原文 vs 处理后 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* 原文 */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-bold">原文</h3>
                                    <button
                                        onClick={() => copyToClipboard(result.original_text)}
                                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                        📋 复制
                                    </button>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap">
                                    {result.original_text}
                                </div>
                            </div>

                            {/* 处理后 */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-bold">处理后</h3>
                                    <button
                                        onClick={() => copyToClipboard(result.processed_text)}
                                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                        📋 复制
                                    </button>
                                </div>
                                <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap">
                                    {result.processed_text}
                                </div>
                            </div>
                        </div>

                        {/* 识别的术语列表 */}
                        {result.replacements.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                                <h3 className="text-2xl font-bold mb-4">识别的术语</h3>
                                <div className="space-y-3">
                                    {result.replacements.map((replacement, idx) => (
                                        <div
                                            key={idx}
                                            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className="text-gray-600 dark:text-gray-400 line-through">
                                                            {replacement.original}
                                                        </span>
                                                        <span className="text-xl">→</span>
                                                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                                                            {replacement.standard}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                                        <span>替换次数: {replacement.count}</span>
                                                        <span>相似度: {(replacement.similarity * 100).toFixed(1)}%</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <span
                                                        className={`px-3 py-1 rounded-full text-xs font-medium ${replacement.match_type === 'exact'
                                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                                                                : 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400'
                                                            }`}
                                                    >
                                                        {replacement.match_type === 'exact' ? '✓ 精确' : '🧠 语义'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 无结果提示 */}
                        {result.replacements.length === 0 && (
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6 text-center">
                                <div className="text-4xl mb-3">🔍</div>
                                <h3 className="text-lg font-semibold mb-2">未识别到术语</h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    文本中没有找到匹配的金融术语，或相似度低于设定阈值
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
