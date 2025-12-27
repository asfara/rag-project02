"""
金融术语标准化系统 - FastAPI 应用
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import logging
from contextlib import asynccontextmanager

import config
from services.data_loader import DataLoader
from services.term_service import TermService
from services.vector_service import VectorService
from services.history_service import HistoryService

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 全局服务实例
data_loader = None
term_service = None
vector_service = None
history_service = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    global data_loader, term_service, vector_service, history_service
    
    # 启动时初始化
    logger.info("正在初始化应用...")
    
    # 初始化数据加载器
    logger.info("初始化数据加载器...")
    data_loader = DataLoader(config.DATA_FILE)
    data_loader.load_data()
    
    # 初始化向量服务
    logger.info("初始化向量服务...")
    vector_service = VectorService(
        model_name=config.EMBEDDING_MODEL,
        chroma_dir=config.CHROMA_DIR,
        collection_name=config.COLLECTION_NAME
    )
    vector_service.initialize(data_loader.get_all_terms())
    
    # 初始化术语服务（传入向量服务以支持混合匹配）
    logger.info("初始化术语服务...")
    term_service = TermService(data_loader, vector_service)
    
    # 初始化历史记录服务
    logger.info("初始化历史记录服务...")
    history_service = HistoryService(
        history_file=config.HISTORY_FILE,
        max_items=config.MAX_HISTORY_ITEMS
    )
    
    logger.info("应用初始化完成")
    
    yield
    
    # 关闭时清理
    logger.info("应用关闭")


# 创建 FastAPI 应用
app = FastAPI(
    title="金融术语标准化系统",
    description="提供金融术语查询、匹配和标准化服务",
    version="1.0.0",
    lifespan=lifespan
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ========== 请求/响应模型 ==========

class SearchRequest(BaseModel):
    query: str = Field(..., description="搜索查询")
    top_k: int = Field(default=10, ge=1, le=100, description="返回结果数量")


class StandardizeRequest(BaseModel):
    term: str = Field(..., description="待标准化的术语")
    threshold: int = Field(default=70, ge=0, le=100, description="匹配阈值")


class BatchStandardizeRequest(BaseModel):
    terms: List[str] = Field(..., description="待标准化的术语列表")
    threshold: int = Field(default=70, ge=0, le=100, description="匹配阈值")


# ========== API 端点 ==========

@app.get("/")
async def root():
    """根路径"""
    return {
        "message": "金融术语标准化系统 API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/api/health",
            "stats": "/api/stats",
            "search": "/api/search (POST)",
            "standardize": "/api/standardize (POST)",
            "history": "/api/history"
        }
    }


@app.get("/api/health")
async def health_check():
    """健康检查"""
    return {
        "status": "healthy",
        "services": {
            "data_loader": data_loader is not None,
            "term_service": term_service is not None,
            "vector_service": vector_service is not None and vector_service.is_initialized,
            "history_service": history_service is not None
        }
    }


@app.get("/api/stats")
async def get_stats():
    """获取统计信息"""
    try:
        data_stats = data_loader.get_stats()
        history_stats = history_service.get_stats()
        
        return {
            "data": data_stats,
            "history": history_stats
        }
    except Exception as e:
        logger.error(f"获取统计信息失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/search")
async def search(request: SearchRequest):
    """
    语义搜索术语（基于向量相似度）
    """
    try:
        results = vector_service.search_similar(
            query=request.query,
            top_k=request.top_k
        )
        
        # 记录历史
        history_service.add_record(
            query=request.query,
            query_type="search",
            results_count=len(results)
        )
        
        return {
            "query": request.query,
            "results": results,
            "count": len(results)
        }
    except Exception as e:
        logger.error(f"搜索失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/standardize")
async def standardize(request: StandardizeRequest):
    """
    文本术语识别和替换（使用语义搜索自动识别并替换标准术语）
    """
    try:
        # 使用新的文本识别和替换功能
        result = term_service.identify_and_replace_terms(
            text=request.term,  # 这里把 term 当作文本处理
            similarity_threshold=request.threshold / 100.0,  # 转换为 0-1
        )
        
        # 记录历史
        history_service.add_record(
            query=request.term[:100] + '...' if len(request.term) > 100 else request.term,
            query_type="text_standardize",
            results_count=len(result.get('replacements', []))
        )
        
        return result
    except Exception as e:
        logger.error(f"文本术语识别失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/batch-standardize")
async def batch_standardize(request: BatchStandardizeRequest):
    """
    批量文本术语识别（已废弃，保留兼容性）
    """
    try:
        results = []
        for text in request.terms:
            result = term_service.identify_and_replace_terms(
                text=text,
                similarity_threshold=request.threshold / 100.0,
            )
            results.append(result)
        
        # 记录历史
        history_service.add_record(
            query=f"批量处理 {len(request.terms)} 段文本",
            query_type="batch_text_standardize",
            results_count=sum(len(r.get('replacements', [])) for r in results)
        )
        
        return {
            "results": results,
            "total": len(results)
        }
    except Exception as e:
        logger.error(f"批量文本识别失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))



@app.get("/api/history")
async def get_history(
    limit: int = 20,
    query_type: Optional[str] = None
):
    """
    获取历史记录
    """
    try:
        if query_type:
            results = history_service.get_by_type(
                query_type=query_type,
                limit=limit
            )
        else:
            results = history_service.get_recent(limit=limit)
        
        return {
            "history": results,
            "count": len(results)
        }
    except Exception as e:
        logger.error(f"获取历史记录失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/history")
async def clear_history():
    """
    清空历史记录
    """
    try:
        history_service.clear_history()
        return {"message": "历史记录已清空"}
    except Exception as e:
        logger.error(f"清空历史记录失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app:app",
        host=config.API_HOST,
        port=config.API_PORT,
        reload=True
    )
