#!/usr/bin/env node
/**
 * 微诗视频工作台 · 实时预览服务器 (preview.mjs)
 *
 * 启动后打开 http://127.0.0.1:4180/ 即可在浏览器中使用交互式视频工作台
 * （切换风格母版与节气配方、拖动时间轴、单帧步进、查看音效点与实时字幕快照）。
 */

import { startStudioServer } from './server-util.mjs';

const port = Number(process.env.PORT || 4180);
const { baseUrl } = await startStudioServer(port);
console.log(`\n========================================================`);
console.log(`  微诗视频工作台 (Weishi Video Studio) 已启动`);
console.log(`  交互式导演台: ${baseUrl}/`);
console.log(`========================================================\n`);
