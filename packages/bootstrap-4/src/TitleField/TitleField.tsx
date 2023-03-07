import { FormContextType, getUiOptions, RJSFSchema, StrictRJSFSchema, TitleFieldProps } from '@rjsf/utils';

export default function TitleField<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  id,
  title,
  uiSchema,
}: TitleFieldProps<T, S, F>) {
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  return (
    <div id={id} className='my-1'>
      <h5>{uiOptions.title || title}</h5>
      <hr className='border-0 bg-secondary' style={{ height: '1px' }} />
    </div>
  );
}
