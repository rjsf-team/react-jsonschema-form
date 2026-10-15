import type { TitleFieldProps, StrictRJSFSchema, RJSFSchema, FormContextType } from '@rjsf/utils';

/** The `TitleField` component renders the title for a form section or field
 * with DaisyUI styling. It displays:
 *
 * - Large heading with primary color
 * - Divider element below the title for visual separation
 * - The title it is handed, as `@rjsf/core`'s draws it, so a heading its field's plan decorates keeps the decoration
 *
 * This component is typically used at the top of form sections to provide clear visual hierarchy.
 *
 * @param props - The `TitleFieldProps` for the component
 */
export default function TitleField<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: TitleFieldProps<T, S, F>) {
  const { id, title, optionalDataControl } = props;

  // The id names an object's option selector, so it is on the title's text alone, not on the optional data control
  let heading = (
    <h2 className='text-3xl font-bold text-primary mb-2'>
      <span id={id}>{title}</span>
    </h2>
  );
  if (optionalDataControl) {
    heading = (
      <div className='flex'>
        <div className='flex flex-auto'>{heading}</div>
        <div className='flex justify-end'>{optionalDataControl}</div>
      </div>
    );
  }
  return (
    <div className='title-field mb-6'>
      {heading}
      <div className='divider divider-primary my-0' />
    </div>
  );
}
