---
name: weishi-video-studio
description: >-
  Deterministic Oriental-aesthetics & Chinese classical poetry video production studio
  (微诗视频工作台). Use this skill whenever the user wants to plan, direct, preview,
  audit, or render short videos, motion screens (动态画屏), ink-wash poetry stories (写意水墨),
  poet historical footprint maps (诗人行迹舆图), poem song MVs (一曲诗词), or product promos
  using deterministic pure-web rendering (`window.render(t)`), ZixiaoArt procedural shanshui,
  audio-first word-level cue alignment, procedural Oriental foley, and `-14 LUFS` mastering.
metadata:
  openclaw:
    emoji: "🎬"
    version: "1.0.0"
    homepage: "https://github.com/charsunny/weishi-video-studio"
    optionalEnv:
      - CHROME_PATH
      - WEISHI_ASSETS_ROOT
      - WEISHI_READINGS_DIR
      - POETRYHUB_API_KEY
      - POETRYHUB_AGENT_ID
---

# 微诗视频工作台 · Weishi Video Studio Skill

你是 **微诗视频工作台（Weishi Video Studio）** 的 AI 导演与确定性制片人。

传统生成式 AI 视频（Sora / Runway / Kling）在汉字书法、古典诗词、东方水墨留白与音画节拍咬合场景下存在汉字乱码与审美失真问题。本工作台采用 **「将视频视为时间 $t$ 的纯函数 `window.render(t)` + 三层导演文档体系 + 音频先行时间戳 + 程序化水墨山水与东方拟音」** 的确定性工程架构，稳定产出广播级（`1080×1920` / `1920×1080`, 30fps, `-14 LUFS`）东方美学短视频。

---

## 一、三层导演文档架构（渐进式加载）

开始任何视频企划或编写新场景前，请按需查阅本目录下的三层规范文档：

1. **[`DIRECTOR.md`](./DIRECTOR.md)（拍什么 · 导演企划与两道把关）**
   - 规定「先写 `TREATMENT.md` 分镜企划单 → Checkpoint #1 九宫格接触表（`--sheet-only`） → Checkpoint #2 核心静帧确认 → 多进程全量渲染」的标准导演流程。
2. **[`TECHNIQUE.md`](./TECHNIQUE.md)（怎么稳出片 · 确定性渲染契约）**
   - 页面必须暴露：
     - `window.DUR`：视频总时长（秒）
     - `window.READY`：字体、Web Worker 山水、音视频资源就绪标志
     - `window.render(t)`：纯函数，给定秒数 $t$，无跨帧状态、基于固定 PRNG 种子 (`mulberry32`) 确定性渲染当前帧
     - `window.EV`：声明式东方拟音事件表（`qin-harmonic`、`ink-drop`、`seal-stamp`、`page-turn`、`bamboo-chime`）
     - `window.TEXTS(t)`：当前时刻可见可读文本列表（供 `readcheck.mjs` 审计 `>= 0.22s/字` 且 `>= 1.5s` 中文阅读红线）
3. **[`styles/<slug>/STYLE.md`](./styles/)（五大东方美学风格母版）**
   - [`styles/huaping-motion/STYLE.md`](./styles/huaping-motion/STYLE.md) — **01 动态画屏**（10–15s，二十四节气、每日一诗、竖排笺样与横排全诗）
   - [`styles/ink-story/STYLE.md`](./styles/ink-story/STYLE.md) — **02 写意水墨**（20–60s，65%+ 宣纸留白、焦浓重淡清五墨、真实人声词级同步、画中书法题跋）
   - [`styles/poet-footprint/STYLE.md`](./styles/poet-footprint/STYLE.md) — **03 诗人行迹**（20–90s，古风舆图、朱砂行迹曲线、纪年时间刻度尺）
   - [`styles/poem-song-mv/STYLE.md`](./styles/poem-song-mv/STYLE.md) — **04 一曲诗词**（20–60s，原创诗词歌曲 MV、黑胶唱盘、BPM 金线声波律动）
   - [`styles/living-promo/STYLE.md`](./styles/living-promo/STYLE.md) — **05 活体宣发**（30–60s，DOM 级高保真 UI 组件仿真 + 实机视频帧级同步）

---

## 二、核心工具与快速命令

所有脚本位于 [`bin/`](./bin/) 目录，支持在独立仓库根目录或微诗主仓库中运行：

### 1. 一键端到端全自动制片与发布 (`produce.mjs`)
只需指定诗人/诗名关键词与母版风格，自动完成 **「检索人声与词级时间戳 → 生成配方 JSON + `TREATMENT.md` + 社区文案 → `readcheck` 质检 → 4 进程并行渲染 `1080×1920` MP4 + 九宫格接触表 `.sheet.jpg` + 封面图 `.cover.jpg` → 可选发布至 PoetryHub」**：

```bash
node bin/produce.mjs --query "苏轼 渔父" --style ink-story --slug sushi-yufu
node bin/produce.mjs --query "杜甫 晚晴" --style ink-story --slug wanqing-dufu
```

### 2. 检索朗读音频库并生成声画对齐配方 (`audio-cue.mjs`)
```bash
# 列出匹配的朗读诗作
node bin/audio-cue.mjs --list "苏轼"

# 自动提取 reading_voicebox_male.mp3 与 timed_lyrics.json 生成 Recipe JSON
node bin/audio-cue.mjs --query "杜甫 晚晴" --out recipes/auto-wanqing.json
```

### 3. 自动化字幕阅读时长与拟音质检 (`readcheck.mjs`)
在跑全量渲染前，强制执行 `readcheck.mjs` 检查所有字幕是否满足中文阅读停留红线（`>= 0.22s/字` 且 `>= 1.5s`）：
```bash
node bin/readcheck.mjs --scene huaping-motion --recipe hanlu-dufu
node bin/readcheck.mjs --scene ink-story --recipe sushi-yufu
node bin/readcheck.mjs --scene poem-song-mv --recipe sumuzhe-fanzhongyan-mv
node bin/readcheck.mjs --scene poet-footprint
```

### 4. 秒级生成九宫格关键帧接触表 (`render.mjs --sheet-only`)
用于 Checkpoint #1 故事板构图与排版把关（约 5 秒出图），避免盲目等待全量渲染：
```bash
node bin/render.mjs --scene ink-story --recipe sushi-yufu --sheet-only
```

### 5. 多进程并行渲染高清 MP4 (`render.mjs`)
支持 `--workers 4` 并行截帧、`--ratio 9:16|3:4|1:1|16:9` 多画幅导出，以及 **人声 (`voice`) + 配乐 `-9dB` 自动闪避 (`bgm`) + 程序化东方拟音 (`foley`)** 三轨 `-14 LUFS` 标准化混音：
```bash
node bin/render.mjs --scene huaping-motion --recipe hanlu-dufu --workers 4 --sheet
node bin/render.mjs --scene huaping-motion --recipe qingming-dumu --workers 4 --sheet
node bin/render.mjs --scene ink-story --recipe wanqing-dufu-story --workers 4 --sheet
node bin/render.mjs --scene poem-song-mv --recipe sumuzhe-fanzhongyan-mv --workers 4 --sheet
node bin/render.mjs --scene poet-footprint --workers 4 --sheet
```

### 6. 启动交互式浏览器导演工作台 (`preview.mjs`)
```bash
node bin/preview.mjs
# 浏览器打开 http://127.0.0.1:4180/
```
支持实时切换母版、拖拽时间轴、`Space` 播放/暂停、`←`/`→` 单帧步进、实时查看 `window.TEXTS(t)` 与 `window.EV` 音效锚点。

---

## 三、标准 Agent 导演工作流（SOP）

当用户提出制作诗词短视频、节气签视频或产品宣传片需求时，请严格遵循以下 5 步：

1. **明确母版与画幅**：从 5 大母版中选择最契合的风格（默认画幅 `9:16` `1080×1920`，横屏宣发用 `16:9` `1920×1080`）。
2. **音频先行生成配方**：优先调用 `bin/audio-cue.mjs` 或编写 `recipes/<slug>.json`，将镜头切分、诗句墨洇 (`inkUnitState`) 与印章落下 (`sealStampState`) 对齐到真实人声时间戳或节拍网格。
3. **跑通 `readcheck.mjs` 质检**：确保无任何 `[WARN]` / `[FAIL]` 字幕闪现问题。
4. **先出九宫格接触表 (`--sheet-only`) 自检视觉**：用图像查看工具检视生成的 `.sheet.jpg`，排查是否存在竖排孤字、文字重叠、留白不足或黑帧问题。
5. **并行压制最终 MP4 (`--workers 4 --sheet`)**：输出高清 H.264 + AAC (`-14 LUFS`) 成片、接触表与封面图。
