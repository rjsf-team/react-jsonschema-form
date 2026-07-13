import enumOptionsIsSelected from './enumOptionsIsSelected';
import getTemplate from './getTemplate';
import getUiOptions from './getUiOptions';
import { descriptionId } from './idGenerators';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from './types';

export type SelectedOptionDescriptionProps<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
> = Pick<WidgetProps<T, S, F>, 'id' | 'multiple' | 'options' | 'registry' | 'uiSchema' | 'value' | 'hideLabel'>;

/** Renders the description associated with the selected oneOf or anyOf option in a single-select widget. */
export default function SelectedOptionDescription<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({ hideLabel, id, multiple, options, registry, uiSchema, value }: SelectedOptionDescriptionProps<T, S, F>) {
  if (multiple || hideLabel) {
    return null;
  }

  const { label = true } = getUiOptions<T, S, F>(uiSchema, registry.globalUiOptions);
  if (!label) {
    return null;
  }

  const option = options.enumOptions?.find(({ value: enumValue }) => enumOptionsIsSelected(enumValue, value));
  const description = option?.schema?.description;
  if (!description) {
    return null;
  }

  const DescriptionFieldTemplate = getTemplate<'DescriptionFieldTemplate', T, S, F>(
    'DescriptionFieldTemplate',
    registry,
    options,
  );
  return (
    <DescriptionFieldTemplate
      id={descriptionId(id)}
      description={description}
      schema={option.schema!}
      uiSchema={uiSchema}
      registry={registry}
    />
  );
}
