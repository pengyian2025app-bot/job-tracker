# 💼 求职追踪助手 · Job Tracker

> 一站式秋招追踪工具，覆盖"录入 → 决策 → 准备 → 复盘 → 洞察"全流程，集成 7 个 AI 能力。

![Status](https://img.shields.io/badge/status-running-brightgreen)
![Stack](https://img.shields.io/badge/stack-Supabase%20%2B%20Qwen-blue)
![License](https://img.shields.io/badge/license-MIT-yellow)

## ✨ 核心特性

- 📷 **截图即录入** — Ctrl+V 粘贴截图，AI 自动识别
- 🎯 **AI 全流程辅助** — 匹配度评分 / 面试题预测 / 投递信草稿
- 📊 **数据洞察** — 看板 + Excel 导出
- 🔍 **跨设备实时同步** — 数据在云端，电脑手机都能用
- 🧠 **智能去重合并** — 同一公司多种写法自动识别

## 🎬 演示

打开 `job-tracker.html` 即可使用：

```
http://localhost:8080/job-tracker.html
```

## 🛠️ 技术栈

- **前端**：单文件 HTML + Tailwind CSS + Chart.js
- **后端**：Supabase（Postgres + Auth + Storage + Edge Functions）
- **AI**：阿里云通义千问（Qwen-VL-Plus + Qwen-Turbo）

## 📦 7 个 Edge Functions

| Function | 功能 |
|---|---|
| `ocr-job` | 截图识别（单张 / 批量） |
| `dedup-company` | 公司名去重判断 |
| `interview-questions` | 面试题生成 |
| `match-score` | 岗位匹配度评分 |
| `cover-letter` | 投递信草稿 |
| `interview-review` | 面试复盘分析 |
| `weekly-review` | 求职周报 |

## 🚀 快速开始

### 本地运行

```powershell
# 启动 HTTP 服务器
cd "C:\path\to\job-tracker"
python -m http.server 8080

# 浏览器打开
# http://localhost:8080/job-tracker.html
```

### 部署 Edge Function

```powershell
npx supabase functions deploy <function-name> --project-ref <project-id> --no-verify-jwt
```

## 📂 文件结构

```
job-tracker/
├── job-tracker.html          # 主前端
├── chart.min.js              # Chart.js（本地部署）
├── PRD.md                    # 产品需求文档
├── README.md                 # 本文件
├── sql/
│   ├── create-jobs-table.sql
│   └── create-journals-table.sql
└── supabase/functions/
    ├── ocr-job/
    ├── dedup-company/
    ├── interview-questions/
    ├── match-score/
    ├── cover-letter/
    ├── interview-review/
    └── weekly-review/
```

## 🎯 完整功能清单

### 📥 数据录入
- 单条新增/编辑/删除
- 单张截图 OCR 识别
- 批量截图识别（飞书表格）
- **Ctrl+V 直接粘贴**（不用保存文件）
- 智能去重合并
- 智能字段补全

### 🎯 AI 决策辅助
- 岗位匹配度评分（简历 vs JD）
- 面试题生成（10 道 + 答题要点）
- 投递信草稿（3 种风格）

### 📝 复盘陪伴
- 面试复盘助手（录音/笔记 → 结构化）
- 每日复盘笔记
- AI 周报

### 📊 数据洞察
- 投递进度看板（KPI + 饼图 + 柱状图）
- 一键导出 Excel
- Ctrl+K 命令面板

## 🔒 安全设计

- **RLS 行级安全**：每个表都开启，用户只能看自己的数据
- **API Key 不暴露前端**：所有 AI 调用走 Edge Functions 中转
- **Magic Link 无密码**：邮箱验证身份

## 📚 详细文档

查看 [PRD.md](./PRD.md) 获取完整的产品需求文档。

## 📄 License

MIT