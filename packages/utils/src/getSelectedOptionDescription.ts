import enumOptionsIsSelected from './enumOptionsIsSelected.ts';
import getUiOptions from './getUiOptions.ts';
import type { SelectedOptionDescriptionProps } from './SelectedOptionDescription.tsx';
import type { FormContextType, RJSFSchema, StrictRJSFSchema } from './types.ts';

/** Return the description a single-select widget shows for the option it has selected, along with that option's
 * schema, or undefined when it shows none: for a `multiple` select, for a hidden label, when nothing is selected and
 * when the selected option has no description. It is the one place that decides whether the element with
 * `descriptionId(id)` exists, for `SelectedOptionDescription`, which renders it, and for `widgetAriaProps()`, which
 * references it.
 *
 * @param props - The widget's props, of which `multiple`, `hideLabel`, `options`, `registry`, `uiSchema` and `value`
 *   are read
 * @returns - The `description` of the selected option and its `schema`, or undefined when no description is shown
 */
export default function getSelectedOptionDescription<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({ hideLabel, multiple, options, registry, uiSchema, value }: Omit<SelectedOptionDescriptionProps<T, S, F>, 'id'>) {
  if (multiple || hideLabel) {
    return undefined;
  }

  const { label = true } = getUiOptions<T, S, F>(uiSchema, registry.globalUiOptions);
  if (!label) {
    return undefined;
  }

  const option = options.enumOptions?.find(({ value: enumValue }) => enumOptionsIsSelected(enumValue, value, false));
  const schema = option?.schema;
  return schema?.description ? { description: schema.description, schema } : undefined;
}
