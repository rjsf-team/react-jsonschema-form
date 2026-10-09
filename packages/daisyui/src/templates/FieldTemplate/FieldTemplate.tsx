import type {
  FieldTemplateProps,
  StrictRJSFSchema,
  RJSFSchema,
  FormContextType,
  RegistryWidgetsType,
  Widget,
  WidgetAliasFor,
} from '@rjsf/utils';
import { DEFAULT_BOOLEAN_WIDGET, fieldLabelId, getTemplates, getUiOptions, getWidgetType } from '@rjsf/utils';

import { getDaisy } from '../../utils.ts';

const CHECKBOX_ALIAS: WidgetAliasFor<'boolean'> = 'checkbox';

/** Whether the widget a field resolves to renders the field's label itself, which the checkbox and the toggle do,
 * after their input. The answer is the registry's own entry rather than this theme's component, so a consumer who
 * wraps or replaces either key still gets exactly one label: whatever is registered as the checkbox or the toggle is
 * the widget that renders it, whoever wrote it. A widget registered under any other key cannot be recognized from
 * here and gets the template's label too, which is the better way to be wrong — guessing the other way would leave a
 * control replaced by a label-less widget with no accessible name at all.
 *
 * A registry key and a component both answer without the schema's type. Registry keys are looked up as own
 * properties, as `getWidget()` does, so a name inherited from `Object.prototype` such as `toString` is an alias like
 * any other. Of the aliases, only `checkbox` is recognized, by name, where `getWidgetType()` types it as `boolean`,
 * which includes a `type` list such as `['number', 'boolean']`, and it is read from the registry under the key
 * `getWidget()` maps it to. That is the one alias that reaches the checkbox in the default registry, so a field that
 * names another boolean alias, such as `radio`, whose key holds the checkbox or the toggle gets the template's label
 * and description as well as the widget's own. Naming that key itself, `RadioWidget`, resolves through the registry
 * and gets only the widget's. `getWidget()` itself is not called, since it reports a name it
 * cannot resolve by throwing an error built from a `JSON.stringify()` of the whole schema, which a `ui:widget` that a
 * custom `ui:field` consumes itself would otherwise pay for on every render just to be told no.
 *
 * @param schema - The schema for the field
 * @param widget - The widget named by the field's ui options, if any
 * @param registeredWidgets - The widgets of the field's registry
 * @returns - True if that widget renders the field's label itself
 */
function widgetRendersOwnLabel<T, S extends StrictRJSFSchema, F extends FormContextType>(
  schema: S,
  widget: Widget<T, S, F> | string | undefined,
  registeredWidgets: RegistryWidgetsType<T, S, F>,
) {
  let resolved: Widget<T, S, F> | undefined;
  if (typeof widget !== 'string') {
    resolved = widget;
  } else if (Object.hasOwn(registeredWidgets, widget)) {
    resolved = registeredWidgets[widget];
  } else if (widget === CHECKBOX_ALIAS && getWidgetType<S>(schema, widget) === 'boolean') {
    return !!registeredWidgets[DEFAULT_BOOLEAN_WIDGET];
  }
  return (
    !!resolved && (resolved === registeredWidgets[DEFAULT_BOOLEAN_WIDGET] || resolved === registeredWidgets.toggle)
  );
}

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
  // The checkbox and the toggle render their own label after the input, and their own description, so this template
  // renders neither for them
  const widgetRendersLabel = widgetRendersOwnLabel<T, S, F>(schema, uiOptions.widget, registry.widgets);
  const daisy = getDaisy<T, S, F>({ uiSchema });
  const { WrapIfAdditionalTemplate } = getTemplates<T, S, F>(registry, uiOptions);

  return (
    <WrapIfAdditionalTemplate
      classNames={classNames}
      style={style}
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
        // `ui:classNames` and `ui:style` are the wrapper's to apply, as they are in `@rjsf/core`, so that a border
        // or padding is drawn once and both land on the same element. Only `ui:options.daisy`, this theme's own
        // per-field theming of this div, belongs here
        className={`field-template mb-3 ${daisy.className || ''}`.trim()}
        data-theme={daisy.theme}
        {...divProps}
        style={daisy.style}
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
