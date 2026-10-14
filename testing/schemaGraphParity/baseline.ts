import { pendingSurfaces } from './pending.ts';
import type { ParityFamily, ParityShape, PendingSurface } from './types.ts';

export function slug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function shapeTitle({ name, source }: ParityShape) {
  return source ? `${name} (${source})` : name;
}

/** A title for each pending surface of `shapes`, among `surfaces` */
export function pendingTitles(
  family: ParityFamily,
  shapes: readonly ParityShape[],
  surfaces: readonly PendingSurface['surface'][],
) {
  return shapes.flatMap((shape) =>
    surfaces.flatMap((surface) => {
      const pending = pendingFor(family, shape, surface);
      return pending ? [`${shapeTitle(shape)}: ${surface}, ${pending.v7} on v7`] : [];
    }),
  );
}

export function pendingFor(family: ParityFamily, { name }: ParityShape, surface: PendingSurface['surface']) {
  return pendingSurfaces.find((p) => p.family === family && p.name === name && p.surface === surface);
}

/** JSON for a baseline file. Object keys are sorted, so a change in key order alone is not a difference; `undefined`
 * is spelled out, since `[undefined]` and `[]` are different defaults; a symbol key is printed under the name
 * `symbolNames` gives it and dropped when it has none, which keeps private bookkeeping out of the baseline.
 */
export function toBaselineText(value: unknown, symbolNames: ReadonlyMap<symbol, string> = new Map()) {
  const ancestors = new Set<object>();
  const normalize = (node: unknown): unknown => {
    if (node === undefined) {
      return '@@undefined';
    }
    if (typeof node !== 'object' || node === null) {
      return node;
    }
    if (ancestors.has(node)) {
      return '@@circular';
    }
    ancestors.add(node);
    let result: unknown;
    if (Array.isArray(node)) {
      result = node.map(normalize);
    } else {
      const entries: [string, unknown][] = Object.keys(node)
        .sort()
        .map((key) => [key, normalize(Reflect.get(node, key))]);
      for (const symbol of Object.getOwnPropertySymbols(node)) {
        const symbolName = symbolNames.get(symbol);
        if (symbolName !== undefined) {
          entries.push([`@@${symbolName}`, normalize(Reflect.get(node, symbol))]);
        }
      }
      result = Object.fromEntries(entries);
    }
    ancestors.delete(node);
    return result;
  };
  return `${JSON.stringify(normalize(value), null, 2)}\n`;
}

/** Runs `pass` six times, each on the previous result, and reports the first result with the serialized length of
 * every pass, so a value that keeps growing shows in the baseline
 */
export function repeatedPasses(pass: (formData: unknown) => unknown, formData: unknown) {
  const values: unknown[] = [];
  let current = formData;
  for (let i = 0; i < 6; i++) {
    current = pass(current);
    values.push(current);
  }
  const passLengths = values.map((value) => toBaselineText(value).length);
  const stable = values.every((value) => toBaselineText(value) === toBaselineText(values[0]));
  return { first: values[0], passLengths, stable, ...(stable ? {} : { last: values[values.length - 1] }) };
}

/** The value `run` returns, or the error it throws. A stack overflow is rethrown: v7 failing that way is a pending
 * surface, never a baseline.
 */
export function outcome(run: () => unknown) {
  try {
    return run();
  } catch (error) {
    return thrown(error);
  }
}

/** `outcome()` for an asynchronous `run` */
export async function asyncOutcome(run: () => Promise<unknown>) {
  try {
    return await run();
  } catch (error) {
    return thrown(error);
  }
}

function thrown(error: unknown) {
  if (!(error instanceof Error) || error instanceof RangeError) {
    throw error;
  }
  return { throws: `${error.name}: ${error.message}` };
}
