import { FormContextType, StrictRJSFSchema, RJSFSchema, ArrayFieldDescriptionProps } from '@rjsf/utils';

const ArrayFieldDescriptionTemplate = <
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(
  props: ArrayFieldDescriptionProps<T, S, F>
) => {
  console.log('DaisyUI ArrayFieldDescriptionTemplate');
  props;
  return (
    <div>
      <h1>ArrayFieldDescriptionTemplate</h1>
    </div>
  );
};

export default ArrayFieldDescriptionTemplate;
