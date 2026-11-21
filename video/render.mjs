// Render a scene frame-by-frame in headless Chromium and encode an MP4 with its soundtrack.
// usage: node render.mjs scene1 [fps]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const scene = process.argv[2] || 'scene1';
const fps = Number(process.argv[3] || 30);
const root = path.dirname(new URL(import.meta.url).pathname);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const f = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  if (!f.startsWith(root) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(0);
const port = server.address().port;

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 720, height: 1280 }, deviceScaleFactor: Number(process.env.SCALE || 1) });
page.on('pageerror', e => console.error('PAGE ERROR', e));
await page.goto(`http://localhost:${port}/engine.html?scene=${scene}`);
await page.waitForFunction(() => window.__ready, null, { timeout: 60000 });
const duration = await page.evaluate(() => window.__duration);
const frames = Math.round(duration * fps);
const F0 = Math.round(Number(process.env.START || 0) * fps), F1 = Math.min(frames, Math.round(Number(process.env.END || duration) * fps));
const PART = process.env.PART || '';
if (process.env.SNAP) { // quick check: SNAP="1,5.5,9" node render.mjs scene → out/snap_<t>.png
  fs.mkdirSync(path.join(root, 'out'), { recursive: true });
  for (const t of process.env.SNAP.split(',').map(Number)) {
    await page.evaluate(t => window.__render(t), t);
    await (await page.$('#stage')).screenshot({ path: path.join(root, 'out', `snap_${t}.png`) });
  }
  await browser.close(); server.close(); process.exit(0);
}

fs.mkdirSync(path.join(root, 'out'), { recursive: true });
const out = path.join(root, 'out', PART ? `${scene}_part${PART}.mp4` : `${scene}.mp4`);
const audio = path.join(root, 'out', `${scene}.wav`);
const ff = spawn('ffmpeg', ['-y', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
  ...(!PART && fs.existsSync(audio) ? ['-i', audio, '-c:a', 'aac', '-b:a', '160k'] : []),
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'medium', '-movflags', '+faststart', '-shortest', out],
  { stdio: ['pipe', 'ignore', 'inherit'] });

const el = await page.$('#stage');
for (let i = F0; i < F1; i++) {
  await page.evaluate(t => window.__render(t), i / fps);
  const buf = await el.screenshot({ type: 'jpeg', quality: 92 });
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if (i % fps === 0) process.stdout.write(`\r${scene}: ${(i / fps).toFixed(0)}s / ${duration}s`);
}
ff.stdin.end();
await new Promise(r => ff.on('close', r));
await browser.close(); server.close();
console.log(`\nwrote ${out}`);
