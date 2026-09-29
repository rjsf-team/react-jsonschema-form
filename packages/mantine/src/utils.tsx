import type { ReactNode } from 'react';
import { use, useCallback, useMemo } from 'react';
import type { BoxProps, ElementProps, InputWrapperFactory, InputWrapperProps, StylesApiProps } from '@mantine/core';
import {
  extractStyleProps,
  filterProps,
  InputWrapperContext,
  STYLE_PROPS_DATA,
  useInputProps,
  useProps,
} from '@mantine/core';
import type {
  FormContextType,
  GenericObjectType,
  RJSFSchema,
  StrictRJSFSchema,
  UIOptionsType,
  VisibleErrorsProps,
  WidgetProps,
} from '@rjsf/utils';
import {
  ariaDescribedByIds,
  descriptionId,
  errorId,
  getTemplate,
  getVisibleErrors,
  isObject,
  labelValue,
  titleId,
} from '@rjsf/utils';

const uiOptionsKeys: (keyof UIOptionsType)[] = [
  'emptyValue',
  'classNames',
  'style',
  'title',
  'description',
  'label',
  'help',
  'autofocus',
  'autocomplete',
  'autocapitalize',
  'disabled',
  'enumDisabled',
  'enumNames',
  'enumOrder',
  'optgroups',
  'hideError',
  'readonly',
  'order',
  'filePreview',
  'inline',
  'inputType',
  'submitButtonOptions',
  'widget',
  'field',
  'addable',
  'copyable',
  'orderable',
  'removable',
  'duplicateKeySuffixSeparator',
  'enumOptions',
  'enableMarkdownInDescription',
  'enableMarkdownInHelp',
  'enableOptionalDataFieldForType',
  'globalOptions',
  'allowClearTextInputs',
  'optionValueFormat',
  'optionsSchemaSelector',
  'deprecatedHandling',
  'ArrayFieldDescriptionTemplate',
  'ArrayFieldItemTemplate',
  'ArrayFieldTemplate',
  'ArrayFieldTitleTemplate',
  'BaseInputTemplate',
  'DescriptionFieldTemplate',
  'ErrorListTemplate',
  'FieldErrorTemplate',
  'FieldHelpTemplate',
  'FieldTemplate',
  'ObjectFieldTemplate',
  'TitleFieldTemplate',
  'UnsupportedFieldTemplate',
  'WrapIfAdditionalTemplate',
];

/** Builds the `error` prop Mantine's inputs render, from the errors the component should surface. Mantine's error
 * element doesn't keep line breaks, so the messages are separated by `<br>`s, and no errors has to be `undefined`, or
 * the input reserves the space for a message it will never show.
 *
 * @param props - The props of the widget or template, from which `rawErrors` and `hideError` are read
 * @returns - The errors to render, or undefined when there are none
 */
export function visibleErrors(props: VisibleErrorsProps): ReactNode {
  const errors = getVisibleErrors(props);
  return errors.length
    ? // oxlint-disable-next-line react/no-array-index-key
      errors.flatMap((error, index) => (index ? [<br key={index} />, error] : [error]))
    : undefined;
}

export function cleanupOptions<T extends object>(
  options: T,
  extraKeys: readonly string[] = [],
): Omit<T, keyof UIOptionsType> {
  const result = {} as T;
  for (const key in options) {
    if (!uiOptionsKeys.includes(key) && !extraKeys.includes(key)) {
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
  const { id, schema, uiSchema, registry, options, hideLabel } = widgetProps;
  const description = options.description || schema.description;
  const DescriptionFieldTemplate = getTemplate<'DescriptionFieldTemplate', T, S, F>(
    'DescriptionFieldTemplate',
    registry,
    options,
  );

  return {
    description:
      !hideLabel && !!description ? (
        <DescriptionFieldTemplate
          id={descriptionId(id)}
          description={description}
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

/** The Mantine theme components whose `defaultProps` an input's `inputContainer` and `wrapperProps` resolve from, lowest
 * precedence first. An input built on `InputBase` or `PillsInput` passes its own resolved props down explicitly, so
 * those components' defaults only apply where the outer component's are unset.
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

/** The name of a Mantine input, as its `defaultProps` are keyed in the theme's `components` */
export type AriaInputComponentName = keyof typeof themeComponentNames;

function asObject(value: unknown): GenericObjectType | undefined {
  return isObject(value) ? value : undefined;
}

function successIdOf(id: string, ownSuccessProps: GenericObjectType | undefined): string {
  return ownSuccessProps?.id || `${id}-success`;
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

/** Replaces the aria ids in the `InputWrapper` context, keeping the id of the success message Mantine renders, which
 * rjsf has no element for. Mantine only puts that id in the context when the message is rendered. The context's
 * `labelId` is only replaced when one is given.
 */
function InputWrapperAriaProvider({
  describedBy,
  labelId,
  successId,
  children,
}: {
  describedBy?: string;
  labelId?: string;
  successId: string;
  children: ReactNode;
}) {
  const inputWrapperContext = use(InputWrapperContext);
  const successShown = isRendered(inputWrapperContext.describedBy, successId);
  const value = {
    ...inputWrapperContext,
    ...(labelId && { labelId }),
    describedBy: [describedBy, successShown && successId].filter(Boolean).join(' ') || undefined,
  };
  return <InputWrapperContext value={value}>{children}</InputWrapperContext>;
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
}

/** Builds the `inputContainer` that overrides the aria ids Mantine reads from the `InputWrapper` context, wrapping
 * `ownContainer`, the container Mantine would otherwise render, after anything in `before`. The error element Mantine
 * renders is given the field's `errorId(id)`, the id the input is described by, the success message the known
 * `successId`, since Mantine's components derive it differently, and the description is rendered as a `div`. These
 * are set top-level and in `wrapperProps`, since an explicit prop replaces the theme's default and Mantine gives the two
 * a different precedence for inputs and groups.
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
}: AriaContainerOptions) {
  const container = useCallback(
    (children: ReactNode) => (
      <InputWrapperAriaProvider describedBy={describedBy} labelId={labelId} successId={successId}>
        {before}
        {typeof ownContainer === 'function' ? (ownContainer as InputContainer)(children) : children}
      </InputWrapperAriaProvider>
    ),
    [describedBy, labelId, successId, before, ownContainer],
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
    return (...args: unknown[]) => withoutRootSlot(value(...args));
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

/** Renders the field's title `hidden` when Mantine won't render it, because it is hidden or left out of
 * `inputWrapperOrder`, so that the elements labelled by `titleId(id)` keep an accessible name
 */
function useHiddenTitle(id: string, label: ReactNode, hideLabel: boolean | undefined, inputWrapperOrder: unknown) {
  const titleRendered =
    !hideLabel && !!label && (!Array.isArray(inputWrapperOrder) || inputWrapperOrder.includes('label'));
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

/** The keys of `P` that aren't also keys of `Base` */
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

// Mantine's own default container, given explicitly, since an `undefined` one falls back to the theme's
function renderChildren(children: ReactNode): ReactNode {
  return children;
}

/**
 * A props hook for the `Input.Wrapper` a widget renders around inputs that don't render their own wrapper, such as a
 * `Slider` or the parts of a date, so that Mantine lays out and styles the field's title, description and errors as
 * it does an input's. The title gets the id `titleId(id)`, and a title Mantine doesn't render, because it is hidden
 * or left out of `inputWrapperOrder`, is still rendered with it, `hidden`, so that the widget's inputs can keep it as
 * their accessible name. The hidden title goes beside the wrapper rather than in it, since a custom `inputContainer`,
 * like Mantine's `Tooltip`, may only accept the single element Mantine's own inputs pass it. The wrapper options are
 * resolved as Mantine's inputs resolve them, from the widget's options and `Input`'s and `InputWrapper`'s theme
 * `defaultProps`; the widget's own component's theme `defaultProps` aren't read, since Mantine would spread them on its
 * root element. The wrapper gets no `id`, which Mantine would put on its root element and point the title's `for` at,
 * though the widget's inputs have their own ids; the title gets no `for`.
 *
 * @param widgetProps - The props of the widget, from which the label, description, errors and options are derived
 * @param [containerOnInputs=false] - Whether the widget's inputs render the `inputContainer` themselves, each in its
 *   own wrapper, so that the field's wrapper mustn't render it again
 * @returns - The `wrapperProps` to spread on `Input.Wrapper`, the `hiddenTitle` to render before it, if any, whether
 *   the field is `invalid`, for its inputs to say so too, and the `successId` of the wrapper's success message, for its
 *   inputs to be described by through `useShownSuccessId()` while it is shown
 */
export function useFieldWrapperProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(widgetProps: WidgetProps<T, S, F>, containerOnInputs = false) {
  const { id, label, hideLabel, required, options } = widgetProps;
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
  const hiddenTitle = useHiddenTitle(id, label, hideLabel, resolved.inputWrapperOrder);
  const error = visibleErrors(widgetProps);
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
    hiddenTitle,
    invalid: !!error,
    successId,
  };
}

const ariaPickedKeys = ['descriptionProps', 'errorProps', 'inputContainer', 'successProps', 'wrapperProps'];

/**
 * A props hook that points a Mantine input's `aria-describedby` at the field's description, error and help ids.
 * Mantine's `Input` sets `aria-describedby` from the `InputWrapper` context after spreading the caller's props, so an
 * `aria-describedby` prop never reaches the DOM, and that context only knows about Mantine's own description and error
 * elements. Overriding the context from `inputContainer` is the one place the value Mantine applies can be replaced.
 * The container, `successProps`, `errorProps` and `descriptionProps` Mantine would otherwise apply are resolved as
 * Mantine's inputs resolve them, from the widget's options and the theme's `defaultProps`, and the error element is
 * given the field's `errorId(id)`, whatever `errorProps.id` says.
 *
 * @param component - The Mantine input the props are spread on, whose theme `defaultProps` supply any `inputContainer`
 * @param id - The id of the field the input belongs to
 * @param [options={}] - The widget's options, whose own `inputContainer`, if any, is still applied inside the override
 * @param [settings={}] - `includeExamples`, whether to also describe the input by the field's examples list,
 *   `alsoDescribedBy`, further ids to describe the input by, and `wrapperOverrides`, set over the `wrapperProps` the
 *   input would otherwise take, rather than replacing them
 * @returns - An object to spread on the props of the Mantine input, after the theme props
 */
export function useAriaDescribedByProps(
  component: AriaInputComponentName,
  id: string,
  options: GenericObjectType = {},
  {
    includeExamples = false,
    alsoDescribedBy,
    wrapperOverrides,
  }: {
    includeExamples?: boolean;
    alsoDescribedBy?: string;
    wrapperOverrides?: GenericObjectType;
  } = {},
) {
  const props = useProps<GenericObjectType>(themeComponentNames[component], {}, pickOptions(options, ariaPickedKeys));
  const wrapperObject = useMemo(
    () => (wrapperOverrides ? { ...asObject(props.wrapperProps), ...wrapperOverrides } : asObject(props.wrapperProps)),
    [props.wrapperProps, wrapperOverrides],
  );
  // As in Mantine's `useInputProps`, a key present in `wrapperProps` wins even when `undefined`, which `Input.Wrapper`
  // then resolves from `InputWrapper`'s theme `defaultProps`
  const fromWrapper = (name: string) => (wrapperObject && name in wrapperObject ? wrapperObject[name] : props[name]);
  const resolved = useProps<GenericObjectType>(
    'InputWrapper',
    {},
    {
      descriptionProps: fromWrapper('descriptionProps'),
      errorProps: fromWrapper('errorProps'),
      inputContainer: fromWrapper('inputContainer'),
      successProps: fromWrapper('successProps'),
    },
  );
  const ownSuccessProps = asObject(resolved.successProps);
  return useAriaContainerProps({
    id,
    successId: successIdOf(id, ownSuccessProps),
    describedBy: [ariaDescribedByIds(id, includeExamples), alsoDescribedBy].filter(Boolean).join(' '),
    ownDescriptionProps: resolved.descriptionProps,
    ownErrorProps: asObject(resolved.errorProps),
    ownSuccessProps,
    ownContainer: resolved.inputContainer,
    wrapperObject,
  });
}

const groupOptionNames = [
  'descriptionProps',
  'errorProps',
  'inputContainer',
  'inputWrapperOrder',
  'labelProps',
  'successProps',
] as const;
const groupPickedKeys = [...groupOptionNames, 'wrapperProps'];

/**
 * A props hook for `Checkbox.Group` and `Radio.Group`, which render the field's label and take their group element's
 * `aria-describedby` and `aria-labelledby` from the `InputWrapper` context. Each option input is described by the
 * field's ids, as in `@rjsf/core`, so the group is left undescribed rather than having a screen reader repeat the
 * description, error and help on entering it. The group is labelled by the field's title id: the shown label has that
 * id, and a label Mantine doesn't render, because it is hidden or left out of `inputWrapperOrder`, is still rendered
 * with it, `hidden`, since a group needs an accessible name. Mantine only labels the group by a label it renders itself.
 * The container, `labelProps`, `descriptionProps`, `errorProps`, `successProps` and `inputWrapperOrder` Mantine would
 * otherwise apply are resolved as Mantine's groups resolve them: the widget's options or the group's theme
 * `defaultProps`, then `wrapperProps`, then `InputWrapper`'s theme `defaultProps`. The error element is given the
 * field's `errorId(id)`, whatever `errorProps.id` says.
 *
 * @param component - The Mantine group the props are spread on, whose theme `defaultProps` supply any `inputContainer`
 * @param widgetProps - The props of the widget, from which the label, its visibility and the options are derived
 * @returns - The `groupProps` to spread on the Mantine group, after the theme props, and the `optionProps` to spread on
 *   each of its option inputs
 */
export function useGroupAriaProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(component: 'CheckboxGroup' | 'RadioGroup', { id, label, hideLabel, options }: WidgetProps<T, S, F>) {
  const props = useProps<GenericObjectType>(component, {}, pickOptions(options, groupPickedKeys));
  const wrapperObject = asObject(props.wrapperProps);
  // A group spreads its own props after `wrapperProps`, the reverse of an input, then `Input.Wrapper` falls back to
  // `InputWrapper`'s theme `defaultProps`
  const resolved = useProps<GenericObjectType>(
    'InputWrapper',
    {},
    Object.fromEntries(
      groupOptionNames.map((name) => [name, props[name] !== undefined ? props[name] : wrapperObject?.[name]]),
    ),
  );
  const shownLabel = labelValue(label || undefined, hideLabel, false);
  const hiddenLabel = useHiddenTitle(id, label, hideLabel, resolved.inputWrapperOrder);
  const ownSuccessProps = asObject(resolved.successProps);
  const containerProps = useAriaContainerProps({
    id,
    successId: successIdOf(id, ownSuccessProps),
    labelId: label ? titleId(id) : undefined,
    ownDescriptionProps: resolved.descriptionProps,
    ownErrorProps: asObject(resolved.errorProps),
    ownSuccessProps,
    ownContainer: resolved.inputContainer,
    wrapperObject,
    before: hiddenLabel,
  });
  const optionProps = useMemo(() => ({ 'aria-describedby': ariaDescribedByIds(id) }), [id]);
  return {
    groupProps: {
      label: shownLabel,
      labelProps: { ...asObject(resolved.labelProps), id: titleId(id) },
      ...containerProps,
    },
    optionProps,
  };
}
