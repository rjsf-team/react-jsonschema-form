import getSelectedOptionDescription from './getSelectedOptionDescription.ts';
import getTemplates from './getTemplates.ts';
import { descriptionId } from './idGenerators.ts';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from './types.ts';

export type SelectedOptionDescriptionProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = Pick<WidgetProps<T, S, F>, 'id' | 'multiple' | 'options' | 'registry' | 'uiSchema' | 'value' | 'hideLabel'>;

/** Renders the description associated with the selected oneOf or anyOf option in a single-select widget. */
export default function SelectedOptionDescription<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: SelectedOptionDescriptionProps<T, S, F>) {
  const selected = getSelectedOptionDescription<T, S, F>(props);
  if (!selected) {
    return null;
  }

  const { id, options, registry, uiSchema } = props;
  const { DescriptionFieldTemplate } = getTemplates<T, S, F>(registry, options);
  return (
    <DescriptionFieldTemplate
      id={descriptionId(id)}
      description={selected.description}
      schema={selected.schema}
      uiSchema={uiSchema}
      registry={registry}
    />
  );
}
