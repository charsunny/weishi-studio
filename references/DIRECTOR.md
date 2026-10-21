# 微诗视频工作台 · 导演手册（DIRECTOR.md）

> 本手册定义 AI Agent（或人类创作者）使用微诗视频工作台（`tools/video-studio`）企划、执导、质检与导出视频的标准工作流。
> 结合 [`TECHNIQUE.md`](./TECHNIQUE.md)（确定性渲染技术规范）与 [`styles/<slug>/STYLE.md`](./styles/)（五大东方美学风格母版）使用。

---

## 1. 角色分工：用户给「拍什么」，导演定「怎么拍」

### 1.1 启动前需要确认的 5 个输入（Brief）
如果用户只给了一句话（例如「帮杜甫《月夜忆舍弟》做个寒露竖屏视频」或「给 8.0 画屏系列做个 30 秒宣传片」），先从仓库资产中补齐上下文，仅对缺失项做极简确认：

1. **内容主体（Subject）**：具体诗作（标题、作者、正文、题解/夹注）、节气/主题或产品功能点。
2. **风格母版（Style Slug）**：从微诗五大母版中选定其一（或混搭）：
   - `huaping-motion`（动态画屏 · 每日一诗 / 节气金句，12–24s）
   - `ink-story`（写意水墨 · 诗境故事与题跋赏析，45–90s）
   - `poet-footprint`（诗人行迹 · 舆图考据纪实，60–120s）
   - `poem-song-mv`（一曲诗词 · 诗音律动 MV，30–60s）
   - `living-promo`（活体实机 · 产品与专题宣发，30–60s）
3. **画幅比例（Aspect Ratio）**：
   - `9:16`（`1080×1920`）：抖音 / 视频号 / 快手 / 详情页全屏短视频（默认）
   - `3:4`（`1080×1440`）：小红书竖幅画屏分享
   - `1:1`（`1080×1080`）：朋友圈方幅画屏分享
   - `16:9`（`1920×1080`）：B 站 / 官网 / App Store 横屏宣传片
4. **声音策略（Audio Mode）**：
   - `silent`：无声导出（供抖音/小红书直接挂平台正版曲库，遵循 `docs/HUAPING_MOTION_PLAN.md` §6.4）
   - `bgm+foley`：内置电台配乐（`RadioMusic-{calm,warm,expansive,wistful}`）+ `window.EV` 程序化东方拟音（古琴泛音、水墨滴落、朱印落下）
   - `voice+bgm+foley`：Voicebox / 阿里云 TTS 诗词朗读 + 字级时间戳对齐 + BGM 自动闪避（Ducking）+ 拟音
5. **色彩与外观（Palette & Scheme）**：
   - 情绪配色（取自 `ios/Shared/Huaping/mood-palettes.json`：`yuebai` 月白、`lanhui` 蓝灰、`xiangse` 缃色、`qiuxiang` 秋香、`zhuqing` 竹青等）或传统色身份（`yaqing` 鸦青默认）
   - `light`（浅色宣纸）或 `dark`（夜色苍黑）

---

## 2. 导演分镜企划单（`TREATMENT.md`）

在编写复杂的长视频（`ink-story`、`poet-footprint`、`living-promo`）代码前，先在输出目录生成简明的 `TREATMENT.md`：

1. **Logline（一句话主旨）**：全片要立住的那口气（如：「寒露夜色下，孤舟渔火与南飞秋雁衬出杜甫乱世思乡的沉郁顿挫」）。
2. **Visual Motif & Weather（核心意象与天气）**：最多选 **2 种** 互不冲突的天气点缀（参照 `HUAPING_MOTION_PLAN.md` §3.3：雨×雪互斥、月×落日互斥；渔灯在深色有船时自动附着）。
3. **Shot List & Timing（分镜与时间线表）**：
   - 明确每一幕的起止秒数 `[t0, t1]`、画面构图、文字内容、入场方式（逐字墨洇 / 按行墨洇 / 书法题跋）及音效触发点 `window.EV`。
   - **时长红线**：单屏中文阅读停留必须满足 `readcheck` 标准（`clamp(字数 × 0.3s, 6s, 20s)`，或解说题跋至少 `0.25s/字` 且单条 `≥ 1.5s`）。

---

## 3. 两阶段质量把关（Two-Checkpoint Workflow）

遵循 `lemo-opuscar` 的高效迭代原则，**绝不盲目跑完几分钟全量视频才发现排版溢出**：

### Checkpoint 1：关键帧接触表检视（Contact Sheet）
写好场景 HTML 后，先用 `--sheet-only` 秒级生成九宫格/十宫格关键帧接触表（`*.sheet.jpg`），并运行自动字幕时长审计：
```sh
node tools/video-studio/bin/readcheck.mjs --scene <path>
node tools/video-studio/bin/render.mjs --scene <path> --sheet-only
```
使用 `view_file` 检视接触表，重点排查：
- 诗句/题跋是否压住山峰主视觉或超出安全区（竖屏左右各留 ≥12%，底部留出平台文案遮挡区）？
- 浅色/深色模式下正文对比度是否 ≥ 4.5:1？
- 印章（朱印）是否在诗句落定后才盖下？

### Checkpoint 2：多进程全量导出与音画合成
确认接触表无误后，开启多 Worker 并行导出完整 MP4（自动混入 `window.EV` 拟音与 `-14 LUFS` 响度标准化）：
```sh
node tools/video-studio/bin/render.mjs --scene <path> --workers 4 --sheet
```
最后如需发布至微诗社区，调用 `poetryhub-skill`：
```sh
./poetryhub-skill/scripts/poetryhub.mjs publish-video --poem-id "$POEM_ID" --video-file out/video.mp4 --thumbnail out/cover.jpg
```
