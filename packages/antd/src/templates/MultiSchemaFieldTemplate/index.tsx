import { FormContextType, MultiSchemaFieldTemplateProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

export default function MultiSchemaFieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: MultiSchemaFieldTemplateProps<T, S, F>) {
  const { optionSchemaField, selector } = props;

  return (
    <div>
      <div>{selector}</div>
      {optionSchemaField}
    </div>
  );
}
