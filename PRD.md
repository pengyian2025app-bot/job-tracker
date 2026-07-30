# 求职追踪助手 · Job Tracker

> 一站式秋招追踪工具：覆盖"录入 → 决策 → 准备 → 复盘 → 洞察 → Offer 决策"全流程，集成 **6 个 AI 能力**。
>
> **作者**：pengyiran · **版本**：v3.0 · **更新**：2026-07-30

---

## 📋 目录

- [1. 项目背景](#1-项目背景)
- [2. 目标用户](#2-目标用户)
- [3. 核心特性](#3-核心特性)
- [4. 功能清单](#4-功能清单)
- [5. 14 状态状态机](#5-14-状态状态机)
- [6. 数据架构](#6-数据架构)
- [7. 技术栈](#7-技术栈)
- [8. AI Prompt 工程](#8-ai-prompt-工程)
- [9. 安全设计](#9-安全设计)
- [10. 文件结构](#10-文件结构)
- [11. 部署与运行](#11-部署与运行)
- [12. 未来规划](#12-未来规划)

---

## 1. 项目背景

### 1.1 痛点

2027 届秋招季，应届生平均投递 **80-200 家**公司，传统工具的痛点：

| 痛点 | 描述 |
|---|---|
| **录入繁琐** | 手动输入公司、岗位、薪资、截止日期，每天 30+ 分钟 |
| **数据散乱** | 截图、聊天、官网、表格分散各处，错过截止日期 |
| **决策盲目** | 不知道一个岗位值不值得花时间，投了 100 家回复率 < 5% |
| **缺乏沉淀** | 面完不记得，下次再面又踩同一个坑 |
| **脏数据** | 飞书表格里"字节跳动"="ByteDance"重复，没整理 |
| **Offer 比较难** | 收到 Offer 不知道怎么选，凭感觉决策 |
| **心理孤立** | 求职是场心理战，没人陪伴 |

### 1.2 机会

AI 时代让个人也能做出企业级产品：多模态大模型 + Serverless + 免费云数据库。

### 1.3 真实场景驱动

本项目不是凭空想的需求，是**作者本人 27 届秋招的真实痛点**——所有功能都在自己的求职过程中被反复使用。

---

## 2. 目标用户

| 维度 | 描述 |
|---|---|
| **身份** | 27 届应届毕业生（2027 年毕业）|
| **场景** | 电脑为主（晚上集中处理投递），通勤偶尔手机刷 |
| **节奏** | 重度海投，每天 5-20 家 |
| **痛点优先级** | ① 不漏截止 ② 减少录入 ③ 心理陪伴 |

---

## 3. 核心特性

### 🎯 五大产品亮点

1. **截图即录入** — Ctrl+V 粘贴截图，AI 自动识别多张招聘信息
2. **AI 全流程辅助** — 匹配度评分 / 面试题预测 / 智能去重 / 复盘分析 / 飞书复盘
3. **求职全生命周期管理** — 14 状态状态机 + 复盘闭环
4. **Offer 决策辅助** — 多 Offer 横向对比，最高值自动高亮
5. **跨设备实时同步** — 数据在云端，电脑手机都能用

---

## 4. 功能清单

### 4.1 P0：核心 MVP
| 功能 | 状态 |
|---|---|
| 邮箱魔法链接登录 | ✅ |
| GitHub OAuth 一键登录 | ✅ |
| 增改删求职记录 | ✅ |
| 状态筛选 + 排序 | ✅ |
| 多维筛选（状态/企业性质/行业） | ✅ |
| 实时搜索（公司/岗位/行业） | ✅ |
| 今日截止红框置顶 | ✅ |
| 跨设备同步 | ✅ |
| 投递进度看板（KPI + 饼图 + 柱状图） | ✅ |
| 一键导出 Excel | ✅ |

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
| 岗位匹配度评分（简历 vs JD，0-100 分 + 5 维度建议） | ✅ |
| AI 面试题生成（10 道 + 答题要点） | ✅ |
| 飞书链接复盘抓取 + AI 分析建议 | ✅ |

### 4.4 P3：复盘与陪伴
| 功能 | 状态 |
|---|---|
| 面试复盘（每轮面后的结构化记录） | ✅ |
| 每日复盘笔记 + AI 周报 | ✅ |

### 4.5 P4：Offer 决策
| 功能 | 状态 |
|---|---|
| Offer 录入（薪资/几薪/股票/福利/截止日期） | ✅ |
| Offer 对比表（多 Offer 横评，最高值高亮） | ✅ |

---

## 5. 14 状态状态机

### 5.1 完整状态流转

```
想投 → 已投递 → 笔试/筛选 → 一面 → 二面 → 三面 → 四面 → 五面
   ↓                                    ↓
HR 面 → 终面 → 口头 OC → 书面 Offer → 已接受 / 已拒绝 / 已撤回
```

### 5.2 状态详细定义

| 状态 | 含义 |
|---|---|
| `wishlist` | 想投（标记但还没投递） |
| `applied` | 已投递 |
| `screen` | 笔试/筛选 |
| `interview_1` | 一面 |
| `interview_2` | 二面 |
| `interview_3` | 三面 |
| `interview_4` | 四面 |
| `interview_5` | 五面 |
| `hr_interview` | HR 面 |
| `final_interview` | 终面 |
| `verbal_offer` | 口头 OC |
| `offer` | 书面 Offer |
| `rejected` | 已拒绝 |
| `withdrawn` | 已撤回 |

### 5.3 复盘闭环（核心洞察）

```
每轮面试 → 写复盘 → AI 总结 → 下次面试改进
       ↑                              ↓
       └──────────────────────────────┘
              持续成长循环
```

**关键**：每个面试后用 `interview_feedbacks` 表记录，下次面同岗位前能回顾历史经验。

---

## 6. 数据架构

### 6.1 ER 图

```
┌─────────────────┐         ┌──────────────────┐
│   auth.users    │         │  storage.objects │
│  (Supabase 内置) │         │   (screenshots)   │
└────────┬────────┘         └─────────┬────────┘
         │ 1                        │ N
         ├─────────────────────────┤
         │                         │
┌────────▼────────┐    ┌───────────▼────────┐
│      jobs       │    │ interview_feedbacks │
│  (求职记录)      │    │   (面试复盘)         │
└────────┬────────┘    └────────────────────┘
         │ 1
         │ N
┌────────▼────────┐         ┌──────────────────┐
│     offers     │         │     journals      │
│   (Offer 详情)  │         │   (每日复盘)       │
└─────────────────┘         └──────────────────┘
```

### 6.2 jobs 表（核心）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | UUID | 主键 |
| user_id | UUID | 关联 auth.users，RLS 隔离 |
| company | TEXT | 公司名（必填）|
| position | TEXT | 岗位名（必填）|
| status | TEXT | 14 状态状态机（CHECK 约束）|
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

### 6.3 interview_feedbacks 表

| 字段 | 类型 | 说明 |
|---|---|---|
| id | UUID | 主键 |
| user_id | UUID | 关联 auth.users |
| job_id | UUID | 关联 jobs（级联删除）|
| round | INTEGER | 第几面（1-7）|
| interview_date | DATE | 面试日期 |
| interview_type | TEXT | tech / hr / business / final |
| overall_rating | INTEGER | 整体评分 1-5 |
| notes | TEXT | 复盘内容 |
| created_at | TIMESTAMPTZ | 创建时间 |

### 6.4 offers 表

| 字段 | 类型 | 说明 |
|---|---|---|
| id | UUID | 主键 |
| user_id | UUID | 关联 auth.users |
| job_id | UUID | 关联 jobs（级联删除）|
| company | TEXT | 公司名 |
| position | TEXT | 岗位 |
| base_salary | INTEGER | 月薪（k） |
| salary_months | INTEGER | 几薪（12/13/16 等）|
| bonus_months | INTEGER | 年终奖几个月 |
| stock_value | NUMERIC | 股票/期权估值 |
| other_benefits | TEXT | 其他福利 |
| deadline | DATE | Offer 接受截止 |
| status | TEXT | pending / accepted / declined / expired |
| notes | TEXT | 备注 |
| created_at | TIMESTAMPTZ | 创建时间 |

### 6.5 journals 表

| 字段 | 类型 | 说明 |
|---|---|---|
| id | UUID | 主键 |
| user_id | UUID | 关联 auth.users |
| date | DATE | 复盘日期 |
| content | TEXT | 复盘正文 |
| mood | TEXT | great / good / ok / bad / awful |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间 |

### 6.6 RLS 安全策略

- 每个表开启 Row Level Security
- 4 个标准策略：SELECT / INSERT / UPDATE / DELETE
- 所有策略校验 `auth.uid() = user_id`
- Storage 按 `(storage.foldername(name))[1] = auth.uid()::text` 隔离
- `jobs.status` 字段有 CHECK 约束（仅接受 14 个合法值）

---

## 7. 技术栈

### 7.1 前端
- **单文件 HTML**（约 2700 行）
- **Tailwind CSS CDN**（原子化样式）
- **Chart.js**（本地部署，205 KB，避免 CDN 稳定性问题）
- **Supabase JS SDK v2**

### 7.2 后端
- **Supabase 平台**：
  - **Postgres** — 主数据存储（4 张表）
  - **Auth** — 邮箱魔法链接 + GitHub OAuth
  - **Storage** — 截图存储
  - **Edge Functions** — 6 个 AI 中转函数

### 7.3 AI 模型
| 场景 | 模型 | 选择理由 |
|---|---|---|
| 截图 OCR | qwen-vl-plus | 国产、中文 OCR 强、价格低 |
| 文本生成 | qwen-turbo | 性价比高、响应快 |

### 7.4 6 个 Edge Functions

| Function | 功能 | 用途 |
|---|---|---|
| `ocr-job` | 截图 OCR（单张 / 批量） | ✅ 在用 |
| `dedup-company` | 公司名去重判断 | ✅ 在用 |
| `interview-questions` | 面试题生成（10 道） | ✅ 在用 |
| `match-score` | 岗位匹配度评分（0-100） | ✅ 在用 |
| `fetch-feishu` | 飞书公开链接抓取 + AI 复盘 | ✅ 在用 |
| `weekly-review` | 求职周报 | ✅ 在用 |

---

## 8. AI Prompt 工程

### 8.1 设计原则

1. **强制 JSON 输出**：避免模型输出多余文字导致解析失败
2. **容错解析**：先 `JSON.parse`，失败后用正则提取 ```json 代码块
3. **角色扮演**：用资深 HR / 面试官等角色锚定输出质量
4. **明确字段定义**：每个字段的含义、是否必填、默认值

### 8.2 关键技术点

- **批量与单张两种模式**：同一个 function 通过 `mode` 参数切换 Prompt
- **强约束日期格式**：让模型输出 `YYYY-MM-DD`，并加有效性校验（2020-2030 年）
- **字段互不混淆**：更新日期 vs 截止日期，明确指出列位置
- **降级处理**：单条记录失败不影响整批（batchSave 逐条插入）

完整 Prompt 见 `supabase/functions/*/index.ts`。

---

## 9. 安全设计

### 9.1 API Key 保护
- ❌ 永不在前端代码硬编码 API Key
- ✅ 通过 Supabase Edge Functions 中转
- ✅ Edge Functions 的 Secret 在 Dashboard 配置
- ✅ 所有 AI 调用都走服务端，前端不接触敏感信息

### 9.2 RLS（行级安全）
- 所有表开启 RLS
- 任何 API 调用都被强制按 user_id 过滤
- 即使有人拿到 anon key + project URL，也读不到别人的数据

### 9.3 Magic Link
- 无密码，邮件验证身份
- Token 一次性，有效期 1 小时

### 9.4 anon key vs service_role key
- **anon key**（前端用）：受 RLS 保护，可公开
- **service_role key**（绝对不要用在前端）：绕过 RLS，能改任何数据

### 9.5 业务安全
- AI 是助手不是决策者：去重合并时永远不覆盖原值，只补空白
- 批量入库要健壮：单条失败不影响整批
- 日期有效性校验：非法日期降级为 null，不入库脏数据

---

## 10. 文件结构

```
job-tracker/
├── job-tracker.html          # 主前端（~2700 行）
├── chart.min.js              # Chart.js（本地部署，205 KB）
├── PRD.md                    # 本文档
├── README.md                 # 项目说明
├── sql/
│   ├── create-jobs-table.sql
│   ├── create-journals-table.sql
│   └── create-offers-rls.sql
└── supabase/functions/       # 6 个 Edge Functions
    ├── ocr-job/              # 截图识别
    ├── dedup-company/        # 公司去重
    ├── interview-questions/  # 面试题
    ├── match-score/          # 匹配度
    ├── fetch-feishu/         # 飞书复盘
    └── weekly-review/        # 周报
```

---

## 11. 部署与运行

### 11.1 公网部署（生产）

**前端**：Cloudflare Pages（永久链接）
- URL: https://job-tracker-cym.pages.dev/
- 自动 HTTPS + 全球 CDN

**后端**：Supabase（Singapore 节点）
- Project ID: ahvebaixpxkkaokoniix
- Region: ap-southeast-1
- Project URL: https://ahvebaixpxkkaokoniix.supabase.co

### 11.2 本地运行（开发）

```powershell
# 启动 HTTP 服务器
cd "C:\Users\11195107\AppData\Roaming\BlueworkUi\bluework-temp-workspaces\f38687b3"
python -m http.server 8080

# 浏览器访问
# http://localhost:8080/job-tracker.html
```

### 11.3 Edge Functions 部署

```powershell
# 部署单个函数
npx supabase functions deploy <function-name> --project-ref ahvebaixpxkkaokoniix --no-verify-jwt

# 批量部署
npx supabase functions deploy ocr-job --project-ref ahvebaixpxkkaokoniix --no-verify-jwt
npx supabase functions deploy dedup-company --project-ref ahvebaixpxkkaokoniix --no-verify-jwt
# ...
```

### 11.4 登录配置

- **邮箱魔法链接**：Supabase Auth 默认开启，邮件模板无需改
- **GitHub OAuth**：
  1. 在 GitHub 创建 OAuth App：https://github.com/settings/developers/new
  2. Authorization callback URL: `https://ahvebaixpxkkaokoniix.supabase.co/auth/v1/callback`
  3. 把 Client ID / Secret 填入 Supabase Dashboard

---

## 12. 未来规划

### 12.1 短期（1-2 周）
- [ ] PWA 部署（手机能装）
- [ ] 飞书 Webhook 推送（每日截止推送）
- [ ] Chrome 浏览器插件（一键加入投递）

### 12.2 中期（1-2 月）
- [ ] 多人协作（情侣/同学共享进度）
- [ ] AI 简历优化建议（针对具体 JD 改简历）
- [ ] 投递信 A/B 测试（哪种风格回复率高）

### 12.3 长期（3-6 月）
- [ ] 行业薪资大数据（从投递记录聚合）
- [ ] AI 模拟面试（语音对话）
- [ ] 自定义域名（避免 .pages.dev 子域名）

---

## 📊 项目亮点总结

### 给面试官的 3 分钟介绍

> "我做了一个**秋招求职追踪工具**，覆盖全流程。
>
> **核心数据**：单文件 HTML 前端（2700 行）+ **6 个 Edge Functions** AI 中转 + **4 张数据表** + RLS 安全 + **14 状态状态机**。
>
> **AI 应用**：
> - 截图 OCR（多模态 Qwen-VL-Plus）
> - 智能去重（"字节跳动"="ByteDance"数据质量）
> - 匹配度评分（5 维度 0-100 分）
> - 面试题预测（10 道 + 答题要点）
> - 飞书复盘抓取 + AI 总结
> - AI 周报生成
>
> **架构亮点**：API Key 全部走 Edge Functions，前端不接触敏感信息；用 RLS 实现细粒度权限；Magic Link 无密码登录。
>
> **真实场景**：300+ 条真实求职数据，跨设备同步，永久部署在 Cloudflare Pages。
>
> **作品集价值**：不是 demo，是真正能用的工具；不是单点功能，是完整产品闭环。"

---

## 📝 版本历史

| 版本 | 日期 | 主要更新 |
|---|---|---|
| v1.0 | 2026-07-23 | MVP：CRUD + 登录 + 跨设备 |
| v1.5 | 2026-07-23 | OCR + 匹配度 + 面试题 |
| v1.8 | 2026-07-23 | 复盘 + 周报 + 看板 + 命令面板 |
| v2.0 | 2026-07-24 | 企业性质/行业/搜索/批量粘贴/智能合并/更新日期 |
| v2.5 | 2026-07-28 | 14 状态状态机 + 飞书复盘 + Offer 录入 + 对比表 |
| **v3.0** | **2026-07-30** | **删 cover-letter + interview-review / 修复 journals 表 / 文档大更新** |

---

**License**: MIT