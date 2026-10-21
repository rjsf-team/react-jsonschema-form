declare const process: { env: Record<string, string | undefined> };
/** Whether the development diagnostics run. Vite and esbuild replace `process.env.NODE_ENV` but not `typeof process`,
 * and a browser has no `process`, so only the replaced expression is read; the `catch` covers an environment that
 * neither replaces nor defines it. Because the check is hoisted into a `const`, a minifier cannot fold it, so the
 * diagnostics ship in production bundles too and only skip at run time. A module of its own that imports nothing, so a
 * module that reads it as it loads, inside an import cycle, finds it set: a field's hook loads while `formState.ts`
 * builds the registry.
 */
const isDevelopment = (() => {
  try {
    return process.env.NODE_ENV !== 'production';
  } catch {
    return false;
  }
})();

export default isDevelopment;
