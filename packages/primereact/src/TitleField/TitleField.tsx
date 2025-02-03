import { Divider } from 'primereact/divider';
import { FormContextType, getUiOptions, RJSFSchema, StrictRJSFSchema, TitleFieldProps } from '@rjsf/utils';

export default function TitleField<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  id,
  title,
  uiSchema,
  required,
}: TitleFieldProps<T, S, F>) {
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  return (
    <div id={id}>
      <h5 style={{ margin: 0, fontSize: id === 'root__title' ? '1.5rem' : '1.2rem' }}>
        {uiOptions.title || title} {required ? '*' : ''}
      </h5>
      <Divider pt={{ root: { style: { marginTop: '0.5rem' } } }} />
    </div>
  );
}
