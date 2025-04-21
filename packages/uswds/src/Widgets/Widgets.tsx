import React from "react";
import {
  getTemplate,
  getUiOptions,
  WidgetProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  RegistryWidgetsType,
  optionId, // Import optionId helper
  ariaDescribedByIds, // Import ariaDescribedByIds helper
  enumOptionsIsSelected, // Import enumOptionsIsSelected helper
  enumOptionsValueForIndex, // Import enumOptionsValueForIndex helper
} from "@rjsf/utils";

// Define USWDS specific widgets here
// Example for TextWidget:
function TextWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WidgetProps<T, S, F>) {
  const { registry } = props;
  const BaseInputTemplate = getTemplate<"BaseInputTemplate", T, S, F>(
    "BaseInputTemplate",
    registry,
    getUiOptions(props.uiSchema),
  );
  return <BaseInputTemplate {...props} />;
}

// Example for CheckboxWidget
function CheckboxWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WidgetProps<T, S, F>) {
  const {
    id,
    value,
    disabled,
    readonly,
    label,
    schema,
    autofocus,
    required,
    onChange,
    onBlur,
    onFocus,
  } = props;
  const _onChange = ({ target: { checked } }: React.ChangeEvent<HTMLInputElement>) =>
    onChange(checked);
  const _onBlur = ({ target: { checked } }: React.FocusEvent<HTMLInputElement>) =>
    onBlur(id, checked);
  const _onFocus = ({ target: { checked } }: React.FocusEvent<HTMLInputElement>) =>
    onFocus(id, checked);
  const description = schema.description;

  return (
    <div className="usa-checkbox">
      <input
        id={id}
        name={id}
        type="checkbox"
        className="usa-checkbox__input"
        checked={typeof value === "undefined" ? false : value}
        required={required}
        disabled={disabled || readonly}
        autoFocus={autofocus}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
        aria-describedby={`${id}__description`}
      />
      <label className="usa-checkbox__label" htmlFor={id}>
        {label || schema.title}
        {description && (
          <span id={`${id}__description`} className="usa-hint">
            {description}
          </span>
        )}
      </label>
    </div>
  );
}

// DateWidget using USWDS Date Picker structure
function DateWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WidgetProps<T, S, F>) {
  const {
    id,
    value,
    disabled,
    readonly,
    label,
    schema,
    autofocus,
    required,
    onChange,
    onBlur,
    onFocus,
  } = props;
  const _onChange = ({ target }: React.ChangeEvent<HTMLInputElement>) =>
    onChange(target.value || undefined);
  const _onBlur = ({ target }: React.FocusEvent<HTMLInputElement>) =>
    onBlur(id, target.value);
  const _onFocus = ({ target }: React.FocusEvent<HTMLInputElement>) =>
    onFocus(id, target.value);

  // Note: This provides the basic structure. A full implementation
  // might require JavaScript for the USWDS date picker interaction.
  // The prompt requested native React without additional JS, so this is structural.
  return (
    <div className="usa-form-group"> {/* Removed conditional error class comment */}
      <label className="usa-label" htmlFor={id}>
        {label || schema.title}
        {required && <span className="usa-label--required"> *</span>}
      </label>
      <div className="usa-date-picker">
        <div className="usa-date-picker__wrapper">
          <input
            id={id}
            name={id}
            className="usa-input usa-date-picker__external-input"
            type="text" // USWDS uses text input visually, JS handles date picking
            placeholder="mm/dd/yyyy" // Or other format based on locale/schema
            value={value || ""}
            required={required}
            disabled={disabled || readonly}
            autoFocus={autofocus}
            onChange={_onChange}
            onBlur={_onBlur}
            onFocus={_onFocus}
            aria-describedby={`${id}__description`}
          />
          {/* USWDS Date Picker includes a button, handled by their JS */}
          {/* <button type="button" className="usa-date-picker__button" aria-haspopup="true" aria-label="Toggle calendar"> */}
          {/* </button> */}
          {/* <div className="usa-date-picker__calendar" role="dialog" aria-modal="true"> */}
          {/* Calendar markup goes here, typically managed by USWDS JS */}
          {/* </div> */}
        </div>
      </div>
      {schema.description && (
        <span id={`${id}__description`} className="usa-hint">
          {schema.description}
        </span>
      )}
    </div>
  );
}

// SelectWidget using USWDS Combo Box structure
function SelectWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WidgetProps<T, S, F>) {
  const {
    schema,
    id,
    options, // Contains enumOptions, enumDisabled, emptyValue
    label,
    required,
    disabled,
    readonly,
    value,
    multiple, // Not directly supported by USWDS Combo Box visually, but handle logic
    autofocus,
    onChange,
    onBlur,
    onFocus,
    placeholder,
  } = props;
  const { enumOptions, enumDisabled, emptyValue } = options;
  const _onChange = ({ target }: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = target.value;
    onChange(newValue === "" ? emptyValue : newValue);
  };
  const _onBlur = ({ target }: React.FocusEvent<HTMLSelectElement>) =>
    onBlur(id, target.value);
  const _onFocus = ({ target }: React.FocusEvent<HTMLSelectElement>) =>
    onFocus(id, target.value);

  // Note: USWDS Combo Box requires JavaScript for full functionality (filtering).
  // This provides the basic structure.
  return (
    <div className="usa-form-group">
      <label className="usa-label" htmlFor={id}>
        {label || schema.title}
        {required && <span className="usa-label--required"> *</span>}
      </label>
      <div className="usa-combo-box">
        <select
          id={id}
          name={id}
          className="usa-select usa-combo-box__select"
          value={typeof value === "undefined" ? "" : value}
          required={required}
          disabled={disabled || readonly}
          autoFocus={autofocus}
          onChange={_onChange}
          onBlur={_onBlur}
          onFocus={_onFocus}
          // multiple={multiple} // Standard select multiple attribute
          aria-describedby={`${id}__description`}
        >
          {!multiple && schema.default === undefined && (
            <option value="">{placeholder || "- Select -"}</option>
          )}
          {(enumOptions || []).map(({ value: optionValue, label: optionLabel }, i) => {
            const isDisabled =
              enumDisabled && enumDisabled.includes(optionValue);
            return (
              <option
                key={optionId(id, i)}
                value={optionValue}
                disabled={isDisabled}
              >
                {optionLabel}
              </option>
            );
          })}
        </select>
      </div>
      {schema.description && (
        <span id={`${id}__description`} className="usa-hint">
          {schema.description}
        </span>
      )}
    </div>
  );
}

// RadioWidget using USWDS Radio button structure
function RadioWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WidgetProps<T, S, F>) {
  const {
    id,
    schema,
    options,
    value,
    required,
    disabled,
    readonly,
    label,
    onChange,
    onBlur,
    onFocus,
  } = props;
  const { enumOptions, enumDisabled, emptyValue } = options;

  const _onChange = ({ target: { value: eventValue } }: React.ChangeEvent<HTMLInputElement>) =>
    onChange(schema.type === "boolean" ? eventValue !== "false" : eventValue);
  const _onBlur = ({ target: { value: eventValue } }: React.FocusEvent<HTMLInputElement>) =>
    onBlur(id, schema.type === "boolean" ? eventValue !== "false" : eventValue);
  const _onFocus = ({ target: { value: eventValue } }: React.FocusEvent<HTMLInputElement>) =>
    onFocus(id, schema.type === "boolean" ? eventValue !== "false" : eventValue);

  const inline = Boolean(options && options.inline); // Check for inline option if needed

  return (
    <div className="usa-form-group">
      <fieldset className="usa-fieldset">
        <legend className="usa-legend">
          {label || schema.title}
          {required && <span className="usa-label--required"> *</span>}
        </legend>
        {schema.description && (
          <span className="usa-hint">{schema.description}</span>
        )}
        {(enumOptions || []).map((option, i) => {
          const itemDisabled =
            enumDisabled && enumDisabled.includes(option.value);
          const checked = option.value === value;
          const radioId = optionId(id, i);

          const radio = (
            <div
              key={radioId}
              className={`usa-radio ${inline ? "usa-radio--inline" : ""}`}
            >
              <input
                type="radio"
                id={radioId}
                name={id}
                className="usa-radio__input"
                value={String(option.value)}
                checked={checked}
                required={required}
                disabled={disabled || itemDisabled || readonly}
                onChange={_onChange}
                onBlur={_onBlur}
                onFocus={_onFocus}
                aria-describedby={`${id}-legend`} // Referencing the legend
              />
              <label className="usa-radio__label" htmlFor={radioId}>
                {option.label}
              </label>
            </div>
          );
          return radio;
        })}
      </fieldset>
    </div>
  );
}

// TextareaWidget using USWDS Textarea structure
function TextareaWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WidgetProps<T, S, F>) {
  const {
    id,
    options,
    placeholder,
    value,
    required,
    disabled,
    readonly,
    label,
    schema,
    autofocus,
    onChange,
    onBlur,
    onFocus,
  } = props;

  const _onChange = ({ target: { value: eventValue } }: React.ChangeEvent<HTMLTextAreaElement>) =>
    onChange(eventValue === "" ? options.emptyValue : eventValue);
  const _onBlur = ({ target: { value: eventValue } }: React.FocusEvent<HTMLTextAreaElement>) =>
    onBlur(id, eventValue);
  const _onFocus = ({ target: { value: eventValue } }: React.FocusEvent<HTMLTextAreaElement>) =>
    onFocus(id, eventValue);

  return (
    <div className="usa-form-group">
      <label className="usa-label" htmlFor={id}>
        {label || schema.title}
        {required && <span className="usa-label--required"> *</span>}
      </label>
      {schema.description && (
        <span id={ariaDescribedByIds(id, true)} className="usa-hint">
          {schema.description}
        </span>
      )}
      <textarea
        id={id}
        name={id}
        className="usa-textarea"
        value={value ? value : ""}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        readOnly={readonly}
        autoFocus={autofocus}
        rows={options.rows || 5} // Default to 5 rows, allow customization via ui:options
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
        aria-describedby={ariaDescribedByIds(id)}
      />
    </div>
  );
}

// CheckboxesWidget using USWDS Checkbox structure for multiple items
function CheckboxesWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WidgetProps<T, S, F>) {
  const {
    id,
    disabled,
    options,
    value,
    autofocus,
    readonly,
    required,
    label,
    schema,
    onChange,
    onBlur,
    onFocus,
  } = props;
  const { enumOptions, enumDisabled, inline, emptyValue } = options;

  const _onChange = (index: number) => ({
    target: { checked },
  }: React.ChangeEvent<HTMLInputElement>) => {
    const all = (enumOptions || []).map(({ value: val }) => val);
    const currentVal = enumOptionsValueForIndex<S>(index, all);
    if (checked) {
      onChange(Array.isArray(value) ? value.concat(currentVal) : [currentVal]);
    } else {
      onChange((value as any[]).filter((v) => v !== currentVal));
    }
  };

  const _onBlur = ({
    target: { value: eventValue },
  }: React.FocusEvent<HTMLInputElement>) =>
    onBlur(id, enumOptionsValueForIndex<S>(eventValue, enumOptions));
  const _onFocus = ({
    target: { value: eventValue },
  }: React.FocusEvent<HTMLInputElement>) =>
    onFocus(id, enumOptionsValueForIndex<S>(eventValue, enumOptions));

  return (
    <div className="usa-form-group">
      <fieldset className="usa-fieldset">
        <legend className="usa-legend">
          {label || schema.title}
          {required && <span className="usa-label--required"> *</span>}
        </legend>
        {schema.description && (
          <span className="usa-hint">{schema.description}</span>
        )}
        {(enumOptions || []).map((option, index) => {
          const checked = enumOptionsIsSelected<S>(option.value, value);
          const itemDisabled =
            enumDisabled && enumDisabled.includes(option.value);
          const checkboxId = optionId(id, index);

          return (
            <div
              key={checkboxId}
              className={`usa-checkbox ${inline ? "usa-checkbox--inline" : ""}`}
            >
              <input
                type="checkbox"
                id={checkboxId}
                name={id}
                className="usa-checkbox__input"
                value={String(index)}
                checked={checked}
                required={required} // Note: Required on CheckboxesWidget doesn't force selection of one. Schema validation should handle minItems if needed.
                disabled={disabled || itemDisabled || readonly}
                autoFocus={autofocus && index === 0}
                onChange={_onChange(index)}
                onBlur={_onBlur}
                onFocus={_onFocus}
                aria-describedby={`${id}-legend`} // Referencing the legend
              />
              <label className="usa-checkbox__label" htmlFor={checkboxId}>
                {option.label}
              </label>
            </div>
          );
        })}
      </fieldset>
    </div>
  );
}

// Add implementations for other widgets (e.g. UpDownWidget) using USWDS classes
// Note: Accordion functionality for nested objects/arrays should be implemented
// within ObjectFieldTemplate and ArrayFieldTemplate, potentially using ui:options.
// Note: Add/Remove buttons with usa-button-group styling for array items
// should be implemented within ArrayFieldTemplate.

export function generateWidgets<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(): RegistryWidgetsType<T, S, F> {
  return {
    TextWidget,
    CheckboxWidget,
    CheckboxesWidget, // Register CheckboxesWidget
    DateWidget, // Register DateWidget
    SelectWidget, // Register SelectWidget
    RadioWidget, // Register RadioWidget
    TextareaWidget, // Register TextareaWidget
    // Add other implemented widgets here (e.g., UpDownWidget)
    // Ensure they use appropriate USWDS classes.
  };
}

export default generateWidgets();
