import { FormContextType, RJSFSchema, StrictRJSFSchema, getTemplate } from '@rjsf/utils';
import { FormGroup } from '@trussworks/react-uswds';

export default function BooleanField<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: any) {
  const { registry, uiSchema } = props;
  const FieldTemplate = getTemplate<'FieldTemplate', T, S, F>('FieldTemplate', registry, uiSchema);

  return <FieldTemplate {...props} />;
}
