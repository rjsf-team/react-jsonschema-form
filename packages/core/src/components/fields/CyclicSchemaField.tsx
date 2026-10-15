import { use, useMemo, useState, useSyncExternalStore } from 'react';
import type { FieldProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { expandRefCycle, getTemplates, getUiOptions } from '@rjsf/utils';

import FormDataContext from '../FormDataContext.ts';
import RawFormDataContext, { useReadsFormData } from './RawFormDataContext.ts';

const noSubscription = () => () => undefined;

/** The `CyclicSchemaField` component renders a field `retrieveSchema()` collapsed as a `$ref` cycle (marked with
 * `RJSF_REF_CYCLE_KEY`): an Expand button until the field is expanded, and then the field resolved one level further.
 * Which fields are expanded is the form's state, by path, so an expansion outlives the field's components and follows
 * the array moves the form is told of; outside a `Form` it is this component's own.
 *
 * @param props - The `FieldProps` for this template
 */
export default function CyclicSchemaField<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: FieldProps<T, S, F>) {
  const uiState = use(FormDataContext)?.uiState;
  const [expandedHere, setExpandedHere] = useState(false);
  const readsFormData = useReadsFormData(CyclicSchemaField);
  const { name, registry, schema, uiSchema, id, fieldPath } = props;
  const readExpanded = () => uiState?.isExpanded(fieldPath) ?? false;
  const expandedInForm = useSyncExternalStore(uiState?.subscribe ?? noSubscription, readExpanded, readExpanded);
  const { globalUiOptions, fields, schemaUtils } = registry;
  const rootSchema = schemaUtils.getRootSchema();
  const expandedSchema = useMemo(() => expandRefCycle<S>(schema, rootSchema), [schema, rootSchema]);

  const uiOptions = getUiOptions<T, S, F>(uiSchema, globalUiOptions);
  const { CyclicSchemaExpandTemplate } = getTemplates<T, S, F>(registry, uiOptions);
  if (!(uiState ? expandedInForm : expandedHere)) {
    return (
      <CyclicSchemaExpandTemplate
        registry={registry}
        schema={schema}
        uiSchema={uiSchema}
        name={name}
        id={id}
        onExpand={() => (uiState ? uiState.expand(fieldPath) : setExpandedHere(true))}
      />
    );
  }
  const { SchemaField } = fields;
  return (
    <RawFormDataContext value={readsFormData ? SchemaField : undefined}>
      <SchemaField {...props} schema={expandedSchema} />
    </RawFormDataContext>
  );
}
