import type { ArrayFieldDescriptionProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { descriptionId, getTemplates, getUiOptions } from '@rjsf/utils';

/** The `ArrayFieldDescriptionTemplate` component renders a `DescriptionFieldTemplate` with an `id` derived from
 * the `id`, or the one the array's plan gives its description.
 *
 * @param props - The `ArrayFieldDescriptionProps` for the component
 */
export default function ArrayFieldDescriptionTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: ArrayFieldDescriptionProps<T, S, F>) {
  const { id, description, registry, schema, uiSchema, presentation } = props;
  const options = getUiOptions<T, S, F>(uiSchema, registry.globalUiOptions);
  // The plan has already decided whether `ui:label` hides the description
  const { label: displayLabel = true } = options;
  if (!description || (!presentation && !displayLabel)) {
    return null;
  }
  const { DescriptionFieldTemplate } = getTemplates<T, S, F>(registry, options);
  return (
    <DescriptionFieldTemplate
      id={presentation?.description.id ?? descriptionId(id)}
      description={description}
      schema={schema}
      uiSchema={uiSchema}
      registry={registry}
    />
  );
}
