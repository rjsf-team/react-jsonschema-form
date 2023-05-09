import Ajv, { Options, ErrorObject, ValidateFunction } from 'ajv';
import { FormatsPluginOptions } from 'ajv-formats';
import { DataValidationCxt } from 'ajv/lib/types';

/** The type describing how to customize the AJV6 validator
 */
export interface CustomValidatorOptionsType {
  /** The list of additional meta schemas that the validator can access */
  additionalMetaSchemas?: ReadonlyArray<object>;
  /** The set of additional custom formats that the validator will support */
  customFormats?: {
    [k: string]: string | RegExp | ((data: string) => boolean);
  };
  /** The set of config overrides that will be passed to the AJV validator constructor on top of the defaults */
  ajvOptionsOverrides?: Options;
  /** The `ajv-format` options to use when adding formats to `ajv`; pass `false` to disable it */
  ajvFormatOptions?: FormatsPluginOptions | false;
  /** The AJV class to construct */
  AjvClass?: typeof Ajv;
}

/** The type describing a function that takes a list of Ajv `ErrorObject`s and localizes them
 */
export type Localizer = (errors?: null | ErrorObject[]) => void;

/** Extend ValidateFunction to Omit its two required properties, `schema` and `schemaEnv` that are not produced by the
 * AJV schema standalone compilation code
 */
export interface CompiledValidateFunction<T = any> extends Omit<ValidateFunction<T>, 'schema' | 'schemaEnv'> {
  /** This is literally copied from the `ValidateFunction` type definition from which it extends because it seems to get
   * lost as part of the Omit<>.
   */
  (this: Ajv | any, data: any, dataCxt?: DataValidationCxt): boolean;
}

/** The definition of precompiled validator functions
 */
export type ValidatorFunctions<T = any> = { [key: string]: CompiledValidateFunction<T> };
