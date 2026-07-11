import enumOptionsIsSelected from './enumOptionsIsSelected';
import getTemplate from './getTemplate';
import { descriptionId } from './idGenerators';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from './types';

type SelectedOptionDescriptionProps<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
> = Pick<WidgetProps<T, S, F>, 'id' | 'multiple' | 'options' | 'registry' | 'uiSchema' | 'value'>;

/** Renders the description associated with the selected oneOf or anyOf option in a single-select widget. */
export default function SelectedOptionDescription<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({ id, multiple, options, registry, uiSchema, value }: SelectedOptionDescriptionProps<T, S, F>) {
  if (multiple) {
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
