import { execFile } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);
const srcDir = './src/css';
const distDir = './dist/';
const contentGlobs = './src/**/*.{js,jsx,ts,tsx},../playground/src/**/*.{js,jsx,ts,tsx}';

fs.mkdirSync(distDir, { recursive: true });

const themes = fs.readdirSync(srcDir).filter((file) => path.extname(file) === '.css');

// `pnpm run` puts node_modules/.bin on PATH, so call the tailwind binary directly; going through `npx` cost
// about two seconds of package resolution per theme. The themes are independent, so compile them in parallel.
try {
  await Promise.all(
    themes.map((file) =>
      run(
        'tailwindcss',
        ['-i', path.join(srcDir, file), '-o', path.join(distDir, file), '--minify', '--content', contentGlobs],
        {
          shell: process.platform === 'win32',
        },
      ),
    ),
  );
} catch (error) {
  // oxlint-disable-next-line no-console
  console.error('Error building theme CSS:', error);
  process.exit(1);
}
