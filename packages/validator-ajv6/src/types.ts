export interface CustomValidatorOptionsType {
  additionalMetaSchemas?: ReadonlyArray<object>;
  customFormats?: { [k: string]: string | RegExp | ((data: string) => boolean) };
}


