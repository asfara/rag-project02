"""
向量服务
使用 BAAI/bge-m3 模型进行语义相似度搜索
"""
from sentence_transformers import SentenceTransformer
import chromadb
from chromadb.config import Settings
from typing import List, Dict, Optional
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


class VectorService:
    """向量服务"""
    
    def __init__(
        self, 
        model_name: str,
        chroma_dir: Path,
        collection_name: str
    ):
        """
        初始化向量服务
        
        Args:
            model_name: 向量模型名称
            chroma_dir: ChromaDB存储目录
            collection_name: 集合名称
        """
        self.model_name = model_name
        self.chroma_dir = chroma_dir
        self.collection_name = collection_name
        
        # 初始化模型和数据库
        self.model = None
        self.chroma_client = None
        self.collection = None
        self.is_initialized = False
    
    def initialize(self, terms_list: List[str]):
        """
        初始化向量服务（加载模型和构建索引）
        
        Args:
            terms_list: 术语列表
        """
        if self.is_initialized:
            logger.info("向量服务已初始化，跳过")
            return
        
        logger.info(f"开始初始化向量服务，使用模型: {self.model_name}")
        
        # 加载 Sentence Transformer 模型
        logger.info("正在加载向量模型...")
        self.model = SentenceTransformer(self.model_name)
        logger.info("向量模型加载完成")
        
        # 初始化 ChromaDB
        logger.info("正在初始化 ChromaDB...")
        self.chroma_dir.mkdir(parents=True, exist_ok=True)
        
        self.chroma_client = chromadb.PersistentClient(
            path=str(self.chroma_dir),
            settings=Settings(
                anonymized_telemetry=False,
                allow_reset=True
            )
        )
        
        # 尝试获取或创建集合
        try:
            self.collection = self.chroma_client.get_collection(
                name=self.collection_name
            )
            logger.info(f"找到已存在的集合: {self.collection_name}")
            
            # 检查集合中的文档数量
            count = self.collection.count()
            if count == len(terms_list):
                logger.info(f"集合已包含所有术语 ({count} 条)，跳过重建索引")
                self.is_initialized = True
                return
            else:
                logger.info(f"集合术语数量 ({count}) 与数据不符，重建索引")
                self.chroma_client.delete_collection(name=self.collection_name)
                self.collection = None
        except Exception as e:
            logger.info(f"集合不存在或获取失败: {str(e)}")
        
        # 创建新集合
        self.collection = self.chroma_client.create_collection(
            name=self.collection_name,
            metadata={"description": "金融术语向量索引"}
        )
        
        # 构建向量索引
        logger.info(f"开始为 {len(terms_list)} 条术语构建向量索引...")
        
        # 分批处理以避免内存问题
        batch_size = 100
        for i in range(0, len(terms_list), batch_size):
            batch = terms_list[i:i + batch_size]
            
            # 生成向量
            embeddings = self.model.encode(batch, show_progress_bar=False)
            
            # 添加到 ChromaDB
            self.collection.add(
                embeddings=embeddings.tolist(),
                documents=batch,
                ids=[f"term_{j}" for j in range(i, i + len(batch))]
            )
            
            if (i + batch_size) % 1000 == 0:
                logger.info(f"已处理 {min(i + batch_size, len(terms_list))}/{len(terms_list)} 条术语")
        
        logger.info("向量索引构建完成")
        self.is_initialized = True
    
    def search_similar(
        self, 
        query: str, 
        top_k: int = 10
    ) -> List[Dict]:
        """
        基于语义相似度搜索术语
        
        Args:
            query: 查询字符串
            top_k: 返回结果数量
            
        Returns:
            相似术语列表
        """
        if not self.is_initialized:
            raise RuntimeError("向量服务未初始化")
        
        if not query:
            return []
        
        # 将查询向量化
        query_embedding = self.model.encode([query])[0]
        
        # 在 ChromaDB 中搜索
        results = self.collection.query(
            query_embeddings=[query_embedding.tolist()],
            n_results=top_k
        )
        
        # 格式化结果
        formatted_results = []
        if results['documents'] and len(results['documents']) > 0:
            documents = results['documents'][0]
            distances = results['distances'][0]
            
            for doc, distance in zip(documents, distances):
                # ChromaDB 返回的是距离，需要转换为相似度
                # 距离越小，相似度越高
                similarity = 1 / (1 + distance)
                
                formatted_results.append({
                    'term': doc,
                    'similarity': round(similarity, 4),
                    'distance': round(distance, 4),
                    'match_type': 'semantic'
                })
        
        logger.info(f"语义搜索 '{query}' 找到 {len(formatted_results)} 个结果")
        return formatted_results
    
    def get_embedding(self, text: str) -> List[float]:
        """
        获取文本的向量表示
        
        Args:
            text: 输入文本
            
        Returns:
            向量列表
        """
        if not self.is_initialized:
            raise RuntimeError("向量服务未初始化")
        
        embedding = self.model.encode([text])[0]
        return embedding.tolist()
