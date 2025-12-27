"""
术语处理服务
提供精确匹配和语义搜索功能
"""
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)


class TermService:
    """术语处理服务"""
    
    def __init__(self, data_loader, vector_service=None):
        """
        初始化术语服务
        
        Args:
            data_loader: 数据加载器实例
            vector_service: 向量服务实例（用于语义匹配）
        """
        self.data_loader = data_loader
        self.vector_service = vector_service
        self.terms_list = []
        self._load_terms()
    
    def _load_terms(self):
        """加载术语列表"""
        self.terms_list = self.data_loader.get_all_terms()
        logger.info(f"术语服务已加载 {len(self.terms_list)} 条术语")
    
    def standardize(
        self, 
        query: str, 
        semantic_threshold: float = 0.65
    ) -> Dict:
        """
        标准化术语（使用精确匹配和语义搜索）
        
        Args:
            query: 待标准化的术语
            semantic_threshold: 语义匹配阈值 (0-1)
            
        Returns:
            标准化结果字典
        """
        if not query:
            return {
                'query': query,
                'standard_term': None,
                'score': 0,
                'match_type': 'none',
                'message': '查询为空',
                'candidates': []
            }
        
        # 策略1: 精确匹配（优先级最高）
        exact_matches = self.data_loader.search_exact(query)
        if exact_matches:
            logger.info(f"精确匹配成功: '{query}' → '{exact_matches[0]['term']}'")
            return {
                'query': query,
                'standard_term': exact_matches[0]['term'],
                'score': 100.0,
                'match_type': 'exact',
                'similarity': 1.0,
                'message': '精确匹配',
                'candidates': []
            }
        
        # 策略2: 语义向量匹配（如果向量服务可用）
        if self.vector_service and self.vector_service.is_initialized:
            try:
                semantic_results = self.vector_service.search_similar(query, top_k=5)
                
                if semantic_results:
                    best_semantic = semantic_results[0]
                    semantic_similarity = best_semantic['similarity']
                    
                    # 构建候选列表
                    candidates = []
                    for sem_result in semantic_results:
                        candidates.append({
                            'term': sem_result['term'],
                            'score': round(sem_result['similarity'] * 100, 2),
                            'similarity': sem_result['similarity'],
                            'source': 'semantic'
                        })
                    
                    # 如果语义相似度超过阈值
                    if semantic_similarity >= semantic_threshold:
                        logger.info(f"语义匹配成功: '{query}' → '{best_semantic['term']}' ({semantic_similarity:.2%})")
                        return {
                            'query': query,
                            'standard_term': best_semantic['term'],
                            'score': round(semantic_similarity * 100, 2),
                            'match_type': 'semantic',
                            'similarity': round(semantic_similarity, 4),
                            'message': '语义匹配',
                            'candidates': candidates
                        }
                    else:
                        # 相似度不够，但返回候选项供参考
                        logger.info(f"语义匹配得分较低: '{query}' 最佳匹配 '{best_semantic['term']}' ({semantic_similarity:.2%})")
                        return {
                            'query': query,
                            'standard_term': None,
                            'score': round(semantic_similarity * 100, 2),
                            'match_type': 'semantic_low',
                            'similarity': round(semantic_similarity, 4),
                            'message': f'语义匹配置信度较低（阈值={semantic_threshold:.2f}）',
                            'candidates': candidates
                        }
            except Exception as e:
                logger.error(f"语义匹配失败: {str(e)}")
        
        # 未找到任何匹配
        logger.info(f"未找到匹配: '{query}'")
        return {
            'query': query,
            'standard_term': None,
            'score': 0,
            'match_type': 'none',
            'message': f'未找到匹配项（语义阈值={semantic_threshold:.2f}）',
            'candidates': []
        }
    
    def batch_standardize(
        self, 
        queries: List[str], 
        semantic_threshold: float = 0.65
    ) -> List[Dict]:
        """
        批量标准化术语
        
        Args:
            queries: 待标准化的术语列表
            semantic_threshold: 语义匹配阈值
            
        Returns:
            标准化结果列表
        """
        results = []
        for query in queries:
            result = self.standardize(query.strip(), semantic_threshold)
            results.append(result)
        
        logger.info(f"批量标准化 {len(queries)} 个术语")
        return results
    
    def get_similar_terms(
        self, 
        term: str, 
        limit: int = 5,
        threshold: float = 0.5
    ) -> List[Dict]:
        """
        获取相似术语（使用语义搜索）
        
        Args:
            term: 参考术语
            limit: 返回数量
            threshold: 相似度阈值
            
        Returns:
            相似术语列表
        """
        if not self.vector_service or not self.vector_service.is_initialized:
            logger.warning("向量服务不可用，无法获取相似术语")
            return []
        
        try:
            # 使用语义搜索找到相似术语
            results = self.vector_service.search_similar(term, top_k=limit + 5)
            
            similar_terms = []
            for result in results:
                # 排除完全相同的术语，且相似度要超过阈值
                if result['term'].lower() != term.lower() and result['similarity'] >= threshold:
                    similar_terms.append({
                        'term': result['term'],
                        'similarity': round(result['similarity'], 4)
                    })
                    if len(similar_terms) >= limit:
                        break
            
            return similar_terms
        except Exception as e:
            logger.error(f"获取相似术语失败: {str(e)}")
            return []

    def identify_and_replace_terms(
        self,
        text: str,
        similarity_threshold: float = 0.6,
        min_word_length: int = 2
    ) -> Dict:
        """
        识别文本中的金融术语并替换为标准术语
        
        Args:
            text: 输入文本
            similarity_threshold: 语义匹配阈值
            min_word_length: 最小词长度
            
        Returns:
            包含原文本、替换后文本和识别的术语列表
        """
        if not text or not self.vector_service or not self.vector_service.is_initialized:
            return {
                'original_text': text,
                'processed_text': text,
                'identified_terms': [],
                'replacements': [],
                'message': '文本为空或向量服务不可用'
            }
        
        import re
        
        # 分词：提取可能的术语
        potential_terms = []
        seen = set()
        
        # 策略1: 提取单个英文单词（包含数字、连字符等）
        single_words = re.findall(r'\b[A-Za-z][A-Za-z0-9\-/\&]*\b', text)
        for word in single_words:
            word_lower = word.lower()
            if len(word) >= min_word_length and word_lower not in seen:
                potential_terms.append(word)
                seen.add(word_lower)
        
        # 策略2: 提取2-3词的常见短语（限制长度避免提取整段文字）
        bigrams = re.findall(r'\b[A-Za-z][A-Za-z0-9\-/\&]*\s+[A-Za-z][A-Za-z0-9\-/\&]*\b', text)
        for phrase in bigrams:
            phrase_lower = phrase.lower()
            if phrase_lower not in seen:
                potential_terms.append(phrase)
                seen.add(phrase_lower)
        
        trigrams = re.findall(r'\b[A-Za-z][A-Za-z0-9\-/\&]*\s+[A-Za-z][A-Za-z0-9\-/\&]*\s+[A-Za-z][A-Za-z0-9\-/\&]*\b', text)
        for phrase in trigrams:
            phrase_lower = phrase.lower()
            if phrase_lower not in seen:
                potential_terms.append(phrase)
                seen.add(phrase_lower)
        
        # 策略3: 提取中文术语（2-6个汉字的词组）
        chinese_terms = re.findall(r'[\u4e00-\u9fff]{2,6}', text)
        for term in chinese_terms:
            term_lower = term.lower()
            if term_lower not in seen:
                potential_terms.append(term)
                seen.add(term_lower)
        
        logger.info(f"从文本中提取了 {len(potential_terms)} 个潜在术语")
        
        identified_terms = []
        replacements = {}
        
        # 对每个潜在术语进行语义搜索
        for term in potential_terms:
            try:
                # 首先检查是否精确匹配
                exact_matches = self.data_loader.search_exact(term)
                if exact_matches:
                    standard_term = exact_matches[0]['term']
                    if term != standard_term:  # 只有不同时才记录
                        identified_terms.append({
                            'original': term,
                            'standard': standard_term,
                            'similarity': 1.0,
                            'match_type': 'exact'
                        })
                        replacements[term] = standard_term
                    continue
                
                # 使用语义搜索
                results = self.vector_service.search_similar(term, top_k=1)
                if results and len(results) > 0:
                    best_match = results[0]
                    if best_match['similarity'] >= similarity_threshold:
                        standard_term = best_match['term']
                        # 只有当标准术语与原术语不同时才记录
                        if term.lower() != standard_term.lower():
                            identified_terms.append({
                                'original': term,
                                'standard': standard_term,
                                'similarity': best_match['similarity'],
                                'match_type': 'semantic'
                            })
                            replacements[term] = standard_term
            except Exception as e:
                logger.error(f"处理术语 '{term}' 时出错: {str(e)}")
                continue
        
        # 替换文本中的术语（保持大小写）
        processed_text = text
        replacement_records = []
        
        # 按长度降序排序，优先替换长术语（避免部分匹配问题）
        sorted_terms = sorted(identified_terms, key=lambda x: len(x['original']), reverse=True)
        
        for item in sorted_terms:
            original = item['original']
            standard = item['standard']
            
            # 使用正则表达式进行全词匹配
            pattern = r'\b' + re.escape(original) + r'\b'
            
            # 统计替换次数
            count = len(re.findall(pattern, processed_text, re.IGNORECASE))
            if count > 0:
                processed_text = re.sub(pattern, standard, processed_text, flags=re.IGNORECASE)
                replacement_records.append({
                    'original': original,
                    'standard': standard,
                    'count': count,
                    'similarity': item['similarity'],
                    'match_type': item['match_type']
                })
        
        logger.info(f"识别并替换了 {len(replacement_records)} 个术语")
        
        return {
            'original_text': text,
            'processed_text': processed_text,
            'identified_terms': identified_terms,
            'replacements': replacement_records,
            'total_replacements': sum(r['count'] for r in replacement_records),
            'message': f'成功识别 {len(identified_terms)} 个术语，执行 {sum(r["count"] for r in replacement_records)} 次替换'
        }

