# 金融术语标准化系统

基于语义理解的智能金融术语查询与标准化平台，参考 [rag-project02-medical-nlp-box](https://github.com/huangjia2019/rag-project02-medical-nlp-box) 项目构建。

## 项目概述

本系统提供金融领域术语的智能查询、匹配和标准化服务，包含约 **15,886** 条标准金融术语。

### 主要功能

- 🔍 **语义搜索**: 基于 BAAI/bge-m3 向量模型的语义相似度搜索
- ✨ **术语标准化**: 智能匹配非标准术语，提供标准术语建议
- 📝 **批量处理**: 支持批量术语标准化，提高工作效率
- 📊 **历史记录**: 自动记录查询历史，方便回顾和管理

## 技术栈

### 后端
- **框架**: FastAPI
- **数据处理**: Pandas
- **文本处理**: RapidFuzz (模糊匹配)
- **向量化**: Sentence Transformers (BAAI/bge-m3)
- **向量数据库**: ChromaDB

### 前端
- **框架**: Next.js 15
- **UI 库**: React 19
- **样式**: Tailwind CSS
- **语言**: TypeScript

## 快速开始

### 环境要求

- Python 3.8+
- Node.js 20+
- Conda (推荐)

### 后端安装与运行

```bash
# 进入后端目录
cd backend

# 激活 conda 环境
conda activate rag-project02

# 安装依赖
pip install -r requirements.txt

# 启动后端服务
python app.py
```

后端服务将在 `http://localhost:8000` 启动。

**注意**: 首次启动时，系统会：
1. 加载 CSV 数据文件
2. 下载 BAAI/bge-m3 向量模型（约 2GB）
3. 构建向量索引（约需 5-10 分钟）

### 前端安装与运行

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端应用将在 `http://localhost:3000` 启动。

## API 文档

后端提供以下 API 端点：

### 健康检查
```bash
GET /api/health
```

### 获取统计信息
```bash
GET /api/stats
```

### 语义搜索
```bash
POST /api/search
Content-Type: application/json

{
  "query": "stock market",
  "top_k": 10
}
```

### 术语标准化
```bash
POST /api/standardize
Content-Type: application/json

{
  "term": "AShare",
  "threshold": 70
}
```

### 批量标准化
```bash
POST /api/batch-standardize
Content-Type: application/json

{
  "terms": ["AShare", "stock mkt", "GDP"],
  "threshold": 70
}
```

### 模糊匹配
```bash
POST /api/fuzzy-match
Content-Type: application/json

{
  "query": "stock",
  "threshold": 70,
  "limit": 10
}
```

### 历史记录
```bash
# 获取历史记录
GET /api/history?limit=20&query_type=search

# 清空历史记录
DELETE /api/history
```

## 项目结构

```
rag-project02/
├── backend/
│   ├── app.py                 # FastAPI 主应用
│   ├── config.py              # 配置文件
│   ├── requirements.txt       # Python 依赖
│   ├── data/
│   │   └── 万条金融标准术语.csv
│   └── services/
│       ├── data_loader.py     # 数据加载服务
│       ├── term_service.py    # 术语处理服务
│       ├── vector_service.py  # 向量服务
│       └── history_service.py # 历史记录服务
├── frontend/
│   ├── app/
│   │   ├── layout.tsx         # 根布局
│   │   ├── page.tsx           # 主页
│   │   ├── search/            # 语义搜索页面
│   │   ├── standardize/       # 术语标准化页面
│   │   └── history/           # 历史记录页面
│   ├── package.json
│   ├── next.config.mjs
│   ├── tailwind.config.ts
│   └── tsconfig.json
└── README.md
```

## 数据说明

- **数据文件**: `backend/data/万条金融标准术语.csv`
- **数据量**: 15,886 条金融标准术语
- **数据格式**: CSV (术语, 标签)

## 核心特性

### 1. 语义搜索
使用 BAAI/bge-m3 多语言向量模型，通过语义理解找到最相关的术语，而不仅仅是关键词匹配。

### 2. 智能标准化
结合精确匹配和模糊匹配算法，为非标准术语提供最佳的标准术语建议，并显示匹配度。

### 3. 高性能检索
基于 ChromaDB 向量数据库，实现毫秒级的语义搜索响应。

### 4. 历史追踪
自动记录用户的所有查询操作，支持按类型过滤和时间排序。

## 开发说明

### 后端开发

```bash
# 使用 uvicorn 开发模式（自动重载）
cd backend
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### 前端开发

```bash
# Next.js 开发模式（自动热更新）
cd frontend
npm run dev
```

### 构建生产版本

```bash
# 前端构建
cd frontend
npm run build
npm run start
```

## 许可证

本项目采用 MIT 许可证。

## 致谢

- 参考项目: [rag-project02-medical-nlp-box](https://github.com/huangjia2019/rag-project02-medical-nlp-box)
- 向量模型: [BAAI/bge-m3](https://huggingface.co/BAAI/bge-m3)
- 框架: FastAPI, Next.js, ChromaDB
