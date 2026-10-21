/**
 * 程序化东方拟音合成器 (Procedural Eastern Foley Synthesizer)
 *
 * 根据页面声明的 window.EV = [{ t: 2.8, sfx: 'seal-stamp', gain: -4 }, ...]
 * 直接在内存中合成 48kHz 16-bit 立体声 WAV 文件，供 ffmpeg 与配乐/人声混音。
 *
 * 支持音效：
 * - qin-harmonic : 古琴五度泛音（空灵弦音，适合开场/题签显影）
 * - ink-drop     : 水滴入砚/宣纸墨晕（温润低频水滴泛音，适合诗句起笔）
 * - seal-stamp   : 木石印章落纸闷响（扎实低频瞬态 + 宣纸微摩擦，适合朱印落下）
 * - page-turn    : 宣纸册页轻翻（带通滤波粉噪包络，适合转场）
 * - bamboo-chime : 竹林清音（清脆木竹泛音，适合节气点亮）
 */

import fs from 'node:fs';

const SAMPLE_RATE = 48000;

function dbToGain(db = 0) {
  return Math.pow(10, Number(db || 0) / 20);
}

/** 合成单个音效的左右声道 Float32 采样 */
function synthesizeEvent(sfx, gainDb = -6) {
  const amp = dbToGain(gainDb);

  if (sfx === 'seal-stamp') {
    // 木石印章落纸：0.38s，前 18ms 木石接触瞬态 + 95Hz 沉稳共鸣 + 细微纸张纹理
    const dur = 0.38;
    const len = Math.floor(SAMPLE_RATE * dur);
    const L = new Float32Array(len);
    const R = new Float32Array(len);
    let seed = 104729;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return (seed / 4294967296) * 2 - 1;
    };
    for (let i = 0; i < len; i++) {
      const t = i / SAMPLE_RATE;
      const thudEnv = Math.exp(-t * 28) * Math.sin(Math.min(1, t / 0.004) * (Math.PI / 2));
      const freq = 92 * Math.exp(-t * 8) + 48;
      const body = Math.sin(2 * Math.PI * freq * t) * 0.72 + Math.sin(2 * Math.PI * (freq * 2.15) * t) * 0.28;
      const clickEnv = Math.exp(-t * 140);
      const paperGrain = rand() * clickEnv * 0.25;
      const sample = (body * thudEnv + paperGrain) * amp * 0.85;
      L[i] = sample * 0.98;
      R[i] = sample * 1.02;
    }
    return { L, R };
  }

  if (sfx === 'ink-drop') {
    // 宣纸落墨水滴：0.45s，频率从 280Hz 向上微挑至 460Hz 再温润衰减
    const dur = 0.45;
    const len = Math.floor(SAMPLE_RATE * dur);
    const L = new Float32Array(len);
    const R = new Float32Array(len);
    let phase = 0;
    for (let i = 0; i < len; i++) {
      const t = i / SAMPLE_RATE;
      const env = Math.sin(Math.min(1, t / 0.008) * (Math.PI / 2)) * Math.exp(-t * 14);
      const f = 260 + 210 * (1 - Math.exp(-t * 22));
      phase += (2 * Math.PI * f) / SAMPLE_RATE;
      const s = (Math.sin(phase) * 0.8 + Math.sin(phase * 2.02) * 0.2 * Math.exp(-t * 25)) * env * amp * 0.65;
      L[i] = s * 0.95;
      R[i] = s * 1.05;
    }
    return { L, R };
  }

  if (sfx === 'qin-harmonic') {
    // 古琴泛音（宫-徵五度双泛音，2.4s 悠长余韵）
    const dur = 2.4;
    const len = Math.floor(SAMPLE_RATE * dur);
    const L = new Float32Array(len);
    const R = new Float32Array(len);
    const f1 = 293.66; // D4
    const f2 = 440.0;  // A4
    for (let i = 0; i < len; i++) {
      const t = i / SAMPLE_RATE;
      const attack = Math.min(1, t / 0.025);
      const env1 = attack * Math.exp(-t * 1.9);
      const env2 = Math.min(1, Math.max(0, (t - 0.06) / 0.025)) * Math.exp(-Math.max(0, t - 0.06) * 2.2);
      const tone1 =
        Math.sin(2 * Math.PI * f1 * t) * 0.65 +
        Math.sin(2 * Math.PI * f1 * 2 * t) * 0.25 +
        Math.sin(2 * Math.PI * f1 * 3 * t) * 0.1;
      const tone2 =
        Math.sin(2 * Math.PI * f2 * t) * 0.6 +
        Math.sin(2 * Math.PI * f2 * 2 * t) * 0.3 * Math.exp(-t * 3.5);
      L[i] = (tone1 * env1 * 0.55 + tone2 * env2 * 0.45) * amp * 0.5;
      R[i] = (tone1 * env1 * 0.45 + tone2 * env2 * 0.55) * amp * 0.5;
    }
    return { L, R };
  }

  if (sfx === 'page-turn') {
    // 宣纸轻翻：0.35s 柔和滤波噪声包络
    const dur = 0.35;
    const len = Math.floor(SAMPLE_RATE * dur);
    const L = new Float32Array(len);
    const R = new Float32Array(len);
    let seed = 88321;
    let prev = 0;
    let prev2 = 0;
    for (let i = 0; i < len; i++) {
      const t = i / SAMPLE_RATE;
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const white = (seed / 4294967296) * 2 - 1;
      // 简易一阶低通 + 带通质感
      prev = prev * 0.86 + white * 0.14;
      const band = prev - prev2 * 0.7;
      prev2 = prev;
      const env = Math.sin((t / dur) * Math.PI) * Math.exp(-t * 4);
      const s = band * env * amp * 0.55;
      L[i] = s * 1.05;
      R[i] = s * 0.92;
    }
    return { L, R };
  }

  // 默认 bamboo-chime：清润竹音
  const dur = 0.6;
  const len = Math.floor(SAMPLE_RATE * dur);
  const L = new Float32Array(len);
  const R = new Float32Array(len);
  const f = 587.33; // D5
  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    const env = Math.min(1, t / 0.006) * Math.exp(-t * 9.5);
    const s = (Math.sin(2 * Math.PI * f * t) * 0.75 + Math.sin(2 * Math.PI * f * 2.76 * t) * 0.25 * Math.exp(-t * 20)) * env * amp * 0.45;
    L[i] = s;
    R[i] = s;
  }
  return { L, R };
}

/**
 * 将事件列表合成为完整时长 WAV 文件并写入 outPath
 * @param {Array<{t: number, sfx: string, gain?: number}>} events
 * @param {number} totalDurationSeconds
 * @param {string} outPath
 */
export function renderFoleyWav(events, totalDurationSeconds, outPath) {
  const totalSamples = Math.max(1, Math.ceil(totalDurationSeconds * SAMPLE_RATE));
  const mixL = new Float32Array(totalSamples);
  const mixR = new Float32Array(totalSamples);

  for (const ev of events || []) {
    if (!ev || typeof ev.t !== 'number' || ev.t < 0 || ev.t >= totalDurationSeconds) continue;
    const startIdx = Math.floor(ev.t * SAMPLE_RATE);
    const { L, R } = synthesizeEvent(ev.sfx || 'bamboo-chime', ev.gain ?? -6);
    const endIdx = Math.min(totalSamples, startIdx + L.length);
    for (let i = startIdx; i < endIdx; i++) {
      mixL[i] += L[i - startIdx];
      mixR[i] += R[i - startIdx];
    }
  }

  // 编码 16-bit PCM Stereo WAV
  const dataBytes = totalSamples * 4;
  const buf = Buffer.alloc(44 + dataBytes);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataBytes, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); // PCM chunk size
  buf.writeUInt16LE(1, 20);  // AudioFormat = 1 (PCM)
  buf.writeUInt16LE(2, 22);  // NumChannels = 2
  buf.writeUInt32LE(SAMPLE_RATE, 24);
  buf.writeUInt32LE(SAMPLE_RATE * 4, 28); // ByteRate
  buf.writeUInt16LE(4, 32);  // BlockAlign
  buf.writeUInt16LE(16, 34); // BitsPerSample
  buf.write('data', 36);
  buf.writeUInt32LE(dataBytes, 40);

  let offset = 44;
  for (let i = 0; i < totalSamples; i++) {
    const sL = Math.max(-1, Math.min(1, mixL[i]));
    const sR = Math.max(-1, Math.min(1, mixR[i]));
    buf.writeInt16LE(Math.round(sL * 32767), offset);
    buf.writeInt16LE(Math.round(sR * 32767), offset + 2);
    offset += 4;
  }

  fs.writeFileSync(outPath, buf);
  return outPath;
}
