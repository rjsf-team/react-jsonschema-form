import { WidgetProps, StrictRJSFSchema, RJSFSchema, FormContextType } from '@rjsf/utils';

export default function CheckboxWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>
) {
  const { id, value, required, disabled, readonly, label, onChange } = props;
  return (
    <div className="form-control">
      <label className="cursor-pointer label">
        <input
          type="checkbox"
          id={id}
          checked={value}
          required={required}
          disabled={disabled || readonly}
          onChange={(event) => onChange(event.target.checked)}
          className="checkbox"
        />
        <span className="label-text">{label}</span>
      </label>
    </div>
  );
}
