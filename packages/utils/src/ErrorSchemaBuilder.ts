import { ERRORS_KEY } from './constants.ts';
import { getByPath, setByPath, toPath } from './pathUtils.ts';
import type { ErrorSchema, FieldPathList } from './types.ts';

/** Represents the type of the path which can be a string of dotted path values or a list of string or numbers where
 * numbers represent array indexes/
 */
export type PathType = string | FieldPathList;

/** The `ErrorSchemaBuilder<T>` is used to build an `ErrorSchema<T>` since the definition of the `ErrorSchema` type is
 * designed for reading information rather than writing it. Use this class to add, replace or clear errors in an error
 * schema by using either dotted path or an array of path names. Once you are done building the `ErrorSchema`, you can
 * get the result and/or reset all the errors back to an initial set and start again.
 */
export default class ErrorSchemaBuilder<T = any> {
  /** The error schema being built
   *
   * @private
   */
  private errorSchema: ErrorSchema<T> = {};

  /** Construct an `ErrorSchemaBuilder` with an optional initial set of errors in an `ErrorSchema`.
   *
   * @param [initialSchema] - The optional set of initial errors, that will be cloned into the class
   */
  constructor(initialSchema?: ErrorSchema<T>) {
    this.resetAllErrors(initialSchema);
  }

  /** Returns the `ErrorSchema` that has been updated by the methods of the `ErrorSchemaBuilder`
   */
  get ErrorSchema() {
    return this.errorSchema;
  }

  /** Will get an existing `ErrorSchema` at the specified `pathOfError` or create and return one.
   *
   * @param [pathOfError] - The optional path into the `ErrorSchema` at which to add the error(s)
   * @returns - The error block for the given `pathOfError` or the root if not provided
   * @private
   */
  private getOrCreateErrorBlock(pathOfError?: PathType) {
    // A string path is dotted-path notation, so parse it into its segments
    const path = typeof pathOfError === 'string' ? toPath(pathOfError) : (pathOfError ?? []);
    if (path.length === 0) {
      return this.errorSchema;
    }
    // An `ErrorSchema` only ever nests `ErrorSchema` blocks, so create any missing block along the path,
    // always as a plain object since an `ErrorSchema` is never an array
    let errorBlock = getByPath<ErrorSchema | undefined>(this.errorSchema, path);
    if (!errorBlock) {
      errorBlock = {};
      setByPath(this.errorSchema, path, errorBlock, true);
    }
    return errorBlock;
  }

  /** Resets all errors in the `ErrorSchemaBuilder` back to the `initialSchema` if provided, otherwise an empty set.
   *
   * @param [initialSchema] - The optional set of initial errors, that will be cloned into the class
   * @returns - The `ErrorSchemaBuilder` object for chaining purposes
   */
  resetAllErrors(initialSchema?: ErrorSchema<T>) {
    this.errorSchema = initialSchema ? structuredClone(initialSchema) : {};
    return this;
  }

  /** Adds the `errorOrList` to the list of errors in the `ErrorSchema` at either the root level or the location within
   * the schema described by the `pathOfError`. The path is either a dotted string (with optional bracketed array
   * indexes, e.g. `'a.b[0]'`) or a list of path segments; keys containing dots require the list form.
   *
   * @param errorOrList - The error or list of errors to add into the `ErrorSchema`
   * @param [pathOfError] - The optional path into the `ErrorSchema` at which to add the error(s)
   * @returns - The `ErrorSchemaBuilder` object for chaining purposes
   */
  addErrors(errorOrList: string | string[], pathOfError?: PathType) {
    const errorBlock: ErrorSchema = this.getOrCreateErrorBlock(pathOfError);
    let errorsList = errorBlock[ERRORS_KEY];
    if (!Array.isArray(errorsList)) {
      errorsList = [];
      errorBlock[ERRORS_KEY] = errorsList;
    }

    if (Array.isArray(errorOrList)) {
      errorBlock[ERRORS_KEY] = [...new Set([...errorsList, ...errorOrList])];
    } else {
      errorBlock[ERRORS_KEY] = [...new Set([...errorsList, errorOrList])];
    }
    return this;
  }

  /** Sets/replaces the `errorOrList` as the error(s) in the `ErrorSchema` at either the root level or the location
   * within the schema described by the `pathOfError`. The path is either a dotted string (with optional bracketed array
   * indexes, e.g. `'a.b[0]'`) or a list of path segments; keys containing dots require the list form.
   *
   * @param errorOrList - The error or list of errors to set into the `ErrorSchema`
   * @param [pathOfError] - The optional path into the `ErrorSchema` at which to set the error(s)
   * @returns - The `ErrorSchemaBuilder` object for chaining purposes
   */
  setErrors(errorOrList: string | string[], pathOfError?: PathType) {
    const errorBlock: ErrorSchema = this.getOrCreateErrorBlock(pathOfError);
    // Effectively clone the array being given to prevent accidental outside manipulation of the given list
    const listToAdd = Array.isArray(errorOrList) ? [...new Set([...errorOrList])] : [errorOrList];
    errorBlock[ERRORS_KEY] = listToAdd;
    return this;
  }

  /** Clears the error(s) in the `ErrorSchema` at either the root level or the location within the schema described by
   * the `pathOfError`. The path is either a dotted string (with optional bracketed array
   * indexes, e.g. `'a.b[0]'`) or a list of path segments; keys containing dots require the list form.
   *
   * @param [pathOfError] - The optional path into the `ErrorSchema` at which to clear the error(s)
   * @returns - The `ErrorSchemaBuilder` object for chaining purposes
   */
  clearErrors(pathOfError?: PathType) {
    const errorBlock: ErrorSchema = this.getOrCreateErrorBlock(pathOfError);
    errorBlock[ERRORS_KEY] = [];
    return this;
  }
}
