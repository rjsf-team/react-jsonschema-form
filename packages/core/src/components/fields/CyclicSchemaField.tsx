import { useState } from 'react';
import type { FieldProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { getTemplate, getUiOptions, RJSF_REF_CYCLE_KEY } from '@rjsf/utils';

/** The `CyclicSchemaField` component is used to render a field in the schema that is marked with RJSF_REF_CYCLE_KEY ===
 * true
 *
 * @param props - The `FieldProps` for this template
 */
export default function CyclicSchemaField<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: FieldProps<T, S, F>) {
  const [expanded, setExpanded] = useState(false);
  const { name, registry, schema, uiSchema, fieldPathId } = props;
  const { globalUiOptions } = registry;

  const uiOptions = getUiOptions<T, S, F>(uiSchema, globalUiOptions);
  const CyclicSchemaExpandTemplate = getTemplate<'CyclicSchemaExpandTemplate', T, S, F>(
    'CyclicSchemaExpandTemplate',
    registry,
    uiOptions,
  );
  if (!expanded) {
    return (
      <CyclicSchemaExpandTemplate
        registry={registry}
        schema={schema}
        uiSchema={uiSchema}
        name={name}
        fieldPathId={fieldPathId}
        onExpand={() => setExpanded(true)}
      />
    );
  }
  const { fields } = registry;
  const { SchemaField } = fields;
  return <SchemaField {...props} schema={{ ...schema, [RJSF_REF_CYCLE_KEY]: false }} />;
}
