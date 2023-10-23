import { FormContextType, RJSFSchema, StrictRJSFSchema, TitleFieldProps } from '@rjsf/utils';
import { LabelValue } from '../components/LabelValue';
import { FormGroup } from '@carbon/react';
import { useNestDepth } from '../contexts';

/** Implement `TitleFieldTemplate`
 */
export default function TitleField<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  id,
  title,
  required,
}: TitleFieldProps<T, S, F>) {
  const depth = useNestDepth();
  const text = <LabelValue label={title} required={required} hide={false} />;
  return (
    <div className='title-field'>
      {/* show larger text if it's a form title */}
      {depth ? (
        <FormGroup legendId={id} legendText={text}>
          {null}
        </FormGroup>
      ) : (
        text
      )}
    </div>
  );
}
