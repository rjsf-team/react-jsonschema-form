import type {
  BoxProps,
  FormHelperTextProps,
  GridProps,
  PaperProps,
  SxProps,
  Theme,
  TypographyProps,
} from '@mui/material';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, UIOptionsType, GenericObjectType } from '@rjsf/utils';

type SystemStyleObject = Exclude<SxProps<Theme>, readonly unknown[] | ((...args: never[]) => unknown)>;

function isSxArray(sx: SxProps<Theme>): sx is Extract<SxProps<Theme>, readonly unknown[]> {
  return Array.isArray(sx);
}

/**
 * Extract props meant for MUI components from the `options` field of the `uiSchema`.
 * @param {UIOptionsType} options - The options from the uiSchema
 * @param {string[]} [propsToFilter] - An optional allowlist of props to return (used by button/icon components)
 * @param {boolean} [rjsfSlotPropsOnly] - If true, returns only `rjsfSlotProps`, preventing root-level prop bleeding
 * @returns {P}
 */
export function getMuiProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
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
      .reduce((acc, key) => {
        acc[key as keyof P] = muiProps[key as keyof P];
        return acc;
      }, {} as P);
  }
  return muiProps;
}

/**
 * Merges default `sx` props with any `sx` provided on a MUI component's props, returning a value
 * suitable for passing directly to the MUI `sx` prop.
 *
 * When `muiProps.sx` is an array or a theme callback, the default sx object is prepended to produce
 * an `sx` array, preserving MUI's array-merge semantics. Otherwise the two objects are
 * shallow-merged, with `muiProps.sx` taking precedence over the `sxProps`.
 *
 * If `muiProps` or its `sx` is omitted the `sxProps` are returned as-is.
 *
 * @param sxProps - The default sx styles to apply
 * @param [muiProps] - The MUI component props that may contain a user-supplied `sx`
 * @returns - The merged sx value
 */
export function computeSxProps<MuiProps extends GridProps>(
  sxProps: SystemStyleObject,
  muiProps: MuiProps & { sx: any[] },
): MuiProps['sx'] | MuiProps['sx'][];
export function computeSxProps<MuiProps extends BoxProps | FormHelperTextProps | PaperProps | TypographyProps>(
  sxProps: SystemStyleObject,
  muiProps?: MuiProps,
): MuiProps['sx'];
export function computeSxProps<
  MuiProps extends BoxProps | FormHelperTextProps | GridProps | PaperProps | TypographyProps,
>(sxProps: SystemStyleObject, muiProps?: MuiProps): MuiProps['sx'] | MuiProps['sx'][] {
  const sx: SxProps<Theme> | undefined = muiProps?.sx;
  if (sx === undefined) {
    return sxProps;
  }
  if (isSxArray(sx)) {
    return [sxProps, ...sx];
  }
  if (typeof sx === 'function') {
    return [sxProps, sx];
  }
  return { ...sxProps, ...sx };
}
