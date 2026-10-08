import type { ArrayFieldTitleProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { getTemplates, getUiOptions, titleId } from '@rjsf/utils';

/** The `ArrayFieldTitleTemplate` component renders a `TitleFieldTemplate` with an `id` derived from
 * the `id`.
 *
 * @param props - The `ArrayFieldTitleProps` for the component
 */
export default function ArrayFieldTitleTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: ArrayFieldTitleProps<T, S, F>) {
  const { id, title, schema, uiSchema, required, registry, optionalDataControl } = props;
  const options = getUiOptions<T, S, F>(uiSchema, registry.globalUiOptions);
  const { label: displayLabel = true } = options;
  if (!title || !displayLabel) {
    return null;
  }
  const { TitleFieldTemplate } = getTemplates<T, S, F>(registry, options);
  return (
    <TitleFieldTemplate
      id={titleId(id)}
      title={title}
      required={required}
      schema={schema}
      uiSchema={uiSchema}
      registry={registry}
      optionalDataControl={optionalDataControl}
    />
  );
}
