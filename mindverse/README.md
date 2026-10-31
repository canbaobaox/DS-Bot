# MindVerse 预置 Bot 与 Skill 定义

> 这是 MindVerse bot 工作台预置的 4 个 Bot 定义卡 + 2 个知识型 Skill。
> **它们是数据文件，不是插件代码**：不对 `ds-bot/` 做任何改动。

## 为什么是数据文件（研究结论）

DS-Bot 上游的设计决定（`docs/plans/2026-10-10-bot-runtime.md`）：

1. **不预置分工 Bot**——"只有一个默认 Bot，分工由用户和 Main Bot 来建"。
   Bot 的运行时数据在用户本机的 DSH 数据目录（桌面端是它自己的 `DSH_HOME`），
   不在仓库里；AGENTS.md 硬规则也不允许碰用户的 DSH 数据。
2. Bot 由 Main Bot 用 `create_bot` 工具（或建 Bot 表单）创建，
   字段：`name` / `role`（2–4 字角色标签）/ `instructions` / `brief` /
   `model` / `effort` / `work_dir` / `avatar`。
3. Capability（MCP 服务 / Skill / 能力包）是团队共享库，只能做加法，
   由用户或 Main Bot 在"设置 → Capabilities"里创建并挂到 Bot 上；
   名字只用小写字母、数字和单个连字符，最长 32 字符。
4. Skill 的文件格式是 `SKILL.md`，frontmatter 必须有 `description`。

仓库里**没有**现成的 seed / 导入约定，所以最干净的落法就是现在这样：
每张 Bot 卡 = 一份 `create_bot` 参数的现成填空（含中文 `instructions` 全文），
用户或 Main Bot（Chief）照卡创建即可；Skill 卡 = 可直接注册为 capability 的 `SKILL.md`。
`bots/manifest.json` 是机器可读清单，供以后的"一键导入"脚本用（现阶段手动装配）。

## 目录

```
mindverse/
├── README.md                  # 本文件
├── bots/
│   ├── manifest.json          # 4 张 Bot 卡的机器可读清单
│   ├── 01-提示词bot.md        # 提示词教练
│   ├── 02-姿势bot.md          # 分镜姿势顾问
│   ├── 03-衣装bot.md          # 服装参考顾问
│   └── 04-DA3bot.md           # 空间几何分析师（MCP 未接入）
└── skills/
    ├── pose-index/SKILL.md    # 姿势索引（RuiC-PoseAtlas 288 组）
    └── wardrobe-index/SKILL.md# 衣装图鉴索引（同站 1407 套）
```

## 装配步骤（给 Chief / 用户）

### 建 4 个 Bot

对每张卡，用 Main Bot 的 `create_bot`（或建 Bot 表单）：

| create_bot 参数 | 取卡里的哪一项 |
|---|---|
| `name` | frontmatter `name` |
| `role` | frontmatter `role`（2–4 字） |
| `instructions` | 正文全文（中文指令） |
| `brief` | frontmatter `brief` |
| `model` | 用户自配（不写死） |
| `work_dir` | frontmatter `suggested_work_dir`（可选） |

### 挂 Skill（Capabilities）

1. 设置 → Capabilities → 新建 Skill，名字用 `pose-index` / `wardrobe-index`
   （符合"小写字母、数字、单个连字符 ≤32 字符"规则），
   内容填对应 `SKILL.md` 全文。
2. 把 `pose-index` 挂到姿势 bot，`wardrobe-index` 挂到衣装 bot。
   提示词 bot 的知识已内嵌在指令里，不需要额外 skill。

### DA3 bot 的特殊状态

- 角色定义已建好（`04-DA3bot.md`），但 **MCP 未接入**：
  DA3-BASE 服务要在用户 4060 上先部署跑通，再封装 MCP server 接入 Capabilities。
- 在 MCP 接入前，DA3 bot 只能做基于视觉观察的空间分析，
  不能输出模型级灰度深度图——卡里已写明，不对用户夸大。

## 授权红线（姿势/衣装站）

- 站方声明（站内"注意事项"原文）：原作可免费用于作品制作（含商用、编辑与参考）；
  **图片数据本身的再分发、转载与转售禁止**；图片版权归原作者 ギア 所有。
- 所以两张 skill 卡的铁律：**只给深链，不复制、不下载转发图片**。
- 姿势站另有声明：人台线稿非真人，勿用于指涉真人/未成年人或违反公序良俗——
  姿势 bot 默认避开"双人缠绵"系列，衣装 bot 默认避开内衣/性感/泳装分类。
