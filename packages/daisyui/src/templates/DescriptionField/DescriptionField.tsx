import { DescriptionFieldProps, StrictRJSFSchema, RJSFSchema, FormContextType } from '@rjsf/utils';

/** The `DescriptionField` component renders descriptive text for a form field
 * with DaisyUI styling. It displays the description in a subtle text color
 * with proper spacing.
 *
 * @param props - The `DescriptionFieldProps` for the component
 */
export default function DescriptionField<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: DescriptionFieldProps<T, S, F>) {
  const { id, description } = props;
  return (
    <div id={id} className='description-field my-4'>
      <div className='text-sm text-base-content/80'>{description}</div>
    </div>
  );
}
