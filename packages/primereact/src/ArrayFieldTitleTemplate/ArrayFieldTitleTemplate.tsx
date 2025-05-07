import {
  ArrayFieldTitleProps,
  FormContextType,
  getUiOptions,
  RJSFSchema,
  StrictRJSFSchema,
  titleId,
} from '@rjsf/utils';

/** The `ArrayFieldTitleTemplate` component renders a header for the array.
 *
 * @param props - The `ArrayFieldTitleProps` for the component
 */
export default function ArrayFieldTitleTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({ title, uiSchema, required, idSchema }: ArrayFieldTitleProps<T, S, F>) {
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  return (
    <h5 id={titleId(idSchema)} style={{ margin: 0, fontSize: '1.5rem', marginBottom: '0.2rem' }}>
      {uiOptions.title || title} {required ? '*' : ''}
    </h5>
  );
}
