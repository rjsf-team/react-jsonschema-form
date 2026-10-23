import type { ReactNode } from 'react';
import type {
  BoxProps,
  FormHelperTextProps,
  GridProps,
  PaperProps,
  SxProps,
  Theme,
  TypographyProps,
} from '@mui/material';
import type {
  FormContextType,
  GlobalUISchemaOptionsExtensions,
  ReservedUiOptionName,
  RJSFSchema,
  StrictRJSFSchema,
  ThemeGlobalUISchemaOptions,
  UIOptionsType,
  UiSchema,
  GenericObjectType,
} from '@rjsf/utils';

type SxArray = Extract<SxProps<Theme>, readonly unknown[]>;

/** The options this theme reads from `ui:globalOptions`, beyond the ones RJSF reads */
export interface MuiGlobalUiOptionsKeys {
  /** The props for the MUI components every field renders, as in a field's `ui:options` */
  mui?: GenericObjectType;
}

/** The `ui:globalOptions` this theme reads, plus a user's own `UserExtensions` */
export type MuiGlobalUISchemaOptions<
  UserExtensions extends GlobalUISchemaOptionsExtensions<
    UserExtensions,
    ReservedUiOptionName | keyof MuiGlobalUiOptionsKeys
  > = Record<never, never>,
> = ThemeGlobalUISchemaOptions<MuiGlobalUiOptionsKeys, UserExtensions>;

/** A `UiSchema` whose `ui:options` and `ui:globalOptions` are known to carry the theme's `mui` props, and whose
 * `ui:globalOptions` carry a user's own `UserExtensions` too.
 *
 * NOTE: intersects rather than using `Omit`, whose `keyof UiSchema` includes `UiSchema`'s string index signature and so
 * erases every named member.
 */
export type MuiUiSchema<
  UserExtensions extends GlobalUISchemaOptionsExtensions<
    UserExtensions,
    ReservedUiOptionName | keyof MuiGlobalUiOptionsKeys
  > = Record<never, never>,
> = UiSchema & {
  'ui:options'?: UiSchema['ui:options'] & MuiGlobalUiOptionsKeys;
  'ui:globalOptions'?: MuiGlobalUISchemaOptions<UserExtensions>;
};

/** The keys of `MuiGlobalUiOptionsKeys`, which the theme declares as its `globalUiOptionsKeys` */
export const MUI_GLOBAL_UI_OPTIONS_KEYS = Object.keys({ mui: true } satisfies Record<
  keyof MuiGlobalUiOptionsKeys,
  true
>);

function isSxArray(sx: SxProps<Theme>): sx is SxArray {
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
    const { rjsfSlotProps } = muiProps;
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
 * When either `sx` is an array or a theme callback, the two are concatenated, defaults first, into
 * one `sx` array, preserving MUI's array-merge semantics. Otherwise the two objects are
 * shallow-merged, with `muiProps.sx` taking precedence over the `sxProps`.
 *
 * If `muiProps` or its `sx` is omitted the `sxProps` are returned as-is.
 *
 * @param sxProps - The default sx styles to apply
 * @param [muiProps] - The MUI component props that may contain a user-supplied `sx`
 * @returns - The merged sx value
 */
export function computeSxProps<MuiProps extends GridProps>(
  sxProps: SxProps<Theme>,
  muiProps: MuiProps & { sx: SxArray },
): MuiProps['sx'] | MuiProps['sx'][];
export function computeSxProps<MuiProps extends BoxProps | FormHelperTextProps | PaperProps | TypographyProps>(
  sxProps: SxProps<Theme>,
  muiProps?: MuiProps,
): MuiProps['sx'];
export function computeSxProps<
  MuiProps extends BoxProps | FormHelperTextProps | GridProps | PaperProps | TypographyProps,
>(sxProps: SxProps<Theme>, muiProps?: MuiProps): MuiProps['sx'] | MuiProps['sx'][] {
  const sx: SxProps<Theme> | undefined = muiProps?.sx;
  if (sx === undefined) {
    return sxProps;
  }
  if (isSxArray(sxProps) || isSxArray(sx) || typeof sxProps === 'function' || typeof sx === 'function') {
    return [sxProps, sx].flat();
  }
  return { ...sxProps, ...sx };
}

/** The props a form author may give a MUI slot: an object, or MUI's `(ownerState) => props` */
export type MuiSlotProps<P extends object, O> = P | ((ownerState: O) => P);

/** Gives a MUI slot `props` beneath those a form author gives it through `rjsfSlotProps`, which may be an object or
 * MUI's `(ownerState) => props`. The author's own choice for that element is applied last, so it wins
 *
 * @param props - The props the widget gives the slot
 * @param [slotProps] - The props the form author gives the slot
 * @returns - The merged slot props, in the form the author gave theirs
 */
export function withSlotProps<P extends object, O>(
  props: Partial<P>,
  slotProps?: MuiSlotProps<P, O>,
): MuiSlotProps<P, O> {
  if (typeof slotProps === 'function') {
    return (ownerState: O) => ({ ...props, ...slotProps(ownerState) });
  }
  return { ...props, ...slotProps } as P;
}

/** Gives the `input` slot of a MUI control's `slotProps` the `props` a widget puts on the element a user focuses,
 * beneath the form author's own `input` slot, and keeps the author's other slots as they are
 *
 * @param props - The props the widget gives the `input` slot
 * @param [slotProps] - The `slotProps` the form author gives the control
 * @returns - The control's `slotProps`
 */
export function withInputSlot<S extends { input?: MuiSlotProps<object, never> }>(props: object, slotProps?: S): S {
  return { ...slotProps, input: withSlotProps(props, slotProps?.input) } as S;
}

/** Resolves the props a form author gives a MUI slot, which may be MUI's `(ownerState) => props`, for an owner state
 *
 * @param slotProps - The props the form author gives the slot
 * @param ownerState - The owner state MUI resolves the slot's props for
 * @returns - The slot's props as an object
 */
export function resolveSlotProps<P extends object, O>(slotProps: MuiSlotProps<P, O> | undefined, ownerState: O) {
  return typeof slotProps === 'function' ? slotProps(ownerState) : slotProps;
}

/** Adds the id of the helper text MUI's `TextField` renders for its `helperText` to the `aria-describedby` a widget
 * gives the `TextField`'s control. That attribute replaces the one MUI links its helper text by, and the field's plan
 * knows only the parts RJSF draws, not this one MUI draws
 *
 * @param attributes - The attributes the widget gives its control
 * @param id - The `TextField`'s id, from which MUI builds its helper text's id: an `id` in `ui:options.mui`, which
 *   replaces the field's, else the field's
 * @param helperText - The `helperText` the `TextField` is given
 * @returns - The attributes, described by the helper text too where one renders
 */
export function describeByHelperText<A extends { 'aria-describedby'?: string }>(
  attributes: A,
  id: string,
  helperText: ReactNode,
): A {
  if (!helperText) {
    return attributes;
  }
  const describedBy = [attributes['aria-describedby'], `${id}-helper-text`].filter(Boolean).join(' ');
  return { ...attributes, 'aria-describedby': describedBy };
}
