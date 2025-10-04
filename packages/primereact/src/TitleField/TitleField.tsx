import { Divider } from 'primereact/divider';
import { FormContextType, getUiOptions, RJSFSchema, StrictRJSFSchema, TitleFieldProps, titleId } from '@rjsf/utils';

/** The `TitleField` is the template to use to render the title of a field
 *
 * @param props - The `TitleFieldProps` for this component
 */
export default function TitleField<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  id,
  title,
  uiSchema,
  required,
  optionalDataControl,
}: TitleFieldProps<T, S, F>) {
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  let heading = (
    <h5 style={{ margin: 0, fontSize: id === titleId('root') ? '1.5rem' : '1.2rem' }}>
      {uiOptions.title || title} {required ? '*' : ''}
    </h5>
  );
  if (optionalDataControl) {
    heading = (
      <div style={{ display: 'flex' }}>
        <div style={{ flexGrow: 1 }}>{heading}</div>
        <div style={{ marginLeft: '-5px' }}>{optionalDataControl}</div>
      </div>
    );
  }
  return (
    <div id={id}>
      {heading}
      <Divider pt={{ root: { style: { marginTop: '0.5rem' } } }} />
    </div>
  );
}
