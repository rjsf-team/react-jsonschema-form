import type { CheckboxProps } from '@mui/material/Checkbox';
import Checkbox from '@mui/material/Checkbox';
import type { FormControlLabelProps } from '@mui/material/FormControlLabel';
import FormControlLabel from '@mui/material/FormControlLabel';
import type { FormContextType, GenericObjectType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  getControlAttributes,
  getTemplates,
  getWidgetDescription,
  labelValue,
  schemaRequiresTrueValue,
  widgetDrawsLabel,
  templateMarksRequired,
} from '@rjsf/utils';

import { getMuiProps, withInputSlot } from '../util.ts';

/** Properties available for the `rjsfSlotProps` target of the CheckboxWidget. */
export interface CheckboxWidgetMuiProps extends GenericObjectType {
  /** RJSF-specific slot props for targeting child elements of the CheckboxWidget. */
  rjsfSlotProps?: {
    /** Props applied to the individual `Checkbox` component. */
    checkbox?: CheckboxProps;
    /** Props applied to the `FormControlLabel` component wrapping the checkbox. */
    formControlLabel?: FormControlLabelProps;
  };
}

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
    schema,
    id,
    htmlName,
    value,
    disabled,
    readonly,
    label,
    autofocus,
    onChange,
    onBlur,
    onFocus,
    registry,
    presentation,
    options,
    uiSchema,
    required,
  } = props;
  const hideLabel = !widgetDrawsLabel<T, S, F>(props);
  const { DescriptionFieldTemplate } = getTemplates<T, S, F>(registry, options);
  // Because an unchecked checkbox will cause html5 validation to fail, only add
  // the "required" attribute if the field value must be "true", due to the
  // "const" or "enum" keywords
  const trueValueRequired = schemaRequiresTrueValue<S>(schema) && required;
  // The label is marked as a plan's `required` says, which takes in a box `ui:required` asks of that holds no value
  // yet, while the box is natively required only where the schema demands `true`, as RJSF's own check covers the rest
  // and `aria-required` tells a screen reader of, as the marker is hidden from it
  const marksRequired = presentation?.control ? required : trueValueRequired;

  const handleChange: NonNullable<CheckboxProps['onChange']> = (_, checked) => onChange(checked);
  const handleBlur: React.FocusEventHandler<HTMLButtonElement> = () => onBlur(id, value);
  const handleFocus: React.FocusEventHandler<HTMLButtonElement> = () => onFocus(id, value);
  const description = getWidgetDescription<T, S, F>(props);

  const { rjsfSlotProps: muiSlotProps, ...otherMuiProps } = getMuiProps<T, S, F, CheckboxWidgetMuiProps>(options);

  return (
    <>
      {description && (
        <DescriptionFieldTemplate
          id={description.id}
          description={description.text}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      <FormControlLabel
        {...otherMuiProps}
        {...muiSlotProps?.formControlLabel}
        // `FormControlLabel` gives its own `disabled` to the control in place of the control's, so the form's goes here
        disabled={disabled || readonly}
        required={marksRequired && templateMarksRequired<T, S, F>(props)}
        control={
          <Checkbox
            id={id}
            name={htmlName || id}
            checked={typeof value === 'undefined' ? false : Boolean(value)}
            autoFocus={autofocus}
            {...muiSlotProps?.checkbox}
            // After the author's props, so they can't take the form's data or focus
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            // The `<input>` carrying the field's id takes its plan, rather than the `<span>` around it
            // `FormControlLabel` hands the control the `required` it marks its label by, so the `<input>` takes its own
            slotProps={withInputSlot(
              {
                required: muiSlotProps?.checkbox?.required ?? trueValueRequired,
                'aria-required': (marksRequired && !trueValueRequired) || undefined,
                ...getControlAttributes<T, S, F>({ id, presentation }),
              },
              muiSlotProps?.checkbox?.slotProps,
            )}
          />
        }
        label={labelValue(label, hideLabel, false)}
      />
    </>
  );
}
