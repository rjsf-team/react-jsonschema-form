import { DescriptionFieldProps, StrictRJSFSchema, RJSFSchema, FormContextType } from '@rjsf/utils';

export default function DescriptionField<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: DescriptionFieldProps<T, S, F>) {
  const { id, description } = props;
  console.log('DaisyUI DescriptionField');
  return (
    <div id={id} className='description-field my-4'>
      <p className='text-sm text-gray-600'>{description}</p>
    </div>
  );
}
