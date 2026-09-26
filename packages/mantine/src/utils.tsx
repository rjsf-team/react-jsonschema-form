import type { ReactNode } from 'react';
import { use, useCallback, useMemo } from 'react';
import type { MantineTheme } from '@mantine/core';
import { InputWrapperContext, useMantineTheme, useProps } from '@mantine/core';
import type {
  FormContextType,
  GenericObjectType,
  RJSFSchema,
  StrictRJSFSchema,
  UIOptionsType,
  VisibleErrorsProps,
  WidgetProps,
} from '@rjsf/utils';
import { ariaDescribedByIds, descriptionId, getTemplate, getVisibleErrors, labelValue, titleId } from '@rjsf/utils';

const uiOptionsKeys: (keyof UIOptionsType)[] = [
  'emptyValue',
  'classNames',
  'style',
  'title',
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
    if (!uiOptionsKeys.includes(key as keyof UIOptionsType)) {
      result[key] = options[key];
    }
  }
  return result as Omit<T, keyof UIOptionsType>;
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
  CheckboxGroup: ['CheckboxGroup'],
  RadioGroup: ['RadioGroup'],
} satisfies Record<string, string[]>;

type GroupComponentName = 'CheckboxGroup' | 'RadioGroup';

/** The name of a Mantine input or group, as its `defaultProps` are keyed in the theme's `components` */
export type AriaComponentName = keyof typeof themeComponentNames;
export type AriaInputComponentName = Exclude<AriaComponentName, GroupComponentName>;

interface InputWrapperAriaOverrides {
  describedBy?: string;
  labelId?: string;
}

function InputWrapperAriaProvider({
  overrides,
  children,
}: {
  overrides: InputWrapperAriaOverrides;
  children: ReactNode;
}) {
  const inputWrapperContext = use(InputWrapperContext);
  return <InputWrapperContext value={{ ...inputWrapperContext, ...overrides }}>{children}</InputWrapperContext>;
}

/** The `defaultProps` a Mantine theme sets for one component, resolved as Mantine's `useProps` resolves them */
function themeDefaultProps(theme: MantineTheme, component: string): GenericObjectType {
  const payload = theme.components[component]?.defaultProps;
  return (typeof payload === 'function' ? payload(theme) : payload) ?? {};
}

/** Builds the `inputContainer` that overrides the aria ids Mantine reads from the `InputWrapper` context, wrapping the
 * container Mantine would otherwise render: the one from the widget's options, else from the theme's `defaultProps`.
 * Inputs give `wrapperProps.inputContainer` precedence over `inputContainer` and groups the reverse, as Mantine does.
 * The override is set in both places, since an explicit prop replaces the theme's default. `before` is rendered ahead
 * of the input, inside the wrapper. Also returns the `labelProps` Mantine would otherwise apply, for a group to extend.
 */
function useAriaContainerProps(
  component: AriaComponentName,
  options: GenericObjectType,
  overrides: InputWrapperAriaOverrides,
  before?: ReactNode,
) {
  const theme = useMantineTheme();
  const { inputContainer, wrapperProps, labelProps } = useProps<GenericObjectType>(
    themeComponentNames[component],
    {},
    {
      inputContainer: options.inputContainer,
      wrapperProps: options.wrapperProps,
      labelProps: options.labelProps,
    },
  );
  const isGroup = component === 'CheckboxGroup' || component === 'RadioGroup';
  // A group renders a bare `Input.Wrapper`, whose own theme defaults apply beneath the group's; an input's already
  // include them
  const wrapperDefaults = isGroup ? themeDefaultProps(theme, 'InputWrapper') : {};
  const wrapperObject = typeof wrapperProps === 'object' && wrapperProps !== null ? wrapperProps : undefined;
  const wrapperContainer = wrapperObject?.inputContainer;
  let ownContainer: unknown;
  if (isGroup) {
    ownContainer = inputContainer ?? wrapperContainer;
  } else {
    ownContainer = wrapperObject && 'inputContainer' in wrapperObject ? wrapperContainer : inputContainer;
  }
  ownContainer ??= wrapperDefaults.inputContainer;

  const { describedBy, labelId } = overrides;
  const hasLabelId = 'labelId' in overrides;
  const container = useCallback(
    (children: ReactNode) => (
      <InputWrapperAriaProvider overrides={hasLabelId ? { describedBy, labelId } : { describedBy }}>
        {before}
        {typeof ownContainer === 'function' ? (ownContainer as InputContainer)(children) : children}
      </InputWrapperAriaProvider>
    ),
    [describedBy, labelId, hasLabelId, before, ownContainer],
  );
  const containerProps = useMemo(
    () => ({ inputContainer: container, wrapperProps: { ...wrapperObject, inputContainer: container } }),
    [container, wrapperObject],
  );
  const ownLabelProps: unknown = labelProps ?? wrapperDefaults.labelProps;
  return { containerProps, ownLabelProps };
}

/**
 * A props hook that points a Mantine input's `aria-describedby` at the field's description, error and help ids.
 * Mantine's `Input` sets `aria-describedby` from the `InputWrapper` context after spreading the caller's props, so an
 * `aria-describedby` prop never reaches the DOM, and that context only knows about Mantine's own description and error
 * elements. Overriding the context from `inputContainer` is the one place the value Mantine applies can be replaced.
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
  return useAriaContainerProps(component, options, { describedBy: ariaDescribedByIds(id, includeExamples) })
    .containerProps;
}

/**
 * A props hook for `Checkbox.Group` and `Radio.Group`, which render the field's label and take their group element's
 * `aria-describedby` and `aria-labelledby` from the `InputWrapper` context. Each option input is described by the
 * field's ids, as in `@rjsf/core`, so the group is left undescribed rather than having a screen reader repeat the
 * description, error and help on entering it. The group is labelled by the field's title id: the shown label has that
 * id, and a hidden label is still rendered with it, `hidden`, since a group needs an accessible name. Mantine would
 * otherwise point `aria-labelledby` at its own label id even when it renders no label
 * (https://github.com/mantinedev/mantine/issues/9217).
 *
 * @param component - The Mantine group the props are spread on, whose theme `defaultProps` supply any `inputContainer`
 * @param widgetProps - The props of the widget, from which the label, its visibility and the options are derived
 * @returns - An object to spread on the props of the Mantine group, after the theme props
 */
export function useGroupAriaProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(component: GroupComponentName, { id, label, hideLabel, options }: WidgetProps<T, S, F>) {
  const shownLabel = labelValue(label || undefined, hideLabel, false);
  const hiddenLabel = useMemo(
    () =>
      !shownLabel && label ? (
        <span id={titleId(id)} hidden>
          {label}
        </span>
      ) : undefined,
    [shownLabel, label, id],
  );
  const { containerProps, ownLabelProps } = useAriaContainerProps(
    component,
    options,
    { describedBy: undefined, labelId: label ? titleId(id) : undefined },
    hiddenLabel,
  );
  return {
    label: shownLabel,
    labelProps: { ...(typeof ownLabelProps === 'object' ? ownLabelProps : {}), id: titleId(id) },
    ...containerProps,
  };
}
