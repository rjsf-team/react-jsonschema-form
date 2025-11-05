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
  const { fieldPathId, help, registry, uiSchema } = props;
  if (!help) {
    return null;
  }
  const id = helpId(fieldPathId);
  const helpContent = <RichHelp help={help} registry={registry} uiSchema={uiSchema} />;
  if (typeof help === 'string') {
    return (
      <p id={id} className='help-block'>
        {helpContent}
      </p>
    );
  }
  return (
    <div id={id} className='help-block'>
      {helpContent}
    </div>
  );
}
