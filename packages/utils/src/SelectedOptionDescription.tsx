import getSelectedOptionDescription from './getSelectedOptionDescription.ts';
import getTemplates from './getTemplates.ts';
import hasWidgetErrors from './hasWidgetErrors.ts';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from './types.ts';

export type SelectedOptionDescriptionProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = Pick<WidgetProps<T, S, F>, 'id' | 'multiple' | 'options' | 'registry' | 'uiSchema' | 'value' | 'presentation'> & {
  /** Whether the select leaves its label off, `!widgetDrawsLabel()` of its props, read only without a plan */
  hideLabel?: boolean;
};

/** Renders the description associated with the selected oneOf or anyOf option in a single-select widget. Give it the
 * same `presentation` and `hideLabel` as `widgetAriaProps()`, which describes the select by the element this renders
 */
export default function SelectedOptionDescription<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: SelectedOptionDescriptionProps<T, S, F>) {
  const selected = getSelectedOptionDescription<T, S, F>(props);
  if (!selected) {
    return null;
  }

  const { options, registry, uiSchema, presentation } = props;
  const { DescriptionFieldTemplate } = getTemplates<T, S, F>(registry, options);
  return (
    <DescriptionFieldTemplate
      id={selected.id}
      description={selected.description}
      // The field's own error state, as the field's other parts have it, rather than its control's
      hasErrors={presentation ? presentation.errors.own : hasWidgetErrors<T, S, F>(props)}
      schema={selected.schema}
      uiSchema={uiSchema}
      registry={registry}
    />
  );
}
