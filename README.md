# 💼 求职追踪助手 · Job Tracker

> 一站式秋招追踪工具，覆盖"录入 → 决策 → 准备 → 复盘 → 洞察 → Offer 决策"全流程，集成 **6 个 AI 能力**。

![Status](https://img.shields.io/badge/status-running-brightgreen)
![Stack](https://img.shields.io/badge/stack-Supabase%20%2B%20Qwen-blue)
![License](https://img.shields.io/badge/license-MIT-yellow)
![Live](https://img.shields.io/badge/demo-live-green)

## ✨ 核心特性

- 📷 **截图即录入** — Ctrl+V 粘贴截图，AI 自动识别
- 🎯 **AI 全流程辅助** — 匹配度评分 / 面试题预测 / 智能去重 / 飞书复盘
- 📊 **求职全生命周期** — 14 状态状态机 + 复盘闭环
- 💰 **Offer 决策辅助** — 多 Offer 横向对比，最高值自动高亮
- 🔍 **跨设备实时同步** — 数据在云端，电脑手机都能用
- 🧠 **AI 是助手不是决策者** — 永远不破坏用户旧数据

## 🎬 在线演示

打开 https://job-tracker-cym.pages.dev/ 即可使用（支持邮箱 + GitHub 一键登录）

## 🛠️ 技术栈

| 层 | 选型 |
|---|---|
| **前端** | 单文件 HTML + Tailwind CSS + Chart.js（本地部署）|
| **后端** | Supabase（Postgres + Auth + Storage + Edge Functions）|
| **AI** | 阿里云通义千问（Qwen-VL-Plus + Qwen-Turbo）|
| **部署** | Cloudflare Pages（永久链接）|

## 📦 6 个 Edge Functions（AI 中转）

| Function | 功能 | 数据来源 |
|---|---|---|
| `ocr-job` | 截图识别（单张 / 批量，飞书表格截图拆多条）| jobs 表 |
| `dedup-company` | 公司名去重判断（"字节跳动"="ByteDance"）| jobs 表 |
| `interview-questions` | 面试题生成（10 道 + 答题要点）| jobs 表 |
| `match-score` | 简历匹配度评分（5 维度 0-100 分）| - |
| `fetch-feishu` | 飞书公开链接抓取 + AI 复盘分析 | interview_feedbacks 表 |
| `weekly-review` | 求职周报生成 | journals 表 |

**安全设计**：所有 AI 调用走 Edge Functions 中转，**API Key 不暴露前端**。

## 🚀 快速开始

### 在线使用（推荐）
直接访问：https://job-tracker-cym.pages.dev/

### 本地运行（开发）

```powershell
# 启动 HTTP 服务器
cd "C:\path\to\job-tracker"
python -m http.server 8080

# 浏览器打开
# http://localhost:8080/job-tracker.html
```

### 部署 Edge Function

```powershell
npx supabase functions deploy <function-name> --project-ref ahvebaixpxkkaokoniix --no-verify-jwt
```

## 📂 文件结构

```
job-tracker/
├── job-tracker.html          # 主前端（~2700 行）
├── chart.min.js              # Chart.js（本地部署，205 KB）
├── PRD.md                    # 产品需求文档
├── README.md                 # 本文件
├── sql/
│   ├── create-jobs-table.sql
│   ├── create-journals-table.sql
│   └── create-offers-rls.sql
└── supabase/functions/       # 6 个 Edge Functions
    ├── ocr-job/
    ├── dedup-company/
    ├── interview-questions/
    ├── match-score/
    ├── fetch-feishu/
    └── weekly-review/
```

## 🎯 完整功能清单

### 🔐 认证（双登录）
- 邮箱魔法链接（无密码）
- GitHub OAuth 一键登录
- 跨设备 session 同步

### 📥 数据录入
- 单条新增/编辑/删除（17 个字段）
- 单张截图 OCR 识别（Ctrl+V 粘贴）
- 批量截图识别（飞书表格拆 N 条）
- 智能去重合并（"字节跳动"="ByteDance"）
- 智能字段补全（永不覆盖原值）

### 🎯 AI 决策辅助
- **岗位匹配度评分**（简历 vs JD，0-100 分 + 5 维度）
- **面试题生成**（10 道结构化题目 + 答题要点）

### 📝 复盘与决策
- **面试复盘**（飞书链接抓取 + AI 改进建议）
- **每日复盘 + AI 周报**（情绪追踪 + 求职心路历程）
- **Offer 录入**（薪资/几薪/股票/福利/截止日期）
- **Offer 对比表**（多 Offer 横评，最高值高亮）

### 📊 数据洞察
- **投递进度看板**（KPI + 饼图 + 柱状图）
- **4 维筛选**（状态/企业性质/行业/排序）
- **实时搜索**（公司/岗位/行业）
- **一键导出 Excel**（CSV UTF-8 BOM）

## 🗃️ 数据库（4 张表）

| 表 | 字段 | 用途 |
|---|---|---|
| `jobs` | 17 | 求职记录（核心表，含 14 状态 CHECK 约束）|
| `interview_feedbacks` | 8 | 面试复盘（每轮面后）|
| `offers` | 16 | Offer 详情（薪资/几薪/股票）|
| `journals` | 8 | 每日复盘 + AI 周报 |

**所有表开启 RLS**，用户只能看自己的数据。

## 🔒 安全设计

- **RLS 行级安全**：每个表都开启，强制按 user_id 隔离
- **API Key 不暴露前端**：所有 AI 调用走 Edge Functions 中转
- **Magic Link 无密码**：邮箱验证身份，Token 一次性
- **GitHub OAuth**：可选登录方式
- **AI 是助手**：永远不破坏用户原值，只补空白字段

## 📊 项目亮点（AI 产品岗面试用）

1. **真实场景驱动** — 不是 demo，是我自己的求职工具
2. **AI 在闭环中** — 不是问答玩具，是流程关键节点
3. **数据质量保证** — AI 误判时降级处理，不入库脏数据
4. **最小阻力路径** — Ctrl+V 粘贴替代"保存→找文件→拖入"
5. **企业级架构** — RLS + Edge Functions + Cloudflare CDN

## 🎯 给面试官的 3 分钟介绍

> "我做了一个**秋招求职追踪工具**，覆盖全流程。
>
> 核心数据：单文件 HTML（2700 行）+ 6 个 Edge Functions AI 中转 + 4 张数据表 + RLS 安全 + 14 状态状态机。
>
> AI 应用：截图 OCR（多模态）、智能去重、匹配度评分、面试题预测、飞书复盘抓取、求职周报生成。
>
> 真实场景：300+ 条真实求职数据，跨设备同步，永久部署。"

## 📚 详细文档

查看 [PRD.md](./PRD.md) 获取完整的产品需求文档。

## 📄 License

MIT