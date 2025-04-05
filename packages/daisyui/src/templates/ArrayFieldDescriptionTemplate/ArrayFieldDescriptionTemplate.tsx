import { FormContextType, StrictRJSFSchema, RJSFSchema, ArrayFieldDescriptionProps } from '@rjsf/utils';

const ArrayFieldDescriptionTemplate = <
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(
  props: ArrayFieldDescriptionProps<T, S, F>
) => {
  const { description } = props;
  return (
    <div>
      <p className='text-sm text-accent'>{description}</p>
    </div>
  );
};

export default ArrayFieldDescriptionTemplate;
