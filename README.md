# 微诗工作台 · Weishi Studio (Agent Skill)

[![Agent Skill](https://img.shields.io/badge/Agent_Skill-SKILL.md-8A2BE2)](./SKILL.md)
[![ZixiaoKit](https://img.shields.io/badge/Powered_by-ZixiaoKit-9B382B)](https://github.com/charsunny/zixiao-kit)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

**微诗工作台（Weishi Studio）** 是以 **Agent Skill 为主体** 封装的中国古典诗词、二十四节气画屏与东方水墨美学确定性视觉与短视频制片引擎。

本技能遵循标准 Agent Skill 规范（包含 [`SKILL.md`](./SKILL.md)、[`references/`](./references/)、[`scripts/`](./scripts/)、[`resources/`](./resources/) 与 [`examples/`](./examples/)），借鉴并深化了 [`lemomo-ai/lemo-opuscar`](https://github.com/lemomo-ai/lemo-opuscar) 的「将视频视为时间 $t$ 的纯函数 `window.render(t)` + 三层导演知识库」理念，深度结合 [子晓套件 `ZixiaoKit`](https://github.com/charsunny/zixiao-kit) 的程序化水墨山水（`ZixiaoArt`）、中国传统色配色体系、真实人声词级对齐（Audio-First Cue Grid）和程序化东方拟音（古琴泛音、落墨、朱印闷响、宣纸翻页），彻底攻克通用生成式 AI 视频在汉字书法乱码、水墨留白失真与声画脱节上的痛点。

---

## 一、五大东方美学母版与实拍接触表 (`examples/`)

每套母版均遵循 `window.render(t)` 确定性契约，支持 `9:16` (`1080×1920`)、`3:4`、`1:1`、`16:9` (`1920×1080`) 多画幅导出与 `readcheck` 字幕停留时长质检：

| 01 动态画屏 (`huaping-motion`)<br>寒露 · 杜甫《月夜忆舍弟》 | 01 动态画屏 (`huaping-motion`)<br>清明 · 杜牧《清明》 |
| :---: | :---: |
| ![寒露接触表](./examples/huaping-motion-hanlu-dufu.sheet.jpg) | ![清明接触表](./examples/huaping-motion-qingming-dumu.sheet.jpg) |

| 02 写意水墨 (`ink-story`)<br>苏轼《渔父》· 人声词级同步 + 书法题跋 | 02 写意水墨 (`ink-story`)<br>杜甫《晚晴》· 暖宣五墨 + 夕照江岸 |
| :---: | :---: |
| ![苏轼渔父接触表](./examples/sushi-yufu.sheet.jpg) | ![杜甫晚晴接触表](./examples/ink-story-wanqing-dufu-story.sheet.jpg) |

| 03 诗人行迹 (`poet-footprint`)<br>苏轼黄州·惠州·儋州三万里贬谪舆图 | 04 一曲诗词 (`poem-song-mv`)<br>范仲淹《苏幕遮·碧云天》· 唱盘与声波律动 |
| :---: | :---: |
| ![苏轼行迹接触表](./examples/poet-footprint.sheet.jpg) | ![苏幕遮接触表](./examples/poem-song-mv-sumuzhe-fanzhongyan-mv.sheet.jpg) |

---

## 二、技能规范目录结构

本仓库以标准 **Agent Skill** 规范组织，直接可挂载到各类 AI 编码助手：

```text
weishi-studio/
├── SKILL.md                         # Agent Skill 规范主入口 (OpenClaw / Claude / Antigravity / Cursor)
├── references/                      # 导演与风格知识库 (渐进式加载)
│   ├── DIRECTOR.md                  # 导演企划、TREATMENT 模板与两阶段把关手册
│   ├── TECHNIQUE.md                 # 确定性渲染契约 (window.render(t) / EV / TEXTS(t))
│   └── styles/                      # 五大东方美学风格手册 (STYLE.md)
│       ├── huaping-motion/STYLE.md  # 01 动态画屏 · 节气与每日一诗
│       ├── ink-story/STYLE.md       # 02 写意水墨 · 诗境故事与题跋赏析
│       ├── poet-footprint/STYLE.md  # 03 诗人行迹 · 舆图考据纪实
│       ├── poem-song-mv/STYLE.md    # 04 一曲诗词 · 诗音律动 MV
│       └── living-promo/STYLE.md    # 05 活体实机 · 产品与专题宣发
├── scripts/                         # 技能可执行自动化脚本
│   ├── produce.mjs                  # 一键端到端制片总控台 (检索->配方/TREATMENT->质检->渲染->发布)
│   ├── audio-cue.mjs                # 扫描朗读库自动生成人声词级对齐 Recipe
│   ├── readcheck.mjs                # 自动审计字幕停留时长 (>=0.22s/字) 与音效触发点
│   ├── render.mjs                   # 多进程并行截帧、接触表生成与 3 轨 -14 LUFS 混音导出
│   ├── preview.mjs                  # 启动交互式浏览器工作台 (http://127.0.0.1:4180)
│   └── server-util.mjs              # 纯 Web 场景本地资源伺服与 Puppeteer 探针
├── resources/                       # 模板、核心组件、引擎与配方
│   ├── core/                        # 确定性 PRNG、传统色、逐字墨洇与 48kHz 东方拟音合成器
│   ├── templates/                   # 四大纯 Web 场景模板 (HTML + Canvas + SVG)
│   ├── recipes/                     # 经典剧目导演配方 JSON
│   ├── vendor/zxart/                # 内置 ZixiaoArt Web Worker 程序化山水与花卉引擎
│   ├── assets/                      # 内置示例朗读人声、词级时间戳与环境配乐
│   └── workbench.html               # 交互式浏览器导演工作台 UI
├── examples/                        # 实拍九宫格接触表 (.sheet.jpg) 与分镜企划单示例
├── package.json                     # CLI 命令入口与依赖声明
└── LICENSE                          # MIT 开源许可证
```

---

## 三、作为 AI Agent Skill 安装使用

你可以将本技能一键安装至 **Antigravity / Claude Code / OpenClaw / Cursor** 等 AI 助手：

```bash
# 方式 1：工作区技能安装（Antigravity / Claude Code 自动发现）
mkdir -p .agents/skills
git clone https://github.com/charsunny/weishi-studio.git .agents/skills/weishi-studio
cd .agents/skills/weishi-studio && npm install

# 方式 2：用户全局安装（适用于所有项目）
git clone https://github.com/charsunny/weishi-studio.git ~/.gemini/config/skills/weishi-studio
cd ~/.gemini/config/skills/weishi-studio && npm install
```

安装后，AI Agent 将自动识别并加载该技能，你可以直接向 Agent 提问：
> - 「用 `weishi-studio` 为苏轼《渔父》制作一支写意水墨短视频，先出九宫格接触表」
> - 「检查寒露节气的动态画屏字幕是否符合 `>=0.22s/字` 的阅读驻留标准」

---

## 四、本地命令行快速上手

> 环境依赖：**Node.js >= 18**、本机安装有 **Google Chrome**（或指定 `CHROME_PATH`）与 **FFmpeg**。

```bash
git clone https://github.com/charsunny/weishi-studio.git
cd weishi-studio
npm install
```

### 1. 一键端到端全自动出片 (`scripts/produce.mjs`)
自动检索人声朗读与词级时间戳 → 生成配方 JSON、[`TREATMENT.md`](./examples/sushi-yufu.treatment.md) 与社区文案 → 执行 `readcheck` 质检 → 4 进程并行渲染 `1080×1920` MP4 + 九宫格接触表 `.sheet.jpg` + 封面图 `.cover.jpg`：
```bash
npm run produce -- --query "苏轼 渔父" --style ink-story --slug sushi-yufu
npm run produce -- --query "杜甫 晚晴" --style ink-story --slug wanqing-dufu
```

### 2. 启动交互式浏览器工作台 (`http://127.0.0.1:4180/`)
```bash
npm run preview
```
在浏览器中实时切换预设剧目、按 `Space` 播放/暂停、按 `←`/`→` 逐帧步进检查墨洇与山水动效、点击音效锚点跳转。

### 3. 自动化字幕时长与音效质检 (`scripts/readcheck.mjs`)
```bash
npm run readcheck -- --scene huaping-motion --recipe hanlu-dufu
npm run readcheck -- --scene ink-story --recipe sushi-yufu
npm run readcheck -- --scene poet-footprint
```

### 4. 秒级生成九宫格关键帧接触表 (`--sheet-only`)
```bash
npm run render -- --scene huaping-motion --recipe hanlu-dufu --sheet-only
```

### 5. 多进程并行导出高清 MP4 + 三轨自动闪避 `-14 LUFS` 混音
```bash
npm run render -- --scene huaping-motion --recipe hanlu-dufu --workers 4 --sheet
npm run render -- --scene huaping-motion --recipe qingming-dumu --workers 4 --sheet
npm run render -- --scene ink-story --recipe sushi-yufu --workers 4 --sheet
npm run render -- --scene poet-footprint --workers 4 --sheet
```

---

## 五、关联开源项目与致谢

- **[`charsunny/zixiao-kit`](https://github.com/charsunny/zixiao-kit)**：子晓古典文化产品矩阵的 Swift 共享内核（含 `ZixiaoArt` 原生 CoreGraphics / SwiftUI 程序化山水花鸟、`ZixiaoDesign` 传统色系统、`ZixiaoCalendar` 二十四节气七十二候历法）。
- **[`lemomo-ai/lemo-opuscar`](https://github.com/lemomo-ai/lemo-opuscar)**：确定性纯 Web 视频渲染与三层导演文档工程方法论启发。
- **[`LingDong-/shan-shui-inf`](https://github.com/LingDong-/shan-shui-inf) & [`LingDong-/nonflowers`](https://github.com/LingDong-/nonflowers)**：`ZixiaoArt` 底层程序化山水与花卉几何生成算法致谢（MIT License）。

## License

[MIT License](./LICENSE) © 2026 charsunny (Zixiao Studio)
