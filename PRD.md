# 求职追踪助手 · Job Tracker

> 一站式秋招追踪工具：覆盖"录入 → 决策 → 准备 → 复盘 → 洞察"全流程，集成 7 个 AI 能力。
>
> **作者**：pengyiran · **版本**：v2.0 · **更新**：2026-07-24

---

## 📋 目录

- [1. 项目背景](#1-项目背景)
- [2. 目标用户](#2-目标用户)
- [3. 核心特性](#3-核心特性)
- [4. 功能清单](#4-功能清单)
- [5. 数据架构](#5-数据架构)
- [6. 技术栈](#6-技术栈)
- [7. AI Prompt 工程](#7-ai-prompt-工程)
- [8. 安全设计](#8-安全设计)
- [9. 文件结构](#9-文件结构)
- [10. 部署与运行](#10-部署与运行)
- [11. 未来规划](#11-未来规划)

---

## 1. 项目背景

### 1.1 痛点

2026 届秋招季，应届生平均投递 **80-200 家**公司，传统工具的痛点：

| 痛点 | 描述 |
|---|---|
| **录入繁琐** | 手动输入公司、岗位、薪资、截止日期，每天 30+ 分钟 |
| **数据散乱** | 截图、聊天、官网、表格分散各处，错过截止日期 |
| **决策盲目** | 不知道一个岗位值不值得花时间，投了 100 家回复率 < 5% |
| **缺乏洞察** | 不知道哪个行业回复率高、哪个状态多 |
| **心理孤立** | 求职是场心理战，没人陪伴 |

### 1.2 机会

AI 时代让个人也能做出企业级产品：多模态大模型 + Serverless + 免费云数据库。

---

## 2. 目标用户

| 维度 | 描述 |
|---|---|
| **身份** | 27 届应届毕业生（2026 年毕业）|
| **场景** | 电脑为主（晚上集中处理投递），通勤偶尔手机刷 |
| **节奏** | 重度海投，每天 5-20 家 |
| **痛点优先级** | ① 不漏截止 ② 减少录入 ③ 心理陪伴 |

---

## 3. 核心特性

### 🎯 三大产品亮点

1. **截图即录入** — Ctrl+V 粘贴截图，AI 自动识别多张招聘信息
2. **AI 全流程辅助** — 匹配度评分 / 面试题预测 / 投递信草稿 / 复盘分析
3. **跨设备实时同步** — 数据在云端，电脑手机都能用

---

## 4. 功能清单

### 4.1 P0：核心 MVP
| 功能 | 状态 |
|---|---|
| 邮箱魔法链接登录 | ✅ |
| 增改删求职记录 | ✅ |
| 状态筛选 + 排序 | ✅ |
| 多维筛选（状态/企业性质/行业） | ✅ |
| 实时搜索（公司/岗位/行业） | ✅ |
| 今日截止红框置顶 | ✅ |
| 跨设备同步 | ✅ |

### 4.2 P1：录入智能化
| 功能 | 状态 |
|---|---|
| 单张截图 OCR 识别 | ✅ |
| 批量截图识别（飞书表格） | ✅ |
| **Ctrl+V 直接粘贴**（不用保存文件） | ✅ |
| 智能去重合并（"字节跳动"="ByteDance"） | ✅ |
| 智能字段合并（旧记录为空时补全） | ✅ |

### 4.3 P2：AI 决策与准备
| 功能 | 状态 |
|---|---|
| 岗位匹配度评分（简历 vs JD） | ✅ |
| AI 面试题生成（10 道 + 答题要点） | ✅ |
| AI 投递信草稿（3 种风格） | ✅ |

### 4.4 P3：复盘与陪伴
| 功能 | 状态 |
|---|---|
| AI 面试复盘助手（录音/笔记 → 结构化） | ✅ |
| 每日复盘笔记 + AI 周报 | ✅ |

### 4.5 P4：数据洞察
| 功能 | 状态 |
|---|---|
| 投递进度看板（KPI + 饼图 + 柱状图） | ✅ |
| 一键导出 Excel（CSV UTF-8 BOM） | ✅ |
| Ctrl+K 命令面板（全局搜索） | ✅ |

---

## 5. 数据架构

### 5.1 ER 图

```
┌─────────────────┐         ┌──────────────────┐
│   auth.users    │         │  storage.objects │
│  (Supabase 内置) │         │   (screenshots)   │
└────────┬────────┘         └─────────┬────────┘
         │ 1                        │ N
         │                          │
┌────────▼────────┐         ┌──────▼───────────┐
│      jobs       │         │     journals     │
│  (求职记录)      │         │   (每日复盘)      │
└─────────────────┘         └──────────────────┘
```

### 5.2 jobs 表

| 字段 | 类型 | 说明 |
|---|---|---|
| id | UUID | 主键 |
| user_id | UUID | 关联 auth.users，RLS 隔离 |
| company | TEXT | 公司名（必填）|
| position | TEXT | 岗位名（必填）|
| status | TEXT | wishlist / applied / screen / interview / offer / rejected |
| deadline | DATE | 截止日期 |
| update_date | DATE | 信息更新日期（飞书表格的"更新日期"列）|
| link | TEXT | 职位链接 |
| salary | TEXT | 薪资范围 |
| location | TEXT | 工作地点 |
| enterprise_type | TEXT | 企业性质（民企/央企国企/外企/事业单位/银行/其他）|
| industry | TEXT | 所属行业（13 种常见分类）|
| notes | TEXT | 备注 / 合并历史 / 面试感受 |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间（触发器自动维护）|

### 5.3 journals 表

| 字段 | 类型 | 说明 |
|---|---|---|
| id | UUID | 主键 |
| user_id | UUID | 关联 auth.users |
| date | DATE | 复盘日期 |
| content | TEXT | 复盘正文 |
| mood | TEXT | great / good / ok / bad / awful |

### 5.4 RLS 安全策略

- 每个表开启 Row Level Security
- 4 个标准策略：SELECT / INSERT / UPDATE / DELETE
- 所有策略校验 `auth.uid() = user_id`
- Storage 按 `(storage.foldername(name))[1] = auth.uid()::text` 隔离

---

## 6. 技术栈

### 6.1 前端
- **单文件 HTML**（约 2000 行）
- **Tailwind CSS CDN**（原子化样式）
- **Chart.js**（本地部署，205 KB）
- **Supabase JS SDK v2**

### 6.2 后端
- **Supabase 平台**：
  - **Postgres** — 主数据存储（jobs / journals）
  - **Auth** — 邮箱魔法链接登录
  - **Storage** — 截图存储
  - **Edge Functions** — 7 个 AI 中转函数

### 6.3 AI 模型
| 场景 | 模型 | 选择理由 |
|---|---|---|
| 截图 OCR | qwen-vl-plus | 国产、中文 OCR 强、价格低 |
| 文本生成 | qwen-turbo | 性价比高、响应快 |

### 6.4 7 个 Edge Functions

| Function | 功能 |
|---|---|
| ocr-job | 截图 OCR（单张 / 批量） |
| dedup-company | 公司名去重判断 |
| interview-questions | 面试题生成 |
| match-score | 岗位匹配度评分 |
| cover-letter | 投递信草稿 |
| interview-review | 面试复盘分析 |
| weekly-review | 求职周报 |

---

## 7. AI Prompt 工程

### 7.1 设计原则

1. **强制 JSON 输出**：避免模型输出多余文字导致解析失败
2. **容错解析**：先 `JSON.parse`，失败后用正则提取 `\`\`\`json 代码块
3. **角色扮演**：用资深 HR / 面试官等角色锚定输出质量
4. **明确字段定义**：每个字段的含义、是否必填、默认值

### 7.2 关键技术点

- **批量与单张两种模式**：同一个 function 通过 `mode` 参数切换 Prompt
- **强约束日期格式**：让模型输出 `YYYY-MM-DD`
- **字段互不混淆**：更新日期 vs 截止日期，明确指出列位置

完整 Prompt 见 `supabase/functions/*/index.ts`。

---

## 8. 安全设计

### 8.1 API Key 保护
- ❌ 永不在前端代码硬编码 API Key
- ✅ 通过 Supabase Edge Functions 中转
- ✅ Edge Functions 的 Secret 在 Dashboard 配置

### 8.2 RLS（行级安全）
- 所有表开启 RLS
- 任何 API 调用都被强制按 user_id 过滤
- 即使有人拿到 anon key + project URL，也读不到别人的数据

### 8.3 Magic Link
- 无密码，邮件验证身份
- Token 一次性，有效期 1 小时

### 8.4 anon key vs service_role key
- **anon key**（前端用）：受 RLS 保护，可公开
- **service_role key**（绝对不要用在前端）：绕过 RLS，能改任何数据

---

## 9. 文件结构

```
job-tracker/
├── job-tracker.html          # 主前端（~2000 行）
├── chart.min.js              # Chart.js（本地部署，205 KB）
├── PRD.md                    # 本文档
├── sql/
│   ├── create-jobs-table.sql
│   └── create-journals-table.sql
└── supabase/functions/
    ├── ocr-job/              # 截图识别
    ├── dedup-company/        # 公司去重
    ├── interview-questions/  # 面试题
    ├── match-score/          # 匹配度
    ├── cover-letter/         # 投递信
    ├── interview-review/     # 面试复盘
    └── weekly-review/        # 周报
```

---

## 10. 部署与运行

### 10.1 Supabase 项目信息
- **Project ID**: ahvebaixpxkkaokoniix
- **Region**: Singapore (ap-southeast-1)
- **Project URL**: https://ahvebaixpxkkaokoniix.supabase.co

### 10.2 本地运行

```powershell
# 启动 HTTP 服务器
cd "C:\Users\11195107\AppData\Roaming\BlueworkUi\bluework-temp-workspaces\f38687b3"
python -m http.server 8080

# 浏览器访问
# http://localhost:8080/job-tracker.html
```

### 10.3 Edge Functions 部署

```powershell
npx supabase functions deploy <function-name> --project-ref ahvebaixpxkkaokoniix --no-verify-jwt
```

---

## 11. 未来规划

### 11.1 短期（1-2 周）
- [ ] PWA 部署（手机能装）
- [ ] 飞书 Webhook 推送
- [ ] Chrome 浏览器插件（一键加入投递）

### 11.2 中期（1-2 月）
- [ ] 多人协作（情侣/同学共享进度）
- [ ] AI 简历优化建议（针对具体 JD 改简历）
- [ ] 投递信 A/B 测试（哪种风格回复率高）

### 11.3 长期（3-6 月）
- [ ] 行业薪资大数据（从投递记录聚合）
- [ ] AI 模拟面试（语音对话）
- [ ] Offer 对比工具

---

## 📊 项目亮点总结

### 给面试官的 3 分钟介绍

> "我做了一个**秋招求职追踪工具**，覆盖全流程。
>
> **核心数据**：单文件 HTML 前端 + 7 个 Edge Functions 中转 + 2 张数据表 + RLS 安全。
>
> **AI 应用**：截图 OCR（多模态）、智能去重（数据质量）、匹配度评分（决策辅助）、面试题预测（Prompt 工程）、投递信生成、面试复盘、求职周报。
>
> **架构亮点**：API Key 全部走 Edge Functions，前端不接触敏感信息；用 RLS 实现细粒度权限；Magic Link 无密码登录。"
>
> **作品集价值**：不是一个 demo，是真正能用的工具；不是单点功能，是完整产品闭环。

---

## 📝 版本历史

| 版本 | 日期 | 主要更新 |
|---|---|---|
| v1.0 | 2026-07-23 | MVP：CRUD + 登录 + 跨设备 |
| v1.5 | 2026-07-23 | OCR + 匹配度 + 面试题 + 投递信 |
| v1.8 | 2026-07-23 | 复盘 + 周报 + 看板 + 命令面板 |
| **v2.0** | **2026-07-24** | **企业性质/行业/搜索/批量粘贴/智能合并/更新日期** |

---

**License**: MIT