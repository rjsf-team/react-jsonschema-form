import type { FallbackFieldTemplateProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { getTemplates } from '@rjsf/utils';

/**
 * The `FallbackFieldTemplate` is used to render a field when no field matches. The field renders a type selector and
 * the schema field for the form data.
 */
export default function FallbackFieldTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: FallbackFieldTemplateProps<T, S, F>) {
  const { schema, registry, typeSelector, schemaField } = props;

  // By default, use the MultiSchemaFieldTemplate, which handles the same basic requirements.
  const { MultiSchemaFieldTemplate } = getTemplates<T, S, F>(registry);

  return (
    <MultiSchemaFieldTemplate
      selector={typeSelector}
      optionSchemaField={schemaField}
      schema={schema}
      registry={registry}
    />
  );
}
