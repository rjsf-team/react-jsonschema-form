import Checkbox, { CheckboxProps } from '@mui/material/Checkbox';
import FormControlLabel, { FormControlLabelProps } from '@mui/material/FormControlLabel';
import {
  ariaDescribedByIds,
  descriptionId,
  getTemplate,
  labelValue,
  schemaRequiresTrueValue,
  FormContextType,
  GenericObjectType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import { getMuiProps } from '../util';

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
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WidgetProps<T, S, F>) {
  const {
    schema,
    id,
    htmlName,
    value,
    disabled,
    readonly,
    label = '',
    hideLabel,
    autofocus,
    onChange,
    onBlur,
    onFocus,
    registry,
    options,
    uiSchema,
  } = props;
  const DescriptionFieldTemplate = getTemplate<'DescriptionFieldTemplate', T, S, F>(
    'DescriptionFieldTemplate',
    registry,
    options,
  );
  // Because an unchecked checkbox will cause html5 validation to fail, only add
  // the "required" attribute if the field value must be "true", due to the
  // "const" or "enum" keywords
  const required = schemaRequiresTrueValue<S>(schema);

  const _onChange = (_: any, checked: boolean) => onChange(checked);
  const _onBlur: React.FocusEventHandler<HTMLButtonElement> = () => onBlur(id, value);
  const _onFocus: React.FocusEventHandler<HTMLButtonElement> = () => onFocus(id, value);
  const description = options.description ?? schema.description;

  const { rjsfSlotProps: muiSlotProps, ...otherMuiProps } = getMuiProps<T, S, F, CheckboxWidgetMuiProps>(options);

  return (
    <>
      {!hideLabel && description && (
        <DescriptionFieldTemplate
          id={descriptionId(id)}
          description={description}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      <FormControlLabel
        {...otherMuiProps}
        {...muiSlotProps?.formControlLabel}
        control={
          <Checkbox
            id={id}
            name={htmlName || id}
            checked={typeof value === 'undefined' ? false : Boolean(value)}
            required={required}
            disabled={disabled || readonly}
            autoFocus={autofocus}
            onChange={_onChange}
            onBlur={_onBlur}
            onFocus={_onFocus}
            aria-describedby={ariaDescribedByIds(id)}
            {...muiSlotProps?.checkbox}
          />
        }
        label={labelValue(label, hideLabel, false)}
      />
    </>
  );
}
