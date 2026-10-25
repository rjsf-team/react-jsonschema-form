import { useMemo, useSyncExternalStore } from 'react';
import type { FieldProps, FormContextType, RJSFSchema, StrictRJSFSchema, TemplateWarnSource } from '@rjsf/utils';
import { expandRefCycle, getTemplates, getUiOptions } from '@rjsf/utils';

import useUiState from '../../hooks/useUiState.ts';

/** The `CyclicSchemaField` component renders a field `retrieveSchema()` collapsed as a `$ref` cycle (marked with
 * `RJSF_REF_CYCLE_KEY`): an Expand button until the field is expanded, and then the field resolved one level further.
 * Which fields are expanded is the form's state, by path, so an expansion outlives the field's components and follows
 * the moves the form is told of, of array items and of additional properties renamed or removed; outside a `Form` it is the outermost `SchemaField`'s, see `useUiState()`.
 *
 * @param props - The `FieldProps` for this template, plus the `warnSource` `SchemaField` hands down so an invalid
 * `ui:CyclicSchemaExpandTemplate` override warns naming the field's entry
 */
export default function CyclicSchemaField<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: FieldProps<T, S, F> & { warnSource?: TemplateWarnSource }) {
  const { uiState } = useUiState();
  const { name, registry, schema, uiSchema, id, fieldPath, warnSource } = props;
  const readExpanded = () => uiState.isExpanded(fieldPath);
  const expanded = useSyncExternalStore(uiState.subscribe, readExpanded, readExpanded);
  const { globalUiOptions, fields, schemaUtils } = registry;
  const rootSchema = schemaUtils.getRootSchema();
  const expandedSchema = useMemo(
    () => (expanded ? expandRefCycle<S>(schema, rootSchema) : undefined),
    [expanded, schema, rootSchema],
  );

  const uiOptions = getUiOptions<T, S, F>(uiSchema, globalUiOptions);
  const { CyclicSchemaExpandTemplate } = getTemplates<T, S, F>(registry, uiOptions, warnSource);
  if (expandedSchema === undefined) {
    return (
      <CyclicSchemaExpandTemplate
        registry={registry}
        schema={schema}
        uiSchema={uiSchema}
        name={name}
        id={id}
        onExpand={() => uiState.expand(fieldPath)}
      />
    );
  }
  const { SchemaField } = fields;
  return <SchemaField {...props} schema={expandedSchema} />;
}
