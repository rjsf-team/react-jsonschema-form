import type {
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  UIOptionsType,
  VisibleErrorsProps,
  WidgetProps,
} from '@rjsf/utils';
import { descriptionId, getTemplate, getVisibleErrors } from '@rjsf/utils';

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
