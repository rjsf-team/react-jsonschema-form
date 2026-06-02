import type { BoxProps, FormHelperTextProps, GridProps, PaperProps, SxProps, TypographyProps } from '@mui/material';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, UIOptionsType, GenericObjectType } from '@rjsf/utils';

/**
 * Extract props meant for MUI components from the `options` field of the `uiSchema`.
 * @param {UIOptionsType} options - The options from the uiSchema
 * @param {string[]} [propsToFilter] - An optional allowlist of props to return (used by button/icon components)
 * @param {boolean} [rjsfSlotPropsOnly] - If true, returns only `rjsfSlotProps`, preventing root-level prop bleeding
 * @returns {P}
 */
export function getMuiProps<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
  P extends GenericObjectType = GenericObjectType,
>(options: UIOptionsType<T, S, F>, propsToFilter?: string[], rjsfSlotPropsOnly?: boolean): P {
  const muiProps = (options?.mui as P) || ({} as P);
  if (rjsfSlotPropsOnly) {
    const { rjsfSlotProps } = muiProps as any;
    return { rjsfSlotProps } as unknown as P;
  }
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

/**
 * Merges default `sx` props with any `sx` provided on a MUI component's props, returning a value
 * suitable for passing directly to the MUI `sx` prop.
 *
 * When `muiProps.sx` is an array (only valid for `GridProps`), the default sx object is prepended
 * to produce an `sx` array, preserving MUI's array-merge semantics. Otherwise the two objects are
 * shallow-merged, with `muiProps.sx` taking precedence over the `sxProps`.
 *
 * If `muiProps` is omitted the `sxProps`` are returned as-is.
 *
 * @param sxProps - The default sx styles to apply
 * @param [muiProps] - The MUI component props that may contain a user-supplied `sx`
 * @returns - The merged sx value
 */
export function computeSxProps<MuiProps extends GridProps>(
  sxProps: SxProps,
  muiProps: MuiProps & { sx: any[] },
): MuiProps['sx'] | MuiProps['sx'][];
export function computeSxProps<MuiProps extends BoxProps | FormHelperTextProps | PaperProps | TypographyProps>(
  sxProps: SxProps,
  muiProps?: MuiProps,
): MuiProps['sx'];
export function computeSxProps<
  MuiProps extends BoxProps | FormHelperTextProps | GridProps | PaperProps | TypographyProps,
>(sxProps: SxProps, muiProps?: MuiProps): MuiProps['sx'] | MuiProps['sx'][] {
  if (!muiProps) {
    return sxProps;
  }
  if (Array.isArray(muiProps?.sx)) {
    return [sxProps, ...muiProps.sx];
  }
  return { ...sxProps, ...muiProps?.sx } as MuiProps['sx'];
}
