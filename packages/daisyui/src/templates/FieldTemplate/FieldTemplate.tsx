import { FieldTemplateProps, StrictRJSFSchema, RJSFSchema, FormContextType } from '@rjsf/utils';

/** The `FieldTemplate` component provides the main layout for each form field
 * with DaisyUI styling. It handles:
 *
 * - Displaying field labels with required indicators
 * - Special layout for checkbox fields (label positioned after the input)
 * - Proper spacing between form fields
 * - Rendering error messages and help text
 * - Maintaining accessibility with proper label associations
 *
 * This template uses DaisyUI's label and form-control components for consistent styling.
 *
 * @param props - The `FieldTemplateProps` for the component
 */
export default function FieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: FieldTemplateProps<T, S, F>) {
  const {
    id,
    label,
    children,
    errors,
    formContext,
    formData,
    help,
    hideError,
    displayLabel,
    classNames,
    // Destructure props we don't want to pass to div
    onKeyChange,
    onDropPropertyClick,
    uiSchema,
    schema,
    readonly,
    required,
    rawErrors,
    rawHelp,
    rawDescription,
    hidden,
    onChange,
    registry,
    ...divProps
  } = props;

  // Special handling for checkboxes - they should have the label after the input
  const isCheckbox = schema.type === 'boolean';

  return (
    <div className={`field-template mb-3 ${classNames || ''}`} {...divProps}>
      {displayLabel && !isCheckbox && (
        <label htmlFor={id} className='label'>
          <span className='label-text font-medium'>
            {label}
            {required && <span className='text-error ml-1'>*</span>}
          </span>
        </label>
      )}
      {children}
      {errors}
      {help}
    </div>
  );
}
