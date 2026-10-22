import type { ReactElement, ReactNode } from 'react';
import { createContext, Fragment, use, useCallback, useMemo } from 'react';
import type {
  BoxProps,
  ElementProps,
  InputWrapperFactory,
  InputWrapperProps,
  MantineStyleProps,
  StylesApiProps,
} from '@mantine/core';
import {
  Box,
  extractStyleProps,
  filterProps,
  Input,
  InputWrapperContext,
  STYLE_PROPS_DATA,
  useInputProps,
  useProps,
} from '@mantine/core';
import type {
  ControlAttributes,
  FormContextType,
  GenericObjectType,
  ReservedUiOptionName,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import {
  errorId,
  getControlAttributes,
  getErrorsToDraw,
  getGroupAttributes,
  getTemplates,
  getWidgetDescription,
  hasWidgetErrors,
  isLabelledByTemplate,
  isObject,
  labelValue,
  RESERVED_UI_OPTION_NAMES,
  titleId,
  widgetDrawsLabel,
} from '@rjsf/utils';

import type { MantineGlobalUiOptionsKeys } from './globalUiOptions.ts';
import { MANTINE_GLOBAL_UI_OPTIONS_KEYS } from './globalUiOptions.ts';

/** The keys `T` declares. `keyof T` is `string` for a type with an index signature, as `UIOptionsType` and
 * `TemplatesType` have, so it would accept any name and require none.
 */
type DeclaredKeys<T> = keyof { [K in keyof T as string extends K ? never : K]: T[K] };

/** The options rjsf reads from a widget's `options`, which `ReservedUiOptionName` lists: those `ui:options` declares,
 * `enumOptions`, every template `getTemplates()` matches in `ui:options` by name, `ui:fieldReplacesAnyOrOneOf` and the
 * options rjsf's widgets read that no type declares. `ButtonTemplates` is added, which `TemplatesType` declares though
 * `getTemplate()` ignores an override of it, and so are the theme's own global options. `ColorWidget` and `FileWidget`
 * pass `format` and `accept` on themselves, since their Mantine components take options of those names.
 */
type StrippedOptionName = ReservedUiOptionName | 'ButtonTemplates' | keyof MantineGlobalUiOptionsKeys;

const strippedOptionNames = new Set<string>([
  ...RESERVED_UI_OPTION_NAMES,
  'ButtonTemplates',
  ...MANTINE_GLOBAL_UI_OPTIONS_KEYS,
]);

/** Builds the `error` prop Mantine's inputs render from a list of errors. Mantine's error element doesn't keep line
 * breaks, so the messages are separated by `<br>`s, each after a space, since a `<br>` adds no text to the accessible
 * description the messages are read as. No errors has to be `undefined`, or the input reserves the space for a message
 * it will never show.
 *
 * @param errors - The errors to render
 * @returns - The errors to render, or undefined when there are none
 */
export function errorLines(errors: readonly ReactNode[]): ReactNode {
  return errors.length
    ? errors.map((error, index) => (
        // oxlint-disable-next-line react/no-array-index-key
        <Fragment key={index}>
          {index > 0 && ' '}
          {index > 0 && <br />}
          {error}
        </Fragment>
      ))
    : undefined;
}

/** The `*` a title template marks a required object's or array's heading with, styled as Mantine marks a required
 * label's, outside the element carrying the title's id, so an option selector named by that id isn't named "Pet *"
 */
export function RequiredMarker() {
  return (
    <Box component='span' aria-hidden c='var(--input-asterisk-color, var(--mantine-color-error))'>
      {' *'}
    </Box>
  );
}

/** Gets the `error` prop Mantine's inputs render: the errors the widget draws, or `true` where they are drawn
 * elsewhere while the field's plan marks its control invalid, which Mantine styles and marks `aria-invalid` without
 * rendering a message
 *
 * @param props - The props of the widget
 * @returns - The `error` prop, or undefined while the control isn't invalid
 */
export function getWidgetError<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: Pick<WidgetProps<T, S, F>, 'rawErrors' | 'hideError' | 'presentation'>): ReactNode {
  const errors = getErrorsToDraw<T, S, F>(props);
  return errorLines(errors) ?? (hasWidgetErrors<T, S, F>(props) || undefined);
}

// `Input.Error` hands `component` on to the `Box` it renders, though its props don't declare it
const blockElement = { component: 'div' };

/** Renders errors in Mantine's error element under the field's `errorId(id)`, as this theme's widgets render theirs,
 * as a `div` rather than Mantine's `p`, since `FieldErrorProps.errors` can hold elements with block content
 *
 * @param id - The id of the field
 * @param errors - The errors to render
 * @param [errorProps] - Style props for the error element, such as the spacing a control drawn outside an
 *   `Input.Wrapper` gives it
 * @returns - The error element, or null when there are no errors
 */
export function renderErrors(id: string, errors: readonly ReactNode[], errorProps?: MantineStyleProps) {
  const lines = errorLines(errors);
  return lines ? (
    <Input.Error {...errorProps} {...blockElement} id={errorId(id)}>
      {lines}
    </Input.Error>
  ) : null;
}

/** Gets the registry's `FieldErrorTemplate` for the errors a widget draws where its `inputWrapperOrder` leaves out
 * Mantine's error slot, which would otherwise draw them
 *
 * @param props - The props of the widget
 * @param inputWrapperOrder - The `inputWrapperOrder` the widget's input or wrapper resolves to
 * @returns - The error element, if the slot is left out and the widget draws any errors
 */
function getSlotlessErrors<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>, inputWrapperOrder: unknown): ReactElement | null {
  if (rendersWrapperPart(inputWrapperOrder, 'error')) {
    return null;
  }
  const errors = getErrorsToDraw<T, S, F>(props);
  if (!errors.length) {
    return null;
  }
  const { id, schema, uiSchema, registry, options } = props;
  const { FieldErrorTemplate } = getTemplates<T, S, F>(registry, options);
  return <FieldErrorTemplate id={id} errors={[...errors]} schema={schema} uiSchema={uiSchema} registry={registry} />;
}

/** Whether Mantine renders a part of an input or wrapper given its `inputWrapperOrder`, which renders every part where
 * it isn't a list
 *
 * @param inputWrapperOrder - The `inputWrapperOrder` the input or wrapper resolves to
 * @param part - The part
 * @returns - True when the part renders
 */
function rendersWrapperPart(inputWrapperOrder: unknown, part: string) {
  return !Array.isArray(inputWrapperOrder) || inputWrapperOrder.includes(part);
}

/** The keys of `T` it declares that `cleanupOptions()` doesn't strip. Mantine's own props reach a widget through the
 * index signature of `WidgetProps['options']`, so they're passed on untyped.
 */
type CleanedOptions<T> = {
  [K in keyof T as K extends DeclaredKeys<T> ? Exclude<K, StrippedOptionName> : never]: T[K];
};

const noExtraKeys: ReadonlySet<string> = new Set();

/** Leaves out of a widget's `options` the ones rjsf reads, so that the rest, Mantine's own props, can be spread onto
 * its Mantine component
 *
 * @param options - The widget's options
 * @param [extraKeys] - Further keys to leave out, as a `Set` or an array
 * @returns - The options that aren't rjsf's or in `extraKeys`
 */
export function cleanupOptions<T extends object>(
  options: T,
  extraKeys: ReadonlySet<string> | readonly string[] = noExtraKeys,
): CleanedOptions<T> {
  const extraKeySet = 'has' in extraKeys ? extraKeys : new Set(extraKeys);
  const result: GenericObjectType = {};
  for (const key in options) {
    if (!strippedOptionNames.has(key) && !extraKeySet.has(key)) {
      result[key] = options[key];
    }
  }
  return result;
}

/**
 * A props helper for rendering the description field across different widgets and templates. The description renders
 * block content, so the `descriptionProps` from the aria hooks render its container as a `div`, to prevent invalid
 * markup.
 *
 * @param widgetProps - The props of the widget, from which the description and hideLabel are derived
 * @returns - An object to spread on the props of the component that should render the description field
 *
 */
export function getDescriptionProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(widgetProps: WidgetProps<T, S, F>) {
  const { schema, uiSchema, registry, options } = widgetProps;
  const description = getWidgetDescription<T, S, F>(widgetProps);
  const { DescriptionFieldTemplate } = getTemplates<T, S, F>(registry, options);

  return {
    description: description ? (
      <DescriptionFieldTemplate
        id={description.id}
        description={description.text}
        schema={schema}
        uiSchema={uiSchema}
        registry={registry}
      />
    ) : undefined,
  };
}

/** Renders a Mantine description as a `div`, since the description template renders block content, keeping the other
 * `descriptionProps` Mantine would otherwise apply
 */
function withDescriptionDiv(descriptionProps: unknown) {
  return { ...asObject(descriptionProps), component: 'div' as const };
}

type InputContainer = (children: ReactNode) => ReactNode;

const inputBaseThemeNames = ['InputBase', 'Input', 'InputWrapper'];
const wrapperThemeNames = ['Input', 'InputWrapper'];

/** The Mantine theme components whose `defaultProps` an input's `inputContainer` and `wrapperProps` resolve from,
 * lowest precedence first. An input built on `InputBase` or `PillsInput` passes its own resolved props down explicitly,
 * so those components' defaults only apply where the outer component's are unset.
 */
const themeComponentNames = {
  TextInput: [...inputBaseThemeNames, 'TextInput'],
  NumberInput: [...inputBaseThemeNames, 'NumberInput'],
  Textarea: [...inputBaseThemeNames, 'Textarea'],
  Select: [...inputBaseThemeNames, 'Select'],
  MultiSelect: ['InputBase', 'PillsInput', ...wrapperThemeNames, 'MultiSelect'],
  FileInput: [...inputBaseThemeNames, 'FileInput'],
  TimeInput: [...inputBaseThemeNames, 'TimeInput'],
  ColorInput: [...wrapperThemeNames, 'ColorInput'],
  PasswordInput: [...wrapperThemeNames, 'PasswordInput'],
  DateInput: [...wrapperThemeNames, 'DateInput'],
} satisfies Record<string, string[]>;

export type AriaInputComponentName = keyof typeof themeComponentNames;

function asObject(value: unknown): GenericObjectType | undefined {
  return isObject(value) ? value : undefined;
}

function successIdOf(id: string, ownSuccessProps: GenericObjectType | undefined): string {
  const ownId: unknown = ownSuccessProps?.id;
  return typeof ownId === 'string' && ownId ? ownId : `${id}-success`;
}

/** Whether `Input.Wrapper` renders the element with `id`, which it lists in its context's `describedBy` when it does */
function isRendered(describedBy: string | undefined, id: string) {
  return !!describedBy?.split(' ').includes(id);
}

/** The id of the success message the enclosing `Input.Wrapper` renders, if it renders one, as Mantine decides, for an
 * input it wraps that Mantine doesn't describe by it
 *
 * @param successId - The id the wrapper gives its success message
 * @returns - `successId` while the message is rendered, else undefined
 */
export function useShownSuccessId(successId: string) {
  const { describedBy } = use(InputWrapperContext);
  return isRendered(describedBy, successId) ? successId : undefined;
}

const GroupSuccessIdContext = createContext<string | undefined>(undefined);

/** Replaces the aria ids in the `InputWrapper` context, keeping the id of the success message Mantine renders, which
 * rjsf has no element for. Mantine only puts that id in the context when the message is rendered. The context's
 * `labelId` is only replaced when one is given. For a group, the success id is passed on to its options instead, like
 * the field's other ids, since a screen reader doesn't read a group's description when focus moves to an option.
 */
function InputWrapperAriaProvider({
  describedBy,
  labelId,
  successId,
  successOnOptions,
  children,
}: {
  describedBy?: string;
  labelId?: string;
  successId: string;
  successOnOptions: boolean;
  children: ReactNode;
}) {
  const inputWrapperContext = use(InputWrapperContext);
  const shownSuccessId = useShownSuccessId(successId);
  const value = {
    ...inputWrapperContext,
    ...(labelId && { labelId }),
    describedBy: [describedBy, !successOnOptions && shownSuccessId].filter(Boolean).join(' ') || undefined,
  };
  const provider = <InputWrapperContext value={value}>{children}</InputWrapperContext>;
  return successOnOptions ? <GroupSuccessIdContext value={shownSuccessId}>{provider}</GroupSuccessIdContext> : provider;
}

/** Renders the options of a group from `useGroupAriaProps`, giving each the `optionProps` it returned, plus the id of
 * the group's success message while Mantine renders it, which is only known inside the group's wrapper
 */
export function GroupOptions({
  optionProps,
  children,
}: {
  optionProps: GenericObjectType;
  children: (optionProps: GenericObjectType) => ReactNode;
}): ReactNode {
  const shownSuccessId = use(GroupSuccessIdContext);
  const describedOptionProps = useMemo(
    () =>
      shownSuccessId
        ? {
            ...optionProps,
            'aria-describedby': [optionProps['aria-describedby'], shownSuccessId].filter(Boolean).join(' '),
          }
        : optionProps,
    [optionProps, shownSuccessId],
  );
  return children(describedOptionProps);
}

interface AriaContainerOptions {
  id: string;
  ownDescriptionProps?: unknown;
  successId: string;
  describedBy?: string;
  labelId?: string;
  ownErrorProps?: GenericObjectType;
  ownSuccessProps?: GenericObjectType;
  ownContainer?: unknown;
  wrapperObject?: GenericObjectType;
  before?: ReactNode;
  after?: ReactNode;
  successOnOptions?: boolean;
}

/** Builds the `inputContainer` that overrides the aria ids Mantine reads from the `InputWrapper` context, wrapping
 * `ownContainer`, the container Mantine would otherwise render, between anything in `before` and `after`. The error
 * element Mantine renders is given the field's `errorId(id)`, the id the input is described by, the success message the
 * known `successId`, since Mantine's components derive it differently, and the description is rendered as a `div`.
 * These are set top-level and in `wrapperProps`, since an explicit prop replaces the theme's default and Mantine gives
 * the two a different precedence for inputs and groups.
 */
function useAriaContainerProps({
  id,
  ownDescriptionProps,
  successId,
  describedBy,
  labelId,
  ownErrorProps,
  ownSuccessProps,
  ownContainer,
  wrapperObject,
  before,
  after,
  successOnOptions = false,
}: AriaContainerOptions) {
  const container = useCallback(
    (children: ReactNode) => (
      <InputWrapperAriaProvider
        describedBy={describedBy}
        labelId={labelId}
        successId={successId}
        successOnOptions={successOnOptions}
      >
        {before}
        {typeof ownContainer === 'function' ? (ownContainer as InputContainer)(children) : children}
        {after}
      </InputWrapperAriaProvider>
    ),
    [describedBy, labelId, successId, successOnOptions, before, after, ownContainer],
  );
  return useMemo(() => {
    const descriptionProps = withDescriptionDiv(ownDescriptionProps);
    const errorProps = { ...ownErrorProps, id: errorId(id) };
    const successProps = { ...ownSuccessProps, id: successId };
    return {
      inputContainer: container,
      descriptionProps,
      errorProps,
      successProps,
      wrapperProps: { ...wrapperObject, inputContainer: container, descriptionProps, errorProps, successProps },
    };
  }, [container, id, ownDescriptionProps, ownErrorProps, ownSuccessProps, successId, wrapperObject]);
}

function pickOptions(options: GenericObjectType, names: readonly string[]) {
  return Object.fromEntries(names.map((name) => [name, options[name]]));
}

const rootSlotKeys = ['classNames', 'styles', 'attributes'];

function withoutRootSlot(value: unknown): unknown {
  if (typeof value === 'function') {
    return (...args: unknown[]) => withoutRootSlot(Reflect.apply(value, undefined, args));
  }
  if (!isObject(value)) {
    return value;
  }
  const { root: _root, ...rest } = value;
  return rest;
}

/** A value for a style prop that renders no style. `undefined` would let `Input.Wrapper` fall back to the theme's, and
 * an object is a responsive value, for which Mantine renders a `<style>` element. A color prop throws on anything but
 * a string.
 */
function noStyle(name: string) {
  const type = (STYLE_PROPS_DATA as GenericObjectType)[name]?.type;
  return type === 'color' || type === 'textColor' ? '' : null;
}

/** Keeps only the root element props set in `ownWrapperProps`, for a wrapper around inputs that apply the theme's root
 * element props to their own wrappers: `className`, `style`, `mod`, the style props such as `mt`, and the `root` entry
 * of `classNames`, `styles` and `attributes`. `Input.Wrapper` fills an `undefined` prop from `InputWrapper`'s theme
 * `defaultProps`, so those the theme sets are given values that render nothing.
 */
function withOwnRootProps(
  wrapperProps: GenericObjectType,
  wrapperDefaults: GenericObjectType,
  ownWrapperProps: GenericObjectType = {},
): GenericObjectType {
  const {
    rest: { className: _className, style: _style, mod: _mod, ...rest },
  } = extractStyleProps(wrapperProps);
  const { styleProps: themeStyleProps } = extractStyleProps(wrapperDefaults);
  const { styleProps: ownStyleProps, rest: own } = extractStyleProps(ownWrapperProps);
  const slots = rootSlotKeys.filter((key) => !(key in ownWrapperProps));
  return {
    ...rest,
    ...Object.fromEntries(slots.map((key) => [key, withoutRootSlot(rest[key])])),
    ...Object.fromEntries(Object.keys(themeStyleProps).map((name) => [name, noStyle(name)])),
    ...ownStyleProps,
    className: own.className ?? '',
    style: own.style ?? {},
    mod: own.mod ?? {},
  };
}

/** Gets the label a widget names its control by itself, whether Mantine shows it or the widget keeps it hidden: none
 * where its field's plan has the label drawn elsewhere, by the template or by a field above, whose label names the
 * control instead, and the plan's `aria-label` where `ui:label: false` hides the label, which beneath a field above
 * whose label is hidden too is that field's text rather than the widget's own
 *
 * @param props - The widget's `label` and `presentation`
 * @returns - The label, or undefined where the widget names its control by none of its own
 */
export function getOwnLabel<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: Pick<WidgetProps<T, S, F>, 'label' | 'presentation'>) {
  const { label, presentation } = props;
  if (presentation && isLabelledByTemplate(presentation)) {
    return undefined;
  }
  return presentation?.control?.attributes['aria-label'] ?? (label || undefined);
}

/** Renders the field's title `hidden` when Mantine won't render it, because it is hidden or left out of
 * `inputWrapperOrder`, so that the elements labelled by `titleId(id)` keep an accessible name
 */
export function useHiddenTitle(
  id: string,
  label: ReactNode,
  hideLabel: boolean | undefined,
  inputWrapperOrder: unknown,
) {
  const titleRendered = !hideLabel && !!label && rendersWrapperPart(inputWrapperOrder, 'label');
  return useMemo(
    () =>
      !!label && !titleRendered ? (
        <span id={titleId(id)} hidden>
          {label}
        </span>
      ) : undefined,
    [id, label, titleRendered],
  );
}

export type OwnKeys<P, Base> = Exclude<keyof P, keyof Base>;

/** The `InputWrapper` options a widget's options can set; rjsf renders the title, description and errors itself */
type FieldWrapperOptionKey = Exclude<
  OwnKeys<InputWrapperProps, BoxProps & StylesApiProps<InputWrapperFactory> & ElementProps<'div'>>,
  `__${string}` | 'label' | 'description' | 'error' | 'required'
>;

// A record, not a list, so that an option a later Mantine release adds fails typecheck until it is listed here
const fieldWrapperOptionKeyRecord: Record<FieldWrapperOptionKey, true> = {
  descriptionProps: true,
  errorProps: true,
  inputContainer: true,
  inputWrapperOrder: true,
  labelElement: true,
  labelProps: true,
  size: true,
  success: true,
  successProps: true,
  withAsterisk: true,
};
const fieldWrapperOptionKeys = Object.keys(fieldWrapperOptionKeyRecord) as FieldWrapperOptionKey[];
const fieldWrapperPickedKeys = [...fieldWrapperOptionKeys, 'wrapperProps'];
// The options an input's aria props override, and those a group's also do, as subsets of the field wrapper options
const ariaOptionKeys = [
  'descriptionProps',
  'errorProps',
  'inputContainer',
  'successProps',
] as const satisfies readonly FieldWrapperOptionKey[];
// An input's also resolve its `inputWrapperOrder`, to tell whether it renders the error slot
const inputOptionKeys = [...ariaOptionKeys, 'inputWrapperOrder'] as const;
const inputPickedKeys = [...inputOptionKeys, 'wrapperProps'];
const groupOptionKeys = [...inputOptionKeys, 'labelProps'] as const satisfies readonly FieldWrapperOptionKey[];
const groupPickedKeys = [...groupOptionKeys, 'wrapperProps'];

// Mantine's own default container, given explicitly, since an `undefined` one falls back to the theme's
function renderChildren(children: ReactNode): ReactNode {
  return children;
}

/**
 * A props hook for the `Input.Wrapper` a widget renders around inputs that don't render their own wrapper, such as a
 * `Slider` or the parts of a date, so that Mantine lays out and styles the field's title, description and errors as
 * it does an input's. The title gets the id `titleId(id)`. A widget whose inputs are named by that id renders the
 * title itself, `hidden`, with `useHiddenTitle()` and the `inputWrapperOrder` returned here, for when Mantine doesn't
 * render it; it goes beside the wrapper rather than in it, since a custom `inputContainer`, like Mantine's `Tooltip`,
 * may only accept the single element Mantine's own inputs pass it. The wrapper options are
 * resolved as Mantine's inputs resolve them, from the widget's options and `Input`'s and `InputWrapper`'s theme
 * `defaultProps`; the widget's own component's theme `defaultProps` aren't read, since Mantine would spread them on its
 * root element. The wrapper gets no `id`, which Mantine would put on its root element and point the title's `for` at,
 * though the widget's inputs have their own ids; the title gets no `for`.
 *
 * @param widgetProps - The props of the widget, from which the label, description, errors and options are derived
 * @param [containerOnInputs=false] - Whether the widget's inputs render the `inputContainer` themselves, each in its
 *   own wrapper, so that the field's wrapper mustn't render it again
 * @returns - The `wrapperProps` to spread on `Input.Wrapper`, the `inputWrapperOrder` they resolve to, whether the
 *   field is `invalid`, for its inputs to say so too, the `successId` of the wrapper's success message, for its
 *   inputs to be described by through `useShownSuccessId()` while it is shown, and `slotlessErrors`, the errors to
 *   render beside the wrapper where its `inputWrapperOrder` leaves out the error slot
 */
export function useFieldWrapperProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(widgetProps: WidgetProps<T, S, F>, containerOnInputs = false) {
  const { id, label, required, options } = widgetProps;
  const hideLabel = !widgetDrawsLabel<T, S, F>(widgetProps);
  const { description } = getDescriptionProps(widgetProps);
  const { labelElement, wrapperProps: inputWrapperProps } = useInputProps(
    'InputWrapper',
    {},
    pickOptions(options, fieldWrapperPickedKeys),
  );
  // `Input.Wrapper` would size its title, description and errors by the `size` in `__stylesApiProps`, the top-level
  // props, rather than by its own, which a `wrapperProps.size` may have replaced
  const { __stylesApiProps: _stylesApiProps, id: _id, ...mantineWrapperProps } = inputWrapperProps as GenericObjectType;
  // Resolved as `Input.Wrapper` resolves them, since some are read or replaced here. `useInputProps` leaves
  // `labelElement` with the input, while this wrapper takes it.
  const wrapperDefaults = useProps<GenericObjectType>('InputWrapper', {}, {});
  const resolved: GenericObjectType = { ...wrapperDefaults, ...filterProps({ labelElement, ...mantineWrapperProps }) };
  // The widget's inputs apply the theme's root element props to the wrappers they render
  const wrapperProps = containerOnInputs
    ? withOwnRootProps(resolved, wrapperDefaults, asObject(options.wrapperProps))
    : resolved;
  const error = getWidgetError<T, S, F>(widgetProps);
  const ownSuccessProps = asObject(resolved.successProps);
  const successId = successIdOf(id, ownSuccessProps);
  return {
    wrapperProps: {
      ...wrapperProps,
      inputContainer: containerOnInputs ? renderChildren : wrapperProps.inputContainer,
      label: labelValue(label || undefined, hideLabel, false),
      labelProps: { ...asObject(resolved.labelProps), id: titleId(id), htmlFor: undefined },
      required,
      description,
      descriptionProps: withDescriptionDiv(resolved.descriptionProps),
      error,
      errorProps: { ...asObject(resolved.errorProps), id: errorId(id) },
      successProps: { ...ownSuccessProps, id: successId },
    },
    inputWrapperOrder: resolved.inputWrapperOrder as unknown,
    invalid: !!error,
    successId,
    slotlessErrors: getSlotlessErrors<T, S, F>(widgetProps, resolved.inputWrapperOrder),
  };
}

/**
 * A props hook that points a Mantine input's `aria-describedby` at the ids it is given.
 * Mantine's `Input` sets `aria-describedby` from the `InputWrapper` context after spreading the caller's props, so an
 * `aria-describedby` prop never reaches the DOM, and that context only knows about Mantine's own description and error
 * elements. Overriding the context from `inputContainer` is the one place the value Mantine applies can be replaced.
 * The container, `successProps`, `errorProps` and `descriptionProps` Mantine would otherwise apply are resolved as
 * Mantine's inputs resolve them, from the widget's options and the theme's `defaultProps`, and the error element is
 * given the field's `errorId(id)`, whatever `errorProps.id` says.
 *
 * @param component - The Mantine input the props are spread on, whose theme `defaultProps` supply any `inputContainer`
 * @param id - The id of the field the input belongs to
 * @param options - The widget's options, whose own `inputContainer`, if any, is still applied inside the override
 * @param settings - `describedBy`, the ids to describe the input by, `alsoDescribedBy`, further ids to describe it by,
 *   `wrapperOverrides`, set over the `wrapperProps` the input would otherwise take, rather than replacing them, and
 *   `slotlessErrors`, which gets what to render after the input from the `inputWrapperOrder` it resolves to
 * @returns - An object to spread on the props of the Mantine input, after the theme props
 */
export function useAriaDescribedByProps(
  component: AriaInputComponentName,
  id: string,
  options: GenericObjectType,
  {
    describedBy,
    alsoDescribedBy,
    wrapperOverrides,
    slotlessErrors,
  }: {
    describedBy?: string;
    alsoDescribedBy?: string;
    wrapperOverrides?: GenericObjectType;
    slotlessErrors?: (inputWrapperOrder: unknown) => ReactNode;
  },
) {
  const props = useProps<GenericObjectType>(themeComponentNames[component], {}, pickOptions(options, inputPickedKeys));
  const wrapperObject = useMemo(
    () => (wrapperOverrides ? { ...asObject(props.wrapperProps), ...wrapperOverrides } : asObject(props.wrapperProps)),
    [props.wrapperProps, wrapperOverrides],
  );
  // As in Mantine's `useInputProps`, a key present in `wrapperProps` wins even when `undefined`, which `Input.Wrapper`
  // then resolves from `InputWrapper`'s theme `defaultProps`
  const fromWrapper = (name: string): unknown =>
    wrapperObject && name in wrapperObject ? wrapperObject[name] : props[name];
  const resolved = useProps<GenericObjectType>(
    'InputWrapper',
    {},
    Object.fromEntries(inputOptionKeys.map((name) => [name, fromWrapper(name)])),
  );
  const ownSuccessProps = asObject(resolved.successProps);
  return useAriaContainerProps({
    id,
    successId: successIdOf(id, ownSuccessProps),
    describedBy: [describedBy, alsoDescribedBy].filter(Boolean).join(' '),
    ownDescriptionProps: resolved.descriptionProps,
    ownErrorProps: asObject(resolved.errorProps),
    ownSuccessProps,
    ownContainer: resolved.inputContainer,
    wrapperObject,
    after: slotlessErrors?.(resolved.inputWrapperOrder),
  });
}

/**
 * A props hook for a widget's Mantine input, which takes the `error` `getWidgetError()` gives: its field's plan,
 * through `useAriaDescribedByProps()`. The input is described and named by the `aria-describedby`, `aria-labelledby`
 * and `aria-label` it is given, those `getControlAttributes()` gives by default, the second for a label drawn
 * elsewhere with no `for` and the third for a label `ui:label: false` hides, and the errors the widget draws are
 * rendered by the registry's `FieldErrorTemplate` where its `inputWrapperOrder` leaves out Mantine's error slot.
 *
 * @param component - The Mantine input the props are spread on
 * @param widgetProps - The props of the widget
 * @param [attributes] - The `aria-describedby`, `aria-labelledby` and `aria-label` to give the input, such as those
 *   `getControlAttributes()` gives with the ids of the elements the widget renders to describe it
 * @returns - An object to spread on the props of the Mantine input, after the theme props
 */
export function useInputAriaProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  component: AriaInputComponentName,
  widgetProps: WidgetProps<T, S, F>,
  attributes: Pick<ControlAttributes, 'aria-describedby' | 'aria-labelledby' | 'aria-label'> = getControlAttributes<
    T,
    S,
    F
  >(widgetProps),
) {
  const { id, options } = widgetProps;
  const { 'aria-describedby': describedBy, 'aria-labelledby': labelledBy, 'aria-label': ariaLabel } = attributes;
  const ariaProps = useAriaDescribedByProps(component, id, options, {
    describedBy,
    slotlessErrors: (inputWrapperOrder) => getSlotlessErrors<T, S, F>(widgetProps, inputWrapperOrder),
  });
  // Each left out rather than `undefined` where none is given, so one in the options still applies
  return {
    ...ariaProps,
    ...(labelledBy && { 'aria-labelledby': labelledBy }),
    ...(ariaLabel && { 'aria-label': ariaLabel }),
  };
}

/**
 * A props hook for `Checkbox.Group` and `Radio.Group`, which render the field's label and take their group element's
 * `aria-describedby` and `aria-labelledby` from the `InputWrapper` context. Each option input is described by the
 * ids `getControlDescribedBy()` gives, as in `@rjsf/core`, and by the success message while Mantine renders it, so the
 * group is left undescribed rather than having a screen reader repeat the description, error and help on entering it.
 * Each option is also marked invalid while its field's plan marks the control invalid, since Mantine's group element
 * takes no `aria-invalid`, and each radio required when the field is. The group is labelled as `getGroupAttributes()`
 * says, by a label the plan has drawn elsewhere, or by the field's title id: the label the widget shows has that id,
 * and one Mantine doesn't render, because it is hidden or left out of `inputWrapperOrder`, is still rendered with it,
 * `hidden`, since a group needs an accessible name. Mantine only labels the group by a label it renders itself. The
 * errors the widget draws are rendered by the registry's `FieldErrorTemplate` where `inputWrapperOrder` leaves out
 * Mantine's error slot. The container, `labelProps`, `descriptionProps`, `errorProps`,
 * `successProps` and `inputWrapperOrder` Mantine would otherwise apply are resolved as Mantine's groups resolve them:
 * the widget's options or the group's theme `defaultProps`, then `wrapperProps`, then `InputWrapper`'s theme
 * `defaultProps`. The error element is given the field's `errorId(id)`, whatever `errorProps.id` says.
 *
 * @param component - The Mantine group the props are spread on, whose theme `defaultProps` supply any `inputContainer`
 * @param widgetProps - The props of the widget, from which the label, its visibility, the errors and the options are
 *   derived
 * @returns - The `groupProps` to spread on the Mantine group, after the theme props, including the `error` it
 *   renders, and the `optionProps` to give `GroupOptions`, which renders the option inputs
 */
export function useGroupAriaProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(component: 'CheckboxGroup' | 'RadioGroup', widgetProps: WidgetProps<T, S, F>) {
  const { id, required, options } = widgetProps;
  const hideLabel = !widgetDrawsLabel<T, S, F>(widgetProps);
  const label = getOwnLabel<T, S, F>(widgetProps);
  const props = useProps<GenericObjectType>(component, {}, pickOptions(options, groupPickedKeys));
  const wrapperObject = asObject(props.wrapperProps);
  // A group spreads its own props after `wrapperProps`, the reverse of an input, then `Input.Wrapper` falls back to
  // `InputWrapper`'s theme `defaultProps`
  const resolved = useProps<GenericObjectType>(
    'InputWrapper',
    {},
    Object.fromEntries(
      groupOptionKeys.map((name) => [name, props[name] !== undefined ? props[name] : wrapperObject?.[name]]),
    ),
  );
  const shownLabel = labelValue(label, hideLabel, false);
  const hiddenLabel = useHiddenTitle(id, label, hideLabel, resolved.inputWrapperOrder);
  // The label the widget draws, shown or hidden, where the plan names the group by no other
  const role = component === 'RadioGroup' ? 'radiogroup' : 'group';
  const { group, option } = getGroupAttributes<T, S, F>(widgetProps, role, label ? titleId(id) : undefined);
  const labelledBy = group['aria-labelledby'] ?? (hiddenLabel ? titleId(id) : undefined);
  const ownSuccessProps = asObject(resolved.successProps);
  const containerProps = useAriaContainerProps({
    id,
    successId: successIdOf(id, ownSuccessProps),
    labelId: labelledBy,
    ownDescriptionProps: resolved.descriptionProps,
    ownErrorProps: asObject(resolved.errorProps),
    ownSuccessProps,
    ownContainer: resolved.inputContainer,
    wrapperObject,
    before: hiddenLabel,
    after: getSlotlessErrors<T, S, F>(widgetProps, resolved.inputWrapperOrder),
    successOnOptions: true,
  });
  const invalid = hasWidgetErrors<T, S, F>(widgetProps);
  // Mantine's `Checkbox` and `Radio` only style an `error`. Each radio is required, as in `@rjsf/core`, since checking
  // any one of them satisfies it, where a required checkbox would have to be checked.
  const optionRequired = component === 'RadioGroup' && required;
  const describedBy = option['aria-describedby'];
  const optionProps = useMemo(
    () => ({
      'aria-describedby': describedBy,
      'aria-invalid': invalid || undefined,
      required: optionRequired || undefined,
    }),
    [describedBy, invalid, optionRequired],
  );
  return {
    groupProps: {
      label: shownLabel,
      labelProps: { ...asObject(resolved.labelProps), id: titleId(id) },
      error: getWidgetError<T, S, F>(widgetProps),
      ...containerProps,
    },
    optionProps,
  };
}
