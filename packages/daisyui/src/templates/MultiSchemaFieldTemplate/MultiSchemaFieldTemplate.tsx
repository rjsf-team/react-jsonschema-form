import { FormContextType, MultiSchemaFieldTemplateProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

export default function MultiSchemaFieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: MultiSchemaFieldTemplateProps<T, S, F>) {
  const { optionSchemaField, selector } = props;
  return (
    <div className='p-4 border rounded-sm shadow-sm'>
      <div className='mb-4'>{selector}</div>
      {optionSchemaField}
    </div>
  );
}
