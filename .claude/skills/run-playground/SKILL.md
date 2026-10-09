---
name: run-playground
description: Run, start, drive or screenshot the rjsf playground (packages/playground) to see a change to @rjsf/core, @rjsf/utils, a theme or a validator working in a real browser, or run a TS/TSX probe against the @rjsf/* sources without a build. Use when asked to run the app, launch the playground, reproduce a form bug in the browser, take a screenshot of a form/theme, or confirm a fix works outside the test suite.
---

# Run the rjsf playground

The only launchable app in this monorepo is the playground: a Vite app whose `vite.config.ts` aliases every `@rjsf/*`
package to its `src`, so **no build is needed** — an edit to `packages/core/src` or a theme shows up on the next page load.
Two harnesses live next to this file (paths below are relative to the repo root):

- `driver.mjs` — drives the playground in headless Chrome over the DevTools protocol. Zero dependencies (Node's global
  `WebSocket`), starts its own dev server, auto-accepts the playground's submit `alert`, echoes console errors.
- `run-ts.mjs` — runs a `.ts`/`.tsx` script against the `@rjsf/*` sources through Vite's SSR module runner. Use it when a
  change is in `@rjsf/utils`/a validator (most PRs) and a browser adds nothing.

## Prerequisites

`pnpm install` at the root, Node 22.18+/24.11+, and Chrome or Chromium. The driver looks for
`/Applications/Google Chrome.app`, `google-chrome`/`chromium` on `PATH`, then Playwright's browser cache; set `CHROME_PATH`
to override. Verified on macOS (arm64) with Node 24.21 and Chrome.

## Run (agent path): drive the playground

One invocation = start server if needed → launch Chrome → run the steps in order → exit (non-zero if a step failed).

```bash
OUT=$(mktemp -d)   # screenshots/setup files; any path works
# Default page (Simple sample): edit a field, read the playground's formData, submit, screenshot the form
node .claude/skills/run-playground/driver.mjs --quiet open \
  fill '#root_firstName' 'Ada' fill '#root_age' '' formdata submit errors shotform $OUT/form.png
```

Load your own schema (the shared-link setup: `schema`, `uiSchema`, `formData`, `theme`, `validator`, `liveSettings`, all
optional) — this is the way to reproduce an issue:

```bash
cat > $OUT/setup.json <<'EOF'
{
  "schema": { "type": "object", "required": ["name"],
    "properties": { "name": { "type": "string", "title": "Name", "minLength": 3 },
                    "tags": { "type": "array", "title": "Tags", "items": { "type": "string" } } } },
  "formData": { "name": "x" },
  "theme": "mui"
}
EOF
node .claude/skills/run-playground/driver.mjs --quiet load $OUT/setup.json \
  click '.rjsf .MuiIconButton-root' fill '#root_tags_0' alpha submit errors formdata shotform $OUT/mui.png
# errors → { "root_name": "must NOT have fewer than 3 characters" }
```

Built-in samples and theme switching:

```bash
node .claude/skills/run-playground/driver.mjs --keep-server --quiet open sample Arrays theme antd \
  count '.rjsf .ant-input' shotform $OUT/antd-arrays.png
node .claude/skills/run-playground/driver.mjs stop-server   # stops a server left by --keep-server
```

Steps (full list in the header of `driver.mjs`): `open`, `load <file|json|->`, `sample <tab title>`, `theme <name>`,
`fill <sel> <text>`, `click <sel>`, `select <sel> <value>`, `press <Tab|Enter|...>`, `submit`, `wait <ms>`,
`waitfor <sel>`, `text|html|count <sel>`, `errors`, `formdata`, `eval <js>`, `shot <png>`, `shotform <png>`.

- Selectors run **inside the form's iframe**; prefix `top:` for the playground chrome (`top:[role=tab][title="Arrays"]`).
- `eval` gets `doc`/`frame` (the iframe's document/window) and `$` (iframe querySelector, `top:` aware).
- `errors` prints `{ fieldId: text }` from every theme's `${id}__error` element; `formdata` prints the formData editor
  (the Form's `onChange` value).
- Theme names: `default`, `antd`, `chakra-ui`, `daisy-ui`, `fluentui-rc`, `mantine`, `mui`, `react-bootstrap`, `shadcn`.
  Validators (setup `validator`): `AJV8`, `AJV8 (2019-09)`, `AJV8 (2020-12)`, `ATA`, `CFWorker (2020-12)`, … (see
  `packages/playground/src/app.tsx`).
- Options: `--port <n>` (default 5199), `--keep-server` (reuse across invocations, ~5s saved), `--headed`, `--quiet`
  (hide `console.log`; errors/warnings always print), `--width/--height`.
- Always open the PNG and look at it.

## Direct invocation: probe the sources without a browser

```bash
node .claude/skills/run-playground/run-ts.mjs .claude/skills/run-playground/probe.example.tsx
```

`probe.example.tsx` computes defaults with `createSchemaUtils`, validates with `@rjsf/validator-ajv8`, and SSR-renders a
core `Form` with `react-dom/server` — copy it anywhere (a scratch dir is fine) and edit. ~1s per run. The script may import
only packages (`@rjsf/*` → `src`; anything else from `packages/playground`'s dependencies); relative imports resolve from
`packages/playground/src`.

## Run (human path)

`cd packages/playground && pnpm start` → Vite on :8080 with `--force` and opens your browser. Ctrl-C to stop. The root
`pnpm start` only prints "build first" — ignore it, the aliases make a build unnecessary.

## Test

`cd packages/<pkg> && pnpm test` (Vitest, resolves to source). Load the `rjsf-testing` skill before writing tests.

## Gotchas

- **Ports are shared between checkouts.** `pnpm start` silently moves to 8081, 8082… if another checkout's playground
  holds 8080 — and `curl localhost:8080` then happily answers from the _other_ checkout. The driver uses
  `--strictPort` on 5199 and only reuses a server whose `/@fs/<this checkout>/…` route answers (Vite 403s outside its
  own root); otherwise it tells you to pass `--port`.
- **Don't `pkill -f <checkout path>` a Vite server.** Its command line runs through the pnpm store
  (`~/Library/pnpm/store/…/vite.js`), so the pattern misses it and can hit another checkout's server instead. Stop by PID;
  the driver kills only the process group it spawned.
- **The form lives in a same-origin iframe** (react-frame-component, `iframe[srcdoc]`); a second iframe
  (`antd-styles-iframe`) also exists. Top-level `document.querySelector('#root_name')` finds nothing.
- **The iframe is a fixed 1000px tall and scrolls internally**: `shot` cuts the form off; `shotform` stretches the
  iframe to the form's height for the capture.
- **Submit opens `window.alert('Form submitted')`**, which blocks every later CDP command unless handled; the driver
  accepts it and prints `[dialog.alert] Form submitted` — that line is your "submit passed validation" signal.
- **The shared-link hash is read once at module load** (`readSharedSetup` in `Playground.tsx`): changing only the
  hash doesn't reload the setup. `load` goes through `about:blank` to force a fresh load.
- **A `--keep-server` Vite must not log to a pipe** — once the driver exits, its next HMR log line kills it with EPIPE.
  The driver logs to `$TMPDIR/rjsf-playground-<port>.log`.
- **Monaco (the three editors) and the `default`/`daisy-ui` stylesheets come from CDNs.** Offline, `formdata` fails and
  forms render unstyled; the form itself still works.
- **Node can't load `@rjsf/utils` source directly** (`ERR_UNKNOWN_FILE_EXTENSION ".tsx"` even with
  `--experimental-transform-types`), hence `run-ts.mjs`.
- Expected console noise on every load, not caused by your change: `The schema default value "populate" is not one of
the values in the enum options for "rjsf_options_defaultFormStateBehavior_arrayMinItems_populate"` (the options drawer),
  `An empty string ("") was passed to the href attribute` (themes with no stylesheet), and daisy-ui's Tailwind browser
  build warning.
- v7 API: `createSchemaUtils({ validator }, schema)` — passing the validator directly logs
  `createSchemaUtils() takes a SchemaContext rather than a validator`.

## Troubleshooting

- `port 5199 is held by another server` → another checkout's driver server; `--port 5299` or `stop-server` there.
- `Cannot find module 'react-dom/server' imported from <scratch>/probe.tsx` → the probe was loaded from its own path
  (bare imports resolve from the script's dir); `run-ts.mjs` serves it as a file inside `packages/playground/src`.
