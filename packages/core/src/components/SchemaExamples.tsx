import { examplesId, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

export interface SchemaExamplesProps<S extends StrictRJSFSchema = RJSFSchema> {
  id: string;
  schema: S;
}

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
