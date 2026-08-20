# GEOv4

## 企业级 GEO Intelligence Platform

GEOv4 是面向企业的 GEO（Generative Engine Optimization）增长管理平台。

目标：帮助企业监测 AI 搜索中的品牌表现，发现优化机会，通过内容优化提升 AI 可见度。

---

# AI Agent 开发入口

如果你是 AI Agent、自动化开发助手或新的开发者：

请严格按照以下顺序执行：

1. 阅读本文件 README.md
2. 阅读 `.ai/PROJECT_CONTEXT.md`
3. 阅读 `.ai/CURRENT_STATUS.md`
4. 阅读 `.ai/TASK_QUEUE.md`
5. 阅读对应 `docs/PRD/` 模块文档

不要直接修改代码。

开发前必须确认：

- 当前产品目标
- 当前任务
- 对应 PRD
- 验收标准

开发完成后必须同步：

- `.ai/CURRENT_STATUS.md`
- `.ai/CHANGELOG_AI.md`
- `.ai/TASK_QUEUE.md`
- 对应 PRD 验收状态

---

# 产品范围

V4 当前只开发企业版：

包含：

- GEO 可见度检测
- Prompt 管理
- AI 回答分析
- Citation 分析
- 竞争分析
- GEO 机会中心
- 内容工坊
- 发布记录
- 效果追踪

暂不包含：

- OEM
- 平台管理
- Billing
- 多租户商业后台

---

# 核心业务闭环

品牌资产
↓
Prompt 管理
↓
AI 可见度检测
↓
机会发现
↓
内容优化
↓
发布记录
↓
效果追踪

---

# 开发原则

- PRD 驱动开发
- 禁止 Demo 页面堆砌
- 禁止假数据冒充业务结果
- 每个模块必须完整 CRUD
- 每个功能必须可验收

---

# 当前工程

- `apps/web`：Vue 3 + Ant Design Vue 企业控制台，按 Vue Vben Admin 5.7.0 设计方向建设。
- `apps/api`：TypeScript/Fastify API 基线。
- `packages/domain`：Provider无关的品牌提及、排名与Citation分析。
- `docs/ARCHITECTURE.md`：系统边界和部署架构。
- `docs/OPEN_SOURCE_REUSE.md`：开源复用与许可证边界。
- `docs/DATA_MODEL.md`：核心数据模型。

本地验证：

```bash
pnpm install
pnpm test
pnpm build
```
