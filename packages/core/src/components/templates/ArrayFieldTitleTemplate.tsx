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
  // `ArrayField` already blanks `title` where `ui:label: false` turns the heading off, and the template lays out the
  // optional data control beside it from `title` alone, so reading `ui:label` again here could drop that control
  if (!title) {
    return null;
  }
  const options = getUiOptions<T, S, F>(uiSchema, registry.globalUiOptions);
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
