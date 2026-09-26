import type { ReactNode } from 'react';
import { use, useCallback, useMemo } from 'react';
import { InputWrapperContext, useProps } from '@mantine/core';
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

/** Builds the text for the `error` prop Mantine's inputs render, from the errors the component should surface.
 * Mantine renders the `error` prop as text, so an empty string has to become `undefined` or the input reserves the
 * space for a message it will never show.
 *
 * @param props - The props of the widget or template, from which `rawErrors` and `hideError` are read
 * @returns - The error text to render, or undefined when there is none
 */
export function visibleErrorText(props: VisibleErrorsProps): string | undefined {
  return getVisibleErrors(props).join('\n') || undefined;
}

export function cleanupOptions<T extends object>(options: T): Omit<T, keyof UIOptionsType> {
  const result = {} as T;
  for (const key in options) {
    if (!uiOptionsKeys.includes(key)) {
      result[key] = options[key];
    }
  }
  return result;
}

/**
 * A props helper for rendering the description field across different widgets and templates
 * by generating a component for `description` and `descriptionProps` to prevent invalid markup.
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
    descriptionProps: {
      component: 'div' as const,
    },
  };
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

interface InputWrapperAriaOverrides {
  describedBy?: string;
  labelId?: string;
}

function asObject(value: unknown): GenericObjectType | undefined {
  return isObject(value) ? value : undefined;
}

/** Replaces the aria ids in the `InputWrapper` context, keeping the id of the success message Mantine renders, which
 * rjsf has no element for. Mantine only puts that id in the context when the message is rendered.
 */
function InputWrapperAriaProvider({
  overrides,
  successId,
  children,
}: {
  overrides: InputWrapperAriaOverrides;
  successId: string;
  children: ReactNode;
}) {
  const inputWrapperContext = use(InputWrapperContext);
  const successShown = inputWrapperContext.describedBy?.split(' ').includes(successId);
  const describedBy = [overrides.describedBy, successShown && successId].filter(Boolean).join(' ') || undefined;
  return (
    <InputWrapperContext value={{ ...inputWrapperContext, ...overrides, describedBy }}>{children}</InputWrapperContext>
  );
}

/** Builds the `inputContainer` that overrides the aria ids Mantine reads from the `InputWrapper` context, wrapping
 * `ownContainer`, the container Mantine would otherwise render, after anything in `before`. The success message is
 * given a known id, the one from `ownSuccessProps` else `<id>-success`, since Mantine's components derive it
 * differently. Both are set top-level and in `wrapperProps`, since an explicit prop replaces the theme's default and
 * Mantine gives the two a different precedence for inputs and groups.
 */
function useAriaContainerProps(
  id: string,
  overrides: InputWrapperAriaOverrides,
  ownSuccessProps: GenericObjectType | undefined,
  ownContainer: unknown,
  wrapperObject: GenericObjectType | undefined,
  before?: ReactNode,
) {
  const { describedBy, labelId } = overrides;
  const successId: string = ownSuccessProps?.id || `${id}-success`;
  const container = useCallback(
    (children: ReactNode) => (
      <InputWrapperAriaProvider overrides={labelId ? { describedBy, labelId } : { describedBy }} successId={successId}>
        {before}
        {typeof ownContainer === 'function' ? (ownContainer as InputContainer)(children) : children}
      </InputWrapperAriaProvider>
    ),
    [describedBy, labelId, successId, before, ownContainer],
  );
  return useMemo(() => {
    const successProps = { ...ownSuccessProps, id: successId };
    return {
      inputContainer: container,
      successProps,
      wrapperProps: { ...wrapperObject, inputContainer: container, successProps },
    };
  }, [container, ownSuccessProps, successId, wrapperObject]);
}

/** Renders the field's title, `hidden`, so that an element labelled by `titleId(id)` keeps an accessible name when the
 * visible label isn't rendered
 */
export function HiddenTitle({ id, label }: { id: string; label: ReactNode }) {
  return (
    <span id={titleId(id)} hidden>
      {label}
    </span>
  );
}

/**
 * A props hook that points a Mantine input's `aria-describedby` at the field's description, error and help ids.
 * Mantine's `Input` sets `aria-describedby` from the `InputWrapper` context after spreading the caller's props, so an
 * `aria-describedby` prop never reaches the DOM, and that context only knows about Mantine's own description and error
 * elements. Overriding the context from `inputContainer` is the one place the value Mantine applies can be replaced.
 * The container and `successProps` Mantine would otherwise apply come from the widget's options, else the theme's
 * `defaultProps`, with `wrapperProps` taking precedence over the top-level prop, as Mantine's inputs give it.
 *
 * @param component - The Mantine input the props are spread on, whose theme `defaultProps` supply any `inputContainer`
 * @param id - The id of the field the input belongs to
 * @param [options={}] - The widget's options, whose own `inputContainer`, if any, is still applied inside the override
 * @param [includeExamples=false] - Whether to also describe the input by the field's examples list
 * @returns - An object to spread on the props of the Mantine input, after the theme props
 */
export function useAriaDescribedByProps(
  component: AriaInputComponentName,
  id: string,
  options: GenericObjectType = {},
  includeExamples = false,
) {
  const { inputContainer, wrapperProps, successProps } = useProps<GenericObjectType>(
    themeComponentNames[component],
    {},
    { inputContainer: options.inputContainer, wrapperProps: options.wrapperProps, successProps: options.successProps },
  );
  const wrapperObject = asObject(wrapperProps);
  const fromWrapper = (name: string, prop: unknown) =>
    wrapperObject?.[name] !== undefined ? wrapperObject[name] : prop;
  return useAriaContainerProps(
    id,
    { describedBy: ariaDescribedByIds(id, includeExamples) },
    asObject(fromWrapper('successProps', successProps)),
    fromWrapper('inputContainer', inputContainer),
    wrapperObject,
  );
}

/**
 * A props hook for `Checkbox.Group` and `Radio.Group`, which render the field's label and take their group element's
 * `aria-describedby` and `aria-labelledby` from the `InputWrapper` context. Each option input is described by the
 * field's ids, as in `@rjsf/core`, so the group is left undescribed rather than having a screen reader repeat the
 * description, error and help on entering it. The group is labelled by the field's title id: the shown label has that
 * id, and a label Mantine doesn't render, because it is hidden or left out of `inputWrapperOrder`, is still rendered
 * with it, `hidden`, since a group needs an accessible name. Mantine only labels the group by a label it renders itself.
 * The container, `labelProps`, `successProps` and `inputWrapperOrder` Mantine would otherwise apply come from the
 * widget's options, then its `wrapperProps`, then the group's and `InputWrapper`'s theme `defaultProps`, as Mantine's
 * groups resolve them.
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
  const { inputContainer, wrapperProps, labelProps, successProps, inputWrapperOrder } = useProps<GenericObjectType>(
    component,
    {},
    {
      inputContainer: options.inputContainer,
      wrapperProps: options.wrapperProps,
      labelProps: options.labelProps,
      successProps: options.successProps,
      inputWrapperOrder: options.inputWrapperOrder,
    },
  );
  // A group renders a bare `Input.Wrapper`, whose own theme defaults apply beneath the group's
  const wrapperDefaults = useProps<GenericObjectType>('InputWrapper', {}, {});
  const wrapperObject = asObject(wrapperProps);
  const resolve = (name: string, prop: unknown) => prop ?? wrapperObject?.[name] ?? wrapperDefaults[name];

  const shownLabel = labelValue(label || undefined, hideLabel, false);
  const order = resolve('inputWrapperOrder', inputWrapperOrder);
  const labelRendered = !!shownLabel && (!Array.isArray(order) || order.includes('label'));
  const hiddenLabel = useMemo(
    () => (label && !labelRendered ? <HiddenTitle id={id} label={label} /> : undefined),
    [label, labelRendered, id],
  );
  const containerProps = useAriaContainerProps(
    id,
    { describedBy: undefined, labelId: label ? titleId(id) : undefined },
    asObject(resolve('successProps', successProps)),
    resolve('inputContainer', inputContainer),
    wrapperObject,
    hiddenLabel,
  );
  const optionProps = useMemo(() => ({ 'aria-describedby': ariaDescribedByIds(id) }), [id]);
  return {
    groupProps: {
      label: shownLabel,
      labelProps: { ...asObject(resolve('labelProps', labelProps)), id: titleId(id) },
      ...containerProps,
    },
    optionProps,
  };
}
