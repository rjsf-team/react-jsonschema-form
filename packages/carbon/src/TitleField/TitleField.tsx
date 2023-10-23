import { FormContextType, RJSFSchema, StrictRJSFSchema, TitleFieldProps } from '@rjsf/utils';
import { LabelValue } from '../components/LabelValue';
import { FormGroup } from '@carbon/react';

/** Implement `TitleFieldTemplate`
 */
export default function TitleField<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  id,
  title,
  required,
}: TitleFieldProps<T, S, F>) {
  return (
    <div className='title-field'>
      <FormGroup legendId={id} legendText={<LabelValue label={title} required={required} hide={false} />}>
        {null}
      </FormGroup>
    </div>
  );
}
