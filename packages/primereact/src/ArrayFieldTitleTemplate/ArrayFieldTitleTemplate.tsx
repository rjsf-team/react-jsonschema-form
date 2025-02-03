import { ArrayFieldTitleProps, FormContextType, getUiOptions, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

export default function ArrayFieldTitleTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>({ title, uiSchema, required }: ArrayFieldTitleProps<T, S, F>) {
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  return (
    <h5 style={{ margin: 0, fontSize: '1.5rem', marginBottom: '0.2rem' }}>
      {uiOptions.title || title} {required ? '*' : ''}
    </h5>
  );
}
