import { FormContextType, RJSFSchema, StrictRJSFSchema, getTemplate } from '@rjsf/utils';

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
