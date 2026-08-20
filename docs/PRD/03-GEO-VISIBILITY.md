# GEO Visibility PRD

## 目标

实现企业品牌在AI回答中的可见度检测。

## 核心能力

- Prompt任务管理
- AI Provider调用
- 原始回答保存
- 品牌出现检测
- 排名分析
- Citation解析
- 趋势统计

## 数据要求

每次检测必须保存：

- Prompt
- Provider
- Model
- Request时间
- Raw Response
- Citation
- Analysis Result

## 验收

用户可以：

创建检测任务 → 执行 → 查看AI原文 → 查看品牌表现 → 查看引用来源。
