import { FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { Select } from '@trussworks/react-uswds';

export default function OneOfField<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(props: any) {
  // Use same implementation as AnyOfField
  const { schema, idSchema, options } = props;
  return <Select id={idSchema.$id} name={idSchema.$id} options={options} />;
}
