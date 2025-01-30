import { DaisyProps } from '../types/DaisyProps';
import { IconButtonProps, StrictRJSFSchema, RJSFSchema, FormContextType } from '@rjsf/utils';

export default function AddButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F> & DaisyProps
) {
  return (
    <button className='btn btn-primary' {...props}>
      <span className='icon'>+</span> Add Item
    </button>
  );
}
