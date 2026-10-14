import enumOptionsIsSelected from './enumOptionsIsSelected.ts';
import getUiOptions from './getUiOptions.ts';
import { descriptionId, selectedOptionDescriptionId } from './idGenerators.ts';
import type { SelectedOptionDescriptionProps } from './SelectedOptionDescription.tsx';
import type { FormContextType, RJSFSchema, StrictRJSFSchema } from './types.ts';

/** Return the description a single-select widget shows for the option it has selected, along with that option's
 * schema and the id it renders under, or undefined when it shows none: for a `multiple` select, for a label `ui:label`
 * turns off, when nothing is selected and when the selected option has no description. Under its field's plan,
 * `hideLabel` says only that the widget doesn't draw the label, which the template may, so it is read only without one;
 * the plan's own label says instead whether `ui:label: false`, resolved through the fields above, hides it, and the
 * description takes `selectedOptionDescriptionId(id)`, since the field's own description may render under
 * `descriptionId(id)`. It is the one place that decides whether that element exists and its id, for
 * `SelectedOptionDescription`, which renders it, and for `widgetAriaProps()`, which references it.
 *
 * @param props - The widget's props, of which `id`, `multiple`, `hideLabel`, `presentation`, `options`, `registry`,
 *   `uiSchema` and `value` are read
 * @returns - The `description` of the selected option, its `schema` and the `id` it renders under, or undefined when no
 *   description is shown
 */
export default function getSelectedOptionDescription<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({
  id,
  hideLabel,
  multiple,
  options,
  registry,
  uiSchema,
  value,
  presentation,
}: SelectedOptionDescriptionProps<T, S, F>) {
  if (multiple || (!presentation && hideLabel)) {
    return undefined;
  }
  // A select has a control to name, so a label with text to show is planned `none` only by `ui:label: false`, which
  // hides every description of the field with it
  if (presentation?.label.by === 'none' && presentation.label.text) {
    return undefined;
  }

  const { label = true } = getUiOptions<T, S, F>(uiSchema, registry.globalUiOptions);
  if (!label) {
    return undefined;
  }

  const option = options.enumOptions?.find(({ value: enumValue }) => enumOptionsIsSelected(enumValue, value, false));
  const schema = option?.schema;
  return schema?.description
    ? {
        description: schema.description,
        schema,
        id: presentation ? selectedOptionDescriptionId(id) : descriptionId(id),
      }
    : undefined;
}
