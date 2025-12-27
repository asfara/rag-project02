"""
历史记录服务
负责记录和管理用户的搜索历史
"""
import json
from pathlib import Path
from datetime import datetime
from typing import List, Dict
import logging

logger = logging.getLogger(__name__)


class HistoryService:
    """历史记录服务"""
    
    def __init__(self, history_file: Path, max_items: int = 1000):
        """
        初始化历史记录服务
        
        Args:
            history_file: 历史记录文件路径
            max_items: 最大记录数量
        """
        self.history_file = history_file
        self.max_items = max_items
        self._ensure_file_exists()
    
    def _ensure_file_exists(self):
        """确保历史记录文件存在"""
        if not self.history_file.exists():
            self.history_file.parent.mkdir(parents=True, exist_ok=True)
            self._save_history([])
    
    def _load_history(self) -> List[Dict]:
        """
        加载历史记录
        
        Returns:
            历史记录列表
        """
        try:
            with open(self.history_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"加载历史记录失败: {str(e)}")
            return []
    
    def _save_history(self, history: List[Dict]):
        """
        保存历史记录
        
        Args:
            history: 历史记录列表
        """
        try:
            with open(self.history_file, 'w', encoding='utf-8') as f:
                json.dump(history, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"保存历史记录失败: {str(e)}")
    
    def add_record(self, query: str, query_type: str, results_count: int):
        """
        添加一条历史记录
        
        Args:
            query: 查询内容
            query_type: 查询类型 (search/standardize/match)
            results_count: 结果数量
        """
        history = self._load_history()
        
        # 创建新记录
        record = {
            'query': query,
            'type': query_type,
            'results_count': results_count,
            'timestamp': datetime.now().isoformat()
        }
        
        # 添加到历史记录开头
        history.insert(0, record)
        
        # 限制历史记录数量
        if len(history) > self.max_items:
            history = history[:self.max_items]
        
        self._save_history(history)
        logger.info(f"添加历史记录: {query} ({query_type})")
    
    def get_recent(self, limit: int = 20) -> List[Dict]:
        """
        获取最近的历史记录
        
        Args:
            limit: 返回记录数量
            
        Returns:
            历史记录列表
        """
        history = self._load_history()
        return history[:limit]
    
    def get_by_type(self, query_type: str, limit: int = 20) -> List[Dict]:
        """
        按类型获取历史记录
        
        Args:
            query_type: 查询类型
            limit: 返回记录数量
            
        Returns:
            历史记录列表
        """
        history = self._load_history()
        filtered = [h for h in history if h.get('type') == query_type]
        return filtered[:limit]
    
    def clear_history(self):
        """清空历史记录"""
        self._save_history([])
        logger.info("历史记录已清空")
    
    def get_stats(self) -> Dict:
        """
        获取历史记录统计信息
        
        Returns:
            统计信息字典
        """
        history = self._load_history()
        
        # 统计各类型数量
        type_counts = {}
        for record in history:
            query_type = record.get('type', 'unknown')
            type_counts[query_type] = type_counts.get(query_type, 0) + 1
        
        return {
            'total_records': len(history),
            'type_counts': type_counts,
            'oldest_record': history[-1]['timestamp'] if history else None,
            'newest_record': history[0]['timestamp'] if history else None
        }
