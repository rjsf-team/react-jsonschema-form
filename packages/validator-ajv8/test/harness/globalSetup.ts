import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/** Vitest globalSetup: regenerates the gitignored superSchema*.cjs harness files
 * before this package's tests run, no matter how vitest was invoked (package
 * run, watch mode, IDE runner), instead of only via the blessed test script.
 * Runs the script through pnpm so it executes under tsx exactly as the
 * compileSchemas script defines it.
 */
export default function setup() {
  execFileSync('pnpm', ['run', 'compileSchemas'], {
    cwd: fileURLToPath(new URL('../..', import.meta.url)),
    stdio: 'inherit',
  });
}
