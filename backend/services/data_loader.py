"""
数据加载服务
负责加载和预处理金融术语数据
"""
import pandas as pd
from pathlib import Path
from typing import List, Dict
import logging

logger = logging.getLogger(__name__)


class DataLoader:
    """数据加载器"""
    
    def __init__(self, data_file: Path):
        """
        初始化数据加载器
        
        Args:
            data_file: CSV数据文件路径
        """
        self.data_file = data_file
        self.terms_df = None
        self.terms_list = []
        
    def load_data(self) -> pd.DataFrame:
        """
        加载CSV数据
        
        Returns:
            包含术语数据的DataFrame
        """
        try:
            # 读取CSV文件
            self.terms_df = pd.read_csv(
                self.data_file,
                encoding='utf-8',
                names=['term', 'label'],  # 指定列名
                header=0  # 跳过第一行（如果有标题）
            )
            
            # 数据清洗
            # 去除空值
            self.terms_df = self.terms_df.dropna(subset=['term'])
            
            # 去除重复项
            original_count = len(self.terms_df)
            self.terms_df = self.terms_df.drop_duplicates(subset=['term'])
            duplicates_removed = original_count - len(self.terms_df)
            
            if duplicates_removed > 0:
                logger.info(f"去除了 {duplicates_removed} 个重复术语")
            
            # 去除前后空格
            self.terms_df['term'] = self.terms_df['term'].str.strip()
            
            # 创建术语列表
            self.terms_list = self.terms_df['term'].tolist()
            
            logger.info(f"成功加载 {len(self.terms_list)} 条金融术语")
            
            return self.terms_df
            
        except Exception as e:
            logger.error(f"加载数据失败: {str(e)}")
            raise
    
    def get_all_terms(self) -> List[str]:
        """
        获取所有术语列表
        
        Returns:
            术语列表
        """
        if not self.terms_list:
            self.load_data()
        return self.terms_list
    
    def get_terms_dataframe(self) -> pd.DataFrame:
        """
        获取术语DataFrame
        
        Returns:
            术语DataFrame
        """
        if self.terms_df is None:
            self.load_data()
        return self.terms_df
    
    def get_term_by_index(self, index: int) -> str:
        """
        根据索引获取术语
        
        Args:
            index: 术语索引
            
        Returns:
            术语字符串
        """
        if not self.terms_list:
            self.load_data()
        return self.terms_list[index]
    
    def search_exact(self, query: str) -> List[Dict]:
        """
        精确搜索术语
        
        Args:
            query: 搜索查询
            
        Returns:
            匹配结果列表
        """
        if self.terms_df is None:
            self.load_data()
        
        # 不区分大小写的精确匹配
        matches = self.terms_df[
            self.terms_df['term'].str.lower() == query.lower()
        ]
        
        results = []
        for _, row in matches.iterrows():
            results.append({
                'term': row['term'],
                'label': row['label'],
                'match_type': 'exact'
            })
        
        return results
    
    def get_stats(self) -> Dict:
        """
        获取数据统计信息
        
        Returns:
            统计信息字典
        """
        if self.terms_df is None:
            self.load_data()
        
        return {
            'total_terms': len(self.terms_list),
            'unique_labels': self.terms_df['label'].nunique(),
            'data_file': str(self.data_file)
        }
