import { DaisyProps } from '../types/DaisyProps';
import { IconButtonProps, StrictRJSFSchema, RJSFSchema, FormContextType } from '@rjsf/utils';

export default function IconButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F> & DaisyProps
) {
  const { icon, title, ...otherProps } = props;
  return (
    <button className='btn btn-icon' title={title} {...otherProps}>
      <span className={`icon-${icon}`} />
    </button>
  );
}
