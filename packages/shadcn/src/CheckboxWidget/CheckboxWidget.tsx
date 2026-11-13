import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  fieldShowsOwnErrors,
  getControlAttributes,
  getTemplates,
  getUiOptions,
  getWidgetDescription,
  hasWidgetErrors,
  labelValue,
  schemaRequiresTrueValue,
  widgetDrawsLabel,
} from '@rjsf/utils';

import { Checkbox } from '../components/ui/checkbox.tsx';
import { Label } from '../components/ui/label.tsx';
import { cn } from '../lib/utils.ts';

/** The `CheckBoxWidget` is a widget for rendering boolean properties.
 *  It is typically used to represent a boolean.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function CheckboxWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const {
    id,
    htmlName,
    value,
    disabled,
    readonly,
    label,
    schema,
    autofocus,
    options,
    onChange,
    onBlur,
    onFocus,
    registry,
    presentation,
    uiSchema,
    className,
    required,
  } = props;
  const hideLabel = !widgetDrawsLabel<T, S, F>(props);
  // Because an unchecked checkbox will cause html5 validation to fail, only add
  // the "required" attribute if the field value must be "true", due to the
  // "const" or "enum" keywords
  const trueValueRequired = schemaRequiresTrueValue<S>(schema) && required;
  // The label is marked as a plan's `required` says, which takes in a box `ui:required` asks of that holds no value
  // yet, while the box is natively required only where the schema demands `true`, as RJSF's own check covers the rest
  // and `aria-required` tells a screen reader of, as the marker is hidden from it
  const marksRequired = presentation?.control ? required : trueValueRequired;
  const { DescriptionFieldTemplate } = getTemplates<T, S, F>(registry, options);
  const hasErrors = fieldShowsOwnErrors<T, S, F>(props);

  const handleChange = (checked: boolean) => onChange(checked);
  const handleBlur = () => onBlur(id, value);
  const handleFocus = () => onFocus(id, value);

  // Without a plan, core's `FieldTemplate` draws the description of a field whose `ui:widget` is the `checkbox` alias
  const description =
    presentation || getUiOptions(uiSchema).widget !== 'checkbox' ? getWidgetDescription<T, S, F>(props) : undefined;
  return (
    <div className={`relative ${disabled || readonly ? 'cursor-not-allowed opacity-50' : ''}`}>
      {description && (
        <DescriptionFieldTemplate
          id={description.id}
          description={description.text}
          hasErrors={hasErrors}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      <div className='flex items-center gap-2 my-2'>
        <Checkbox
          id={id}
          name={htmlName || id}
          checked={typeof value === 'undefined' ? false : Boolean(value)}
          required={trueValueRequired || undefined}
          // Replaces the one Radix sets from `required`, so it is set wherever the box is natively required too
          aria-required={marksRequired || undefined}
          disabled={disabled || readonly}
          autoFocus={autofocus}
          onCheckedChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          {...getControlAttributes<T, S, F>({ id, presentation })}
          className={cn({ 'border-destructive': hasWidgetErrors<T, S, F>(props) }, className)}
        />
        <Label
          className='leading-tight data-invalid:text-destructive'
          htmlFor={id}
          data-invalid={hasErrors || undefined}
        >
          {labelValue(label, hideLabel || !label)}
          {!hideLabel && label && marksRequired && <span className='text-destructive ml-1'>*</span>}
        </Label>
      </div>
    </div>
  );
}
