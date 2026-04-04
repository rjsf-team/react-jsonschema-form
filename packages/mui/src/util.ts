import {
  FormContextType,
  getUiOptions,
  RJSFSchema,
  StrictRJSFSchema,
  UiSchema,
  UIOptionsType,
  GenericObjectType,
} from '@rjsf/utils';

export type MuiPropsType<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any> = {
  formContext?: F;
  uiSchema?: UiSchema<T, S, F>;
  options?: UIOptionsType<T, S, F>;
  defaultSchemaProps?: GenericObjectType;
  defaultContextProps?: GenericObjectType;
};

/**
 * Extract props meant for MUI components from props that are
 * passed to Widgets, Templates and Fields.
 * @param {Object} params
 * @param {Object?} params.formContext
 * @param {Object?} params.uiSchema
 * @param {Object?} params.options
 * @param {Object?} params.defaultSchemaProps
 * @param {Object?} params.defaultContextProps
 * @returns {any}
 */
export function getMuiProps<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  formContext = {} as F,
  uiSchema = {},
  options = {},
  defaultSchemaProps = {},
  defaultContextProps = {},
}: MuiPropsType<T, S, F>) {
  const FormContextProps = formContext.mui;
  const SchemaProps = getUiOptions<T, S, F>(uiSchema).mui;
  const OptionProps = options.mui;

  return Object.assign({}, defaultSchemaProps, defaultContextProps, FormContextProps, SchemaProps, OptionProps);
}
