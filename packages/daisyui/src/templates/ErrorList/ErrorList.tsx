import { ErrorListProps, StrictRJSFSchema, RJSFSchema, FormContextType } from '@rjsf/utils';

export default function ErrorList<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: ErrorListProps<T, S, F>
) {
  const { errors } = props;
  console.log('DaisyUI ErrorList');
  return (
    <div className='error-list'>
      <ul className='list-disc list-inside text-red-600'>
        {errors.map((error, index) => (
          <li key={index}>{error.stack}</li>
        ))}
      </ul>
    </div>
  );
}
