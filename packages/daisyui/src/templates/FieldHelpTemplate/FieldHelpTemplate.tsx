import { FieldHelpProps, StrictRJSFSchema, RJSFSchema, FormContextType } from '@rjsf/utils';
import { RichHelp } from '@rjsf/core';

/** The `FieldHelpTemplate` component renders help text for a specific form field
 * with DaisyUI styling. It displays the help text in a subtle gray color and smaller size
 * to distinguish it from the main field content.
 *
 * Help text provides additional guidance to users about how to complete a field
 * or explains the expected input format.
 *
 * @param props - The `FieldHelpProps` for the component
 */
export default function FieldHelpTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: FieldHelpProps<T, S, F>) {
  const { help, registry, uiSchema } = props;
  if (!help) {
    return null;
  }
  return (
    <div className='rjsf-field-help-template text-gray-500 text-sm'>
      <div>
        <RichHelp help={help} registry={registry} uiSchema={uiSchema} />
      </div>
    </div>
  );
}
