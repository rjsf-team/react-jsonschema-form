import { TitleFieldProps, StrictRJSFSchema, RJSFSchema, FormContextType, getUiOptions } from '@rjsf/utils';

export default function TitleField<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: TitleFieldProps<T, S, F>
) {
  const { id, title, uiSchema } = props;
  const uiOptions = getUiOptions<T, S, F>(uiSchema);

  return (
    <div id={id} className='title-field mb-6'>
      <h2 className='text-3xl font-bold text-primary mb-2'>{uiOptions.title || title}</h2>
      <div className='divider divider-primary'></div>
    </div>
  );
}
