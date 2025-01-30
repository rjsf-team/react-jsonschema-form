import { FieldHelpProps, StrictRJSFSchema, RJSFSchema, FormContextType } from '@rjsf/utils';

export default function FieldHelpTemplate<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: FieldHelpProps<T, S, F>
) {
  const { help } = props;
  return (
    <div className="field-help-template text-gray-500 text-sm">
      <p>{help}</p>
    </div>
  );
}
