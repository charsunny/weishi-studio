/**
 * 微诗视频工作台 · 静态资源服务器与 Puppeteer 发现工具
 *
 * 自动映射：
 * - /vendor/zxart/* -> <repoRoot>/web/public/vendor/zxart/* (ZixiaoArt Web Worker)
 * - 其余路径 -> <repoRoot>/* (fonts/, tools/video-studio/, artifacts/, etc.)
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const STUDIO_ROOT = path.resolve(__dirname, '..');
export const REPO_ROOT = path.resolve(STUDIO_ROOT, '../..');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.m4a': 'audio/mp4',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.otf': 'font/otf',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
};

export const ASSETS_ROOT = process.env.WEISHI_ASSETS_ROOT || path.resolve(REPO_ROOT, '../assets');

export function resolveRepoFile(urlPath) {
  const cleanUrl = decodeURIComponent(urlPath.split('?')[0]);
  if (cleanUrl === '/' || cleanUrl === '/workbench') {
    return path.join(STUDIO_ROOT, 'workbench.html');
  }
  if (cleanUrl.startsWith('/tools/video-studio/')) {
    const sub = cleanUrl.slice('/tools/video-studio/'.length);
    const localFp = path.join(STUDIO_ROOT, sub);
    if (fs.existsSync(localFp)) return localFp;
  }
  if (cleanUrl.startsWith('/vendor/zxart/')) {
    const sub = cleanUrl.slice('/vendor/zxart/'.length);
    const bundled = path.join(STUDIO_ROOT, 'vendor/zxart', sub);
    if (fs.existsSync(bundled)) return bundled;
    return path.join(REPO_ROOT, 'web/public/vendor/zxart', sub);
  }
  if (cleanUrl.startsWith('/artifacts/promo-8.0/assets/audio/')) {
    const sub = cleanUrl.slice('/artifacts/promo-8.0/assets/audio/'.length);
    const bundled = path.join(STUDIO_ROOT, 'assets/audio', sub);
    if (fs.existsSync(bundled)) return bundled;
  }
  if (cleanUrl.startsWith('/assets/wish/audio/poetryhub-voicebox-readings/2026-06-22/')) {
    const sub = cleanUrl.slice('/assets/wish/audio/poetryhub-voicebox-readings/2026-06-22/'.length);
    const bundled = path.join(STUDIO_ROOT, 'assets/readings', sub);
    if (fs.existsSync(bundled)) return bundled;
  }
  if (cleanUrl.startsWith('/assets/')) {
    const sub = cleanUrl.slice('/assets/'.length);
    const bundled = path.join(STUDIO_ROOT, 'assets', sub);
    if (fs.existsSync(bundled)) return bundled;
    const assetFp = path.join(ASSETS_ROOT, sub);
    if (fs.existsSync(assetFp)) return assetFp;
  }
  const studioCandidate = path.join(STUDIO_ROOT, cleanUrl);
  if (fs.existsSync(studioCandidate) && !fs.statSync(studioCandidate).isDirectory()) {
    return studioCandidate;
  }
  let fp = path.join(REPO_ROOT, cleanUrl);
  if (fs.existsSync(fp) && fs.statSync(fp).isDirectory()) {
    fp = path.join(fp, 'index.html');
  }
  return fp;
}

export function startStudioServer(port = 0) {
  return new Promise((resolve, reject) => {
    const srv = http.createServer((req, res) => {
      const fp = resolveRepoFile(req.url || '/');
      const allowed =
        fp.startsWith(STUDIO_ROOT) || fp.startsWith(REPO_ROOT) || fp.startsWith(ASSETS_ROOT);
      if (!allowed || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) {
        res.writeHead(404);
        res.end('Not found: ' + req.url);
        return;
      }
      const ext = path.extname(fp).toLowerCase();
      const stat = fs.statSync(fp);
      const mime = MIME[ext] || 'application/octet-stream';

      const range = req.headers.range;
      if (range && (ext === '.mp4' || ext === '.m4a' || ext === '.mp3' || ext === '.wav')) {
        const m = /bytes=(\d+)-(\d*)/.exec(range);
        const start = m ? parseInt(m[1], 10) : 0;
        const end = m && m[2] ? parseInt(m[2], 10) : stat.size - 1;
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${stat.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': end - start + 1,
          'Content-Type': mime,
        });
        fs.createReadStream(fp, { start, end }).pipe(res);
        return;
      }

      res.writeHead(200, {
        'Content-Type': mime,
        'Content-Length': stat.size,
        'Access-Control-Allow-Origin': '*',
      });
      fs.createReadStream(fp).pipe(res);
    });

    srv.on('error', reject);
    srv.listen(port, '127.0.0.1', () => {
      const addr = srv.address();
      resolve({ server: srv, port: addr.port, baseUrl: `http://127.0.0.1:${addr.port}` });
    });
  });
}

export async function loadPuppeteer() {
  try {
    return (await import('puppeteer-core')).default;
  } catch {
    try {
      const req = createRequire(path.join(STUDIO_ROOT, 'package.json'));
      return req('puppeteer-core');
    } catch {
      const req = createRequire(path.join(REPO_ROOT, 'artifacts/promo-8.0/package.json'));
      return req('puppeteer-core');
    }
  }
}

export function findChromeExecutable() {
  const candidates = [
    process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
  ].filter(Boolean);
  const found = candidates.find((p) => fs.existsSync(p));
  if (!found) throw new Error('未找到本机 Google Chrome，请设置 CHROME_PATH 环境变量');
  return found;
}

/** 将场景参数解析为相对于站点根的 URL 路径 */
export function normalizeSceneUrl(sceneArg = 'huaping-motion', recipeArg = '') {
  let url = sceneArg;
  if (!url.startsWith('/') && !url.includes('.html')) {
    url = `/tools/video-studio/templates/${url}/index.html`;
  } else if (!url.startsWith('/')) {
    const abs = path.resolve(process.cwd(), url);
    if (abs.startsWith(REPO_ROOT)) {
      url = '/' + path.relative(REPO_ROOT, abs).replace(/\\/g, '/');
    } else {
      url = '/' + url;
    }
  }
  const sep = url.includes('?') ? '&' : '?';
  const query = [];
  if (recipeArg) query.push(`recipe=${encodeURIComponent(recipeArg)}`);
  query.push('capture=1');
  return url + sep + query.join('&');
}
