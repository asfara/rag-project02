"""
配置文件
"""
import os
from pathlib import Path

# 项目根目录
BASE_DIR = Path(__file__).resolve().parent

# 数据文件路径
DATA_FILE = BASE_DIR / "data" / "万条金融标准术语.csv"

# ChromaDB配置
CHROMA_DIR = BASE_DIR / "chroma_db"
COLLECTION_NAME = "financial_terms"

# 向量模型配置
EMBEDDING_MODEL = "BAAI/bge-m3"

# API配置
API_HOST = "0.0.0.0"
API_PORT = 8000
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# 搜索配置
DEFAULT_TOP_K = 10
FUZZY_MATCH_THRESHOLD = 70  # 模糊匹配阈值（0-100）

# 历史记录配置
HISTORY_FILE = BASE_DIR / "data" / "search_history.json"
MAX_HISTORY_ITEMS = 1000
