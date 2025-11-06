import { helpId, FieldHelpProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import RichHelp from '../RichHelp';

/** The `FieldHelpTemplate` component renders any help desired for a field
 *
 * @param props - The `FieldHelpProps` to be rendered
 */
export default function FieldHelpTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: FieldHelpProps<T, S, F>) {
  const { fieldPathId, help, uiSchema = {}, registry } = props;
  if (!help) {
    return null;
  }
  if (typeof help === 'string') {
    return (
      <p id={helpId(fieldPathId)} className='help-block'>
        {help}
      </p>
    );
  }

  return (
    <div id={helpId(fieldPathId)} className='help-block'>
      <RichHelp help={help} registry={registry} uiSchema={uiSchema} />
    </div>
  );
}
