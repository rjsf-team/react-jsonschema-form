import { FormContextType, MultiSchemaFieldTemplateProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { Fieldset } from 'primereact/fieldset';

export default function MultiSchemaFieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: MultiSchemaFieldTemplateProps<T, S, F>) {
  const { selector, optionSchemaField } = props;

  return (
    <Fieldset>
      <div style={{ marginBottom: '1rem' }}>{selector}</div>
      {optionSchemaField}
    </Fieldset>
  );
}
