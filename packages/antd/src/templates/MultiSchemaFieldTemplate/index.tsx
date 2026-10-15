import type { FormContextType, MultiSchemaFieldTemplateProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

export default function MultiSchemaFieldTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: MultiSchemaFieldTemplateProps<T, S, F>) {
  const { optionSchemaField, selector } = props;

  return (
    <div>
      {/* No row is laid out for a selector the field doesn't render, as while an optional field has no data (#5401) */}
      {selector ? <div>{selector}</div> : null}
      {optionSchemaField}
    </div>
  );
}
