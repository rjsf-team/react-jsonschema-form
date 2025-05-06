import { FormContextType, RJSFSchema, StrictRJSFSchema, getTemplate } from '@rjsf/utils';
import { Grid } from '@trussworks/react-uswds';

export default function ObjectField<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: any) {
  const { registry, uiSchema } = props;
  const ObjectFieldTemplate = getTemplate<'ObjectFieldTemplate', T, S, F>(
    'ObjectFieldTemplate',
    registry,
    uiSchema,
  );

  return <ObjectFieldTemplate {...props} />;
}
