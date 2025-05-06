import { FormContextType, RJSFSchema, StrictRJSFSchema, getTemplate } from '@rjsf/utils';
import { Grid } from '@trussworks/react-uswds';

export default function ArrayField<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: any) {
  const { registry, uiSchema } = props;
  const ArrayFieldTemplate = getTemplate<'ArrayFieldTemplate', T, S, F>(
    'ArrayFieldTemplate',
    registry,
    uiSchema,
  );

  return <ArrayFieldTemplate {...props} />;
}
