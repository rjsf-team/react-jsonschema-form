import { FormContextType, RJSFSchema, StrictRJSFSchema, UIOptionsType, GenericObjectType } from '@rjsf/utils';

/**
 * Extract props meant for MUI components from the `options` field of the `uiSchema`.
 * @param {UIOptionsType} options - The options from the uiSchema
 * @param {string[]} [propsToFilter] - An optional list of props to filter out
 * @returns {any}
 */
export function getMuiProps<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
  P extends GenericObjectType = GenericObjectType,
>(options: UIOptionsType<T, S, F>, propsToFilter?: string[]): P {
  const muiProps = (options?.mui as P) || ({} as P);
  if (propsToFilter) {
    return Object.keys(muiProps)
      .filter((key) => propsToFilter.includes(key))
      .reduce((obj, key) => {
        obj[key as keyof P] = muiProps[key as keyof P];
        return obj;
      }, {} as P);
  }
  return muiProps;
}
