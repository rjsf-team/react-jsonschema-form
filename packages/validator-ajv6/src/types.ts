/** The type describing how to customize the AJV6 validator
 */
export interface CustomValidatorOptionsType {
  /** The list of additional meta schemas that the validator can access */
  additionalMetaSchemas?: ReadonlyArray<object>;
  /** The set of additional custom formats that the validator will support */
  customFormats?: { [k: string]: string | RegExp | ((data: string) => boolean) };
}
