import { examplesId, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

export interface SchemaExamplesProps<S extends StrictRJSFSchema = RJSFSchema> {
  /** The id of the input element this datalist is for */
  id: string;
  /** The JSON schema object containing examples and default value */
  schema: S;
}

/** Renders a `<datalist>` element containing options from schema examples and default value.
 * Normalizes types to prevent duplicate keys when examples and default have different types.
 * For example, if examples are strings ["5432"] and default is number 5432, the default
 * will not be added as a duplicate option.
 *
 * @param props - The `SchemaExamplesProps` for this component
 */
export default function SchemaExamples<S extends StrictRJSFSchema = RJSFSchema>(props: SchemaExamplesProps<S>) {
  const { id, schema } = props;
  const { examples, default: schemaDefault } = schema;
  if (!Array.isArray(examples)) {
    return null;
  }
  return (
    <datalist key={`datalist_${id}`} id={examplesId(id)}>
      {(examples as string[])
        .concat(
          schemaDefault !== undefined && !examples.map(String).includes(String(schemaDefault))
            ? ([schemaDefault] as string[])
            : [],
        )
        .map((example: any) => {
          return <option key={String(example)} value={example} />;
        })}
    </datalist>
  );
}
