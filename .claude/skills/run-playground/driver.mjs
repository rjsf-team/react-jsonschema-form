#!/usr/bin/env node
// Drives the rjsf playground in headless Chrome over the DevTools protocol. No dependencies: Node 22+'s global
// WebSocket talks to whatever Chrome/Chromium is installed, so nothing has to be added to the workspace.
//
//   node .claude/skills/run-playground/driver.mjs [options] <step> [<step> ...]
//
// Options:
//   --port <n>        dev server port (default 5199; started on demand with --strictPort)
//   --keep-server     leave the dev server running for the next invocation (stop it later with `stop-server`)
//   --headed          show the Chrome window
//   --width/--height  viewport (default 1400x1100)
//   --quiet           don't echo the page's console.log lines (errors and warnings are always echoed)
//
// Steps (selectors without a `top:` prefix are resolved inside the form's iframe):
//   load <setup.json|-|json>   open the playground with a shared-link setup: {schema, uiSchema, formData, theme,
//                              validator, liveSettings}; any key may be omitted
//   open                       open the playground's default page (the Simple sample)
//   sample <name>              click a sample tab, e.g. `sample Arrays`
//   theme <name>               switch theme from the theme selector, e.g. `theme mui`
//   fill <sel> <text>          replace an input's value by typing (real key input events)
//   click <sel>                real mouse click at the element's center
//   select <sel> <value>       set a native <select>'s value and fire change
//   press <key>                Tab, Enter, Escape, Backspace, ArrowDown, ArrowUp, Space
//   submit                     click the form's submit button (the playground's alert is auto-accepted)
//   wait <ms> | waitfor <sel>  pause, or wait until a selector exists
//   text <sel>                 print an element's textContent
//   html <sel>                 print an element's outerHTML
//   count <sel>                print how many elements match
//   errors                     print the form's rendered error messages
//   formdata                   print the playground's formData editor contents (the form's onChange value)
//   eval <js>                  evaluate in the page; `doc` is the form iframe's document, `frame` its window
//   shot <file.png>            screenshot the whole viewport
//   shotform <file.png>        screenshot just the rendered form (cropped to its height)
//   stop-server                stop a server left running by --keep-server
import { spawn, execFileSync } from 'node:child_process';
import {
  closeSync,
  existsSync,
  mkdtempSync,
  openSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
  mkdirSync,
} from 'node:fs';
import { tmpdir, homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const PLAYGROUND = path.join(REPO, 'packages/playground');

const args = process.argv.slice(2);
const opts = { port: 5199, keepServer: false, headed: false, width: 1400, height: 1100, quiet: false };
const steps = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--port') opts.port = Number(args[++i]);
  else if (a === '--keep-server') opts.keepServer = true;
  else if (a === '--headed') opts.headed = true;
  else if (a === '--width') opts.width = Number(args[++i]);
  else if (a === '--height') opts.height = Number(args[++i]);
  else if (a === '--quiet') opts.quiet = true;
  else steps.push(a);
}
const BASE = `http://localhost:${opts.port}`;
const PIDFILE = path.join(tmpdir(), `rjsf-playground-${opts.port}.pid`);
const LOGFILE = path.join(tmpdir(), `rjsf-playground-${opts.port}.log`);

const ARITY = {
  load: 1,
  open: 0,
  sample: 1,
  theme: 1,
  fill: 2,
  click: 1,
  select: 2,
  press: 1,
  submit: 0,
  wait: 1,
  waitfor: 1,
  text: 1,
  html: 1,
  count: 1,
  errors: 0,
  formdata: 0,
  eval: 1,
  shot: 1,
  shotform: 1,
  'stop-server': 0,
};
const plan = [];
for (let i = 0; i < steps.length;) {
  const name = steps[i++];
  if (!(name in ARITY)) die(`unknown step "${name}" (see the header of driver.mjs)`);
  plan.push([name, ...steps.slice(i, i + ARITY[name])]);
  i += ARITY[name];
}
if (plan.length === 0) die('no steps given, e.g.: driver.mjs open shot /tmp/playground.png');

function die(msg) {
  console.error(`driver: ${msg}`);
  process.exit(2);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- dev server ----------

// Another checkout's playground may already own a port, and plain `pnpm start` silently moves to the next free one,
// so a server is reused only if its Vite workspace is this checkout: Vite's /@fs/ route 403s outside its own root.
async function serverIsOurs() {
  try {
    const res = await fetch(`${BASE}/@fs${PLAYGROUND}/src/app.tsx`);
    return res.ok;
  } catch {
    return null;
  }
}

async function ensureServer() {
  const ours = await serverIsOurs();
  if (ours) return null;
  if (ours === false) die(`port ${opts.port} is held by another server (another checkout?); pass --port <free port>`);
  // Output goes to a file, not a pipe: a --keep-server vite outlives this process, and once its pipe's reader is gone
  // its next log line (an HMR update) kills it with EPIPE
  const out = openSync(LOGFILE, 'w');
  const child = spawn('pnpm', ['exec', 'vite', '--port', String(opts.port), '--strictPort'], {
    cwd: PLAYGROUND,
    env: { ...process.env, BROWSER: 'none', VITE_CONFIG_NATIVE_IGNORE_WARNING: 'true' },
    detached: true,
    stdio: ['ignore', out, out],
  });
  closeSync(out);
  writeFileSync(PIDFILE, String(child.pid));
  const log = () => readFileSync(LOGFILE, 'utf8');
  for (let i = 0; i < 120; i++) {
    if (child.exitCode !== null) die(`vite exited:\n${log()}`);
    if (await serverIsOurs()) {
      console.error(`[server] vite up on ${BASE} (pid group ${child.pid}, log ${LOGFILE})`);
      if (opts.keepServer) child.unref();
      return child;
    }
    await sleep(500);
  }
  die(`vite did not come up in 60s:\n${log()}`);
}

function stopServerGroup(pid) {
  try {
    process.kill(-pid, 'SIGTERM');
  } catch {}
  rmSync(PIDFILE, { force: true });
}

// ---------- Chrome ----------

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
  ];
  for (const bin of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']) {
    try {
      candidates.push(execFileSync('which', [bin], { encoding: 'utf8' }).trim());
    } catch {}
  }
  // Playwright's browser cache, if any project on the machine installed one
  for (const cache of [
    path.join(homedir(), 'Library/Caches/ms-playwright'),
    path.join(homedir(), '.cache/ms-playwright'),
  ]) {
    if (!existsSync(cache)) continue;
    for (const dir of readdirSync(cache)
      .filter((d) => /^chromium-\d+$/.test(d))
      .sort()
      .reverse()) {
      candidates.push(
        path.join(
          cache,
          dir,
          'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
        ),
        path.join(cache, dir, 'chrome-mac/Chromium.app/Contents/MacOS/Chromium'),
        path.join(cache, dir, 'chrome-linux64/chrome'),
        path.join(cache, dir, 'chrome-linux/chrome'),
      );
    }
  }
  const found = candidates.find((c) => c && existsSync(c));
  if (!found) die('no Chrome/Chromium found; set CHROME_PATH');
  return found;
}

async function launchChrome() {
  const profile = mkdtempSync(path.join(tmpdir(), 'rjsf-chrome-'));
  const chrome = spawn(
    findChrome(),
    [
      opts.headed ? '' : '--headless=new',
      '--remote-debugging-port=0',
      `--user-data-dir=${profile}`,
      `--window-size=${opts.width},${opts.height}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-gpu',
      ...(process.getuid?.() === 0 ? ['--no-sandbox'] : []),
      'about:blank',
    ].filter(Boolean),
    { stdio: 'ignore' },
  );
  const portFile = path.join(profile, 'DevToolsActivePort');
  for (let i = 0; i < 100 && !existsSync(portFile); i++) await sleep(100);
  if (!existsSync(portFile)) die('Chrome did not start (no DevToolsActivePort)');
  const port = readFileSync(portFile, 'utf8').split('\n')[0];
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const page = targets.find((t) => t.type === 'page');
  return { chrome, profile, wsUrl: page.webSocketDebuggerUrl };
}

class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.listeners = [];
    ws.addEventListener('message', (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? reject(new Error(`${msg.error.message}`)) : resolve(msg.result);
      } else if (msg.method) {
        for (const l of this.listeners) l(msg);
      }
    });
  }
  static async connect(url) {
    const ws = new WebSocket(url);
    await new Promise((res, rej) => {
      ws.addEventListener('open', res, { once: true });
      ws.addEventListener('error', rej, { once: true });
    });
    return new CDP(ws);
  }
  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
  on(fn) {
    this.listeners.push(fn);
  }
}

// ---------- page helpers ----------

let cdp;
let consoleErrors = 0;

// Evaluates `body` with `doc`/`frame` bound to the form iframe (react-frame-component renders the form into a
// same-origin iframe, so top-level document.querySelector never sees the form's fields).
async function evaluate(body, arg) {
  const expression = `(async (arg) => {
    const iframe = document.querySelector('iframe[srcdoc]');
    const frame = iframe && iframe.contentWindow;
    const doc = iframe && iframe.contentDocument;
    const $ = (sel) => sel.startsWith('top:') ? document.querySelector(sel.slice(4)) : doc && doc.querySelector(sel);
    ${body}
  })(${JSON.stringify(arg ?? null)})`;
  const { result, exceptionDetails } = await cdp.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text);
  return result.value;
}

async function waitFor(sel, timeout = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await evaluate('return !!$(arg)', sel).catch(() => false)) return;
    await sleep(150);
  }
  throw new Error(`timed out waiting for ${sel}`);
}

async function waitForForm() {
  await waitFor('form.rjsf', 60000);
  await sleep(300);
}

// Top-level viewport coordinates of an element's center, adding the iframe's offset for in-frame selectors.
async function centerOf(sel) {
  await waitFor(sel);
  const pt = await evaluate(
    `const el = $(arg);
     el.scrollIntoView({ block: 'center', inline: 'center' });
     const r = el.getBoundingClientRect();
     let x = r.left + r.width / 2, y = r.top + r.height / 2;
     if (!arg.startsWith('top:')) {
       const fr = iframe.getBoundingClientRect();
       el.scrollIntoView({ block: 'center', inline: 'center' });
       const r2 = el.getBoundingClientRect();
       x = fr.left + r2.left + r2.width / 2; y = fr.top + r2.top + r2.height / 2;
       if (y < 0 || y > innerHeight) { window.scrollBy(0, y - innerHeight / 2); return null; }
     }
     return { x, y };`,
    sel,
  );
  return pt ?? centerOf(sel);
}

async function click(sel) {
  const { x, y } = await centerOf(sel);
  for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) {
    await cdp.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
  }
  await sleep(200);
}

const KEYS = {
  Tab: { key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 },
  Enter: { key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' },
  Escape: { key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 },
  Backspace: { key: 'Backspace', code: 'Backspace', windowsVirtualKeyCode: 8 },
  ArrowDown: { key: 'ArrowDown', code: 'ArrowDown', windowsVirtualKeyCode: 40 },
  ArrowUp: { key: 'ArrowUp', code: 'ArrowUp', windowsVirtualKeyCode: 38 },
  Space: { key: ' ', code: 'Space', windowsVirtualKeyCode: 32, text: ' ' },
};
async function press(name) {
  const k = KEYS[name];
  if (!k) throw new Error(`unknown key ${name}; known: ${Object.keys(KEYS).join(', ')}`);
  await cdp.send('Input.dispatchKeyEvent', { type: k.text ? 'keyDown' : 'rawKeyDown', ...k });
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', ...k });
  await sleep(150);
}

async function fill(sel, text) {
  await click(sel);
  // Select the existing value so the typed text replaces it, the way a user's select-all-then-type does
  await evaluate('const el = $(arg); el.focus(); if (el.select) el.select();', sel);
  if (text === '') await press('Backspace');
  else await cdp.send('Input.insertText', { text });
  await sleep(200);
}

async function navigate(url) {
  await cdp.send('Page.navigate', { url: 'about:blank' });
  await cdp.send('Page.navigate', { url });
  await waitForForm();
}

function readSetup(arg) {
  const raw = arg === '-' ? readFileSync(0, 'utf8') : arg.trim().startsWith('{') ? arg : readFileSync(arg, 'utf8');
  const setup = JSON.parse(raw);
  // The playground decodes the hash as UTF-8 base64 (src/utils/base64.ts); Buffer's base64 is the same encoding
  return `${BASE}/#${Buffer.from(JSON.stringify({ liveSettings: {}, ...setup }), 'utf8').toString('base64')}`;
}

async function screenshot(file, clip) {
  const params = { format: 'png', captureBeyondViewport: !!clip };
  if (clip) params.clip = { ...clip, scale: 1 };
  const { data } = await cdp.send('Page.captureScreenshot', params);
  mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  writeFileSync(file, Buffer.from(data, 'base64'));
  console.log(`[shot] ${path.resolve(file)}`);
}

async function runStep([name, a, b]) {
  switch (name) {
    case 'open':
      return navigate(`${BASE}/`);
    case 'load':
      return navigate(readSetup(a));
    case 'sample':
      await click(`top:[role=tab][title="${a}"]`);
      return waitForForm();
    case 'theme': {
      // The theme selector is itself an rjsf Form (core theme) rendered outside the iframe
      const ok = await evaluate(
        `const s = document.querySelector('#rjsf_themeSelector');
         if (!s) return false;
         const opt = [...s.options].find(o => o.textContent.trim() === arg || o.value === arg);
         if (!opt) return [...s.options].map(o => o.textContent.trim());
         s.value = opt.value; s.dispatchEvent(new Event('change', { bubbles: true })); return true;`,
        a,
      );
      if (ok !== true) throw new Error(`no theme "${a}"; options: ${JSON.stringify(ok)}`);
      await sleep(1500);
      return waitForForm();
    }
    case 'fill':
      return fill(a, b);
    case 'click':
      return click(a);
    case 'select': {
      const ok = await evaluate(
        `const el = $(arg[0]); if (!el) return false;
         const opt = [...el.options].find(o => o.value === arg[1] || o.textContent.trim() === arg[1]);
         if (!opt) return [...el.options].map(o => o.textContent.trim());
         el.value = opt.value; el.dispatchEvent(new Event('change', { bubbles: true })); return true;`,
        [a, b],
      );
      if (ok !== true)
        throw new Error(
          `select ${a}: ${ok === false ? 'not found' : `no option "${b}"; options: ${JSON.stringify(ok)}`}`,
        );
      return sleep(200);
    }
    case 'press':
      return press(a);
    case 'submit':
      return click('form.rjsf [type=submit]');
    case 'wait':
      return sleep(Number(a));
    case 'waitfor':
      return waitFor(a);
    case 'text':
      return console.log(await evaluate('const el = $(arg); return el ? el.textContent : "<no match>"', a));
    case 'html':
      return console.log(await evaluate('const el = $(arg); return el ? el.outerHTML : "<no match>"', a));
    case 'count':
      return console.log(
        await evaluate(
          'return arg.startsWith("top:") ? document.querySelectorAll(arg.slice(4)).length : doc.querySelectorAll(arg).length',
          a,
        ),
      );
    case 'errors':
      // Every theme's FieldErrorTemplate renders under the `${id}__error` id that @rjsf/utils' errorId() builds
      return console.log(
        JSON.stringify(
          await evaluate(
            `return Object.fromEntries([...doc.querySelectorAll('[id$="__error"]')]
               .map(e => [e.id.slice(0, -'__error'.length), e.textContent.trim()]).filter(([, t]) => t))`,
          ),
          null,
          2,
        ),
      );
    case 'formdata': {
      // The formData editor is a Monaco editor fed by the Form's onChange; its model holds the live JSON
      const text = await evaluate(
        `const ed = [...document.querySelectorAll('.MuiCard-root, .MuiPaper-root')].find(c => c.textContent.startsWith('formData'));
         const uri = ed && ed.querySelector('[data-uri]')?.getAttribute('data-uri');
         const models = window.monaco?.editor.getModels() ?? [];
         const m = models.find(m => m.uri.toString() === uri) ?? models[2];
         return m ? m.getValue() : null;`,
      );
      if (text === null) throw new Error('formData editor not loaded (Monaco loads from cdn.jsdelivr.net)');
      return console.log(text);
    }
    case 'eval': {
      const v = await evaluate(a.includes('return') ? a : `return (${a})`);
      return console.log(typeof v === 'string' ? v : JSON.stringify(v, null, 2));
    }
    case 'shot':
      return screenshot(a);
    case 'shotform': {
      // The form's iframe is a fixed 1000px tall and scrolls internally, so it's stretched to the form's height for
      // the capture and put back afterwards
      const box = await evaluate(
        `frame.scrollTo(0, 0);
         const form = doc.querySelector('form.rjsf');
         iframe.dataset.driverHeight = iframe.style.height;
         iframe.style.height = Math.max(form.getBoundingClientRect().bottom + 16, 100) + 'px';
         await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
         const fr = iframe.getBoundingClientRect();
         return { x: fr.left + scrollX, y: fr.top + scrollY, width: fr.width, height: fr.height };`,
      );
      await screenshot(a, box);
      return evaluate('iframe.style.height = iframe.dataset.driverHeight;');
    }
    case 'stop-server':
      return;
  }
}

// ---------- main ----------

if (plan.length === 1 && plan[0][0] === 'stop-server') {
  if (!existsSync(PIDFILE)) die(`no server pidfile at ${PIDFILE}`);
  stopServerGroup(Number(readFileSync(PIDFILE, 'utf8')));
  console.error(`[server] stopped`);
  process.exit(0);
}

const server = await ensureServer();
const { chrome, profile, wsUrl } = await launchChrome();
let failed = false;
try {
  cdp = await CDP.connect(wsUrl);
  cdp.on((msg) => {
    if (msg.method === 'Runtime.consoleAPICalled') {
      const { type, args: cargs } = msg.params;
      const text = cargs.map((x) => x.value ?? x.description ?? x.type).join(' ');
      if (type === 'error' || type === 'warning') consoleErrors++;
      if (!opts.quiet || type === 'error' || type === 'warning') console.log(`[console.${type}] ${text}`);
    } else if (msg.method === 'Runtime.exceptionThrown') {
      consoleErrors++;
      console.log(
        `[pageerror] ${msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text}`,
      );
    } else if (msg.method === 'Page.javascriptDialogOpening') {
      // The playground's onSubmit calls window.alert('Form submitted'), which would block every later step
      console.log(`[dialog.${msg.params.type}] ${msg.params.message}`);
      cdp.send('Page.handleJavaScriptDialog', { accept: true });
    }
  });
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: opts.width,
    height: opts.height,
    deviceScaleFactor: 1,
    mobile: false,
  });
  for (const step of plan) {
    console.error(`> ${step.map((s) => (s.length > 60 ? `${s.slice(0, 57)}...` : s)).join(' ')}`);
    await runStep(step);
  }
} catch (err) {
  failed = true;
  console.error(`driver: ${err.message}`);
} finally {
  const exited = new Promise((r) => chrome.once('exit', r));
  chrome.kill();
  await Promise.race([exited, sleep(3000)]);
  // Chrome may still be flushing its profile for a moment after exit
  for (let i = 0; i < 5; i++) {
    try {
      rmSync(profile, { recursive: true, force: true });
      break;
    } catch {
      await sleep(300);
    }
  }
  if (server && !opts.keepServer) stopServerGroup(server.pid);
}
console.error(`[done] ${failed ? 'FAILED' : 'ok'}; ${consoleErrors} console error/warning(s)`);
process.exit(failed ? 1 : 0);
