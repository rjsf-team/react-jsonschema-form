import type { FieldTemplateProps, StrictRJSFSchema, RJSFSchema, FormContextType } from '@rjsf/utils';
import { getTemplate, getUiOptions, titleId } from '@rjsf/utils';

import { getDaisy } from '../../utils.ts';

/** The `FieldTemplate` component provides the main layout for each form field
 * with DaisyUI styling. It handles:
 *
 * - Displaying field labels with required indicators
 * - Special layout for checkbox fields (label positioned after the input)
 * - Rendering only the children of a hidden field
 * - Proper spacing between form fields
 * - Rendering error messages and help text
 * - Maintaining accessibility with proper label associations
 * - Applying a per-field DaisyUI theme, class name and/or style passed via `ui:options.daisy`
 *
 * This template uses DaisyUI's label and form-control components for consistent styling.
 *
 * @param props - The `FieldTemplateProps` for the component
 */
export default function FieldTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: FieldTemplateProps<T, S, F>) {
  const {
    id,
    label,
    keyName,
    children,
    errors,
    formData,
    help,
    hideError,
    displayLabel,
    onKeyRename,
    onKeyRenameBlur,
    onRemoveProperty,
    propertyNamesEnum,
    classNames,
    uiSchema,
    schema,
    readonly,
    required,
    registry,
    // Destructure props we don't want to pass to div
    description,
    rawErrors,
    errorSchema,
    rawHelp,
    rawDescription,
    hidden,
    onChange,
    fieldPath,
    style,
    ...divProps
  } = props;

  if (hidden) {
    return <div className='hidden'>{children}</div>;
  }

  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  // Special handling for checkboxes - they should have the label after the input, which the CheckboxWidget renders
  // itself. Any other widget a boolean is rendered through leaves the label to this template
  const isCheckbox = uiOptions.widget === 'checkbox';
  const daisy = getDaisy<T, S, F>({ uiSchema });
  const WrapIfAdditionalTemplate = getTemplate<'WrapIfAdditionalTemplate', T, S, F>(
    'WrapIfAdditionalTemplate',
    registry,
    uiOptions,
  );

  return (
    <WrapIfAdditionalTemplate
      classNames={classNames}
      disabled={divProps.disabled}
      id={id}
      label={label}
      keyName={keyName}
      displayLabel={displayLabel}
      onKeyRename={onKeyRename}
      onKeyRenameBlur={onKeyRenameBlur}
      onRemoveProperty={onRemoveProperty}
      propertyNamesEnum={propertyNamesEnum}
      readonly={readonly}
      required={required}
      schema={schema}
      uiSchema={uiSchema}
      registry={registry}
    >
      <div
        className={`field-template mb-3 ${classNames || ''} ${daisy.className || ''}`.trim()}
        data-theme={daisy.theme}
        {...divProps}
        style={{ ...style, ...daisy.style }}
      >
        {displayLabel && !isCheckbox && !!label && (
          <label id={titleId(id)} htmlFor={id} className='label'>
            <span className='label-text font-medium'>
              {label}
              {required && <span className='text-error ml-1'>*</span>}
            </span>
          </label>
        )}
        {children}
        {displayLabel && !isCheckbox && description ? description : null}
        {errors}
        {help}
      </div>
    </WrapIfAdditionalTemplate>
  );
}
