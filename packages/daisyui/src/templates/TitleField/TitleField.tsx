import { TitleFieldProps, StrictRJSFSchema, RJSFSchema, FormContextType, getUiOptions } from '@rjsf/utils';

export default function TitleField<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: TitleFieldProps<T, S, F>
) {
  const { id, title, uiSchema } = props;
  const uiOptions = getUiOptions<T, S, F>(uiSchema);

  return (
    <div id={id} className='title-field mb-4'>
      <h3 className='text-4xl font-bold'>{uiOptions.title || title}</h3>
    </div>
  );
}
