import { Options } from "ajv";
import { FormatsPluginOptions } from "ajv-formats";

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
}
