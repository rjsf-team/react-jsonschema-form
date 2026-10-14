// Imported by path rather than as `@rjsf/utils`, which isn't resolvable from here
import type { RJSFSchema } from '../../packages/utils/src/index.ts';

export type ParityFamily = 'recursion' | 'termination' | 'captured';

export interface ParityShape {
  /** Names the shape; its slug names the baseline file, so renaming a shape moves its baseline */
  readonly name: string;
  /** The test or RFC section the shape comes from */
  readonly source?: string;
  readonly schema: RJSFSchema;
  readonly formData?: unknown;
  /** Render with `allOf: 'populateDefaults'`; the utils suite records every preset regardless */
  readonly populate?: boolean;
  /** Expand buttons to click in order, instead of the first one rendered */
  readonly expand?: readonly string[];
  /** Index of the `anyOf`/`oneOf` option to select after rendering, instead of clicking an Expand button */
  readonly selectOption?: number;
}

/** A surface of one shape that v7 cannot produce: it throws a stack overflow, runs out of memory, or blows the time
 * budget. Running it would fail or kill the worker, so the suites list it as a todo until a later stage makes it run.
 */
export interface PendingSurface {
  readonly family: ParityFamily;
  readonly name: string;
  readonly surface: 'retrieveSchema' | 'getDefaultFormState' | 'ajv8Defaults' | 'render' | 'interaction';
  readonly v7: string;
}
