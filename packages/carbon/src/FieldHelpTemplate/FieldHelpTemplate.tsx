import { helpId, FieldHelpProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

/** Implement `FieldHelpTemplate`
 */
export default function FieldHelpTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: FieldHelpProps<T, S, F>) {
  const { idSchema, help } = props;
  if (!help) {
    return null;
  }
  const id = helpId<T>(idSchema);
  return (
    <div id={id} className='help-block cds--form__helper-text'>
      {help}
    </div>
  );
}
