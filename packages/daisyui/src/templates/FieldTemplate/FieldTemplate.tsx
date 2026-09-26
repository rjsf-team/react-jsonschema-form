import type { FieldTemplateProps, StrictRJSFSchema, RJSFSchema, FormContextType } from '@rjsf/utils';
import { getTemplate, getUiOptions, getWidget, hasWidget } from '@rjsf/utils';

import { fieldLabelId, getDaisy } from '../../utils.ts';
import CheckboxWidget from '../../widgets/CheckboxWidget/CheckboxWidget.tsx';
import ToggleWidget from '../../widgets/ToggleWidget/ToggleWidget.tsx';

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
  // The checkbox and toggle widgets render their own label after the input, and their own description, so this
  // template renders neither. Every other widget leaves both to this template
  // The checkbox and the toggle render their own label after the input, and their own description, so this template
  // renders neither for them. Which widget `ui:widget` names is resolved rather than matched against how it is spelled,
  // since an alias, a registry key and the component itself all have to reach the same answer — and a consumer who
  // overrides one of those keys with a widget of their own has to reach a different one, or their field would be left
  // with no label at all. `hasWidget()` first because `getWidget()` throws for a name nothing is registered under. A
  // third-party widget that renders its own label cannot be recognized from here, and gets this template's label too
  const { widget } = uiOptions;
  const resolvedWidget =
    widget && hasWidget<T, S, F>(schema, widget, registry.widgets)
      ? getWidget<T, S, F>(schema, widget, registry.widgets)
      : undefined;
  const widgetRendersLabel = resolvedWidget === CheckboxWidget || resolvedWidget === ToggleWidget;
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
        {displayLabel && !widgetRendersLabel && !!label && (
          <label id={fieldLabelId(id)} htmlFor={id} className='label'>
            <span className='label-text font-medium'>
              {label}
              {required && <span className='text-error ml-1'>*</span>}
            </span>
          </label>
        )}
        {children}
        {displayLabel && !widgetRendersLabel && description ? description : null}
        {errors}
        {help}
      </div>
    </WrapIfAdditionalTemplate>
  );
}
