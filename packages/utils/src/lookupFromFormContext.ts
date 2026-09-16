import { FORM_CONTEXT_NAME, LOOKUP_MAP_NAME } from './constants.ts';
import { getByPath, hasByPath } from './pathUtils.ts';
import type { FormContextType, RJSFSchema, Registry, StrictRJSFSchema } from './types.ts';

/** Given a React JSON Schema Form registry or formContext object, return the value associated with `toLookup`. This
 * might be contained within the lookup map in the formContext. If no such value exists, return the `fallback`
 * value.
 *
 * @param regOrFc - The @rjsf registry or form context in which the lookup will occur
 * @param toLookup - The name of the field in the lookup map in the form context to get the value for
 * @param [fallback] - The fallback value to use if the form context does not contain a value for `toLookup`
 * @returns - The value associated with `toLookup` in the form context or `fallback`
 */
export default function lookupFromFormContext<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
  R = unknown,
>(regOrFc: Registry<T, S, F> | Registry<T, S, F>['formContext'], toLookup: string, fallback?: R): R {
  const lookupPath = [LOOKUP_MAP_NAME];
  if (hasByPath(regOrFc, FORM_CONTEXT_NAME)) {
    lookupPath.unshift(FORM_CONTEXT_NAME);
  }
  return getByPath<R>(regOrFc, [...lookupPath, toLookup], fallback);
}
