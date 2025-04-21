import React from "react";
import {
  FieldTemplateProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  getTemplate,
  getUiOptions,
} from "@rjsf/utils";

/** The `FieldTemplate` component is the template used by `SchemaField` to render any field. It renders the field
 * content, (label, description, children, errors and help) inside of a `div` with the `usa-form-group` class
 * name applied.
 *
 * @param props - The `FieldTemplateProps` for this component
 */
const FieldTemplate = <
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(
  props: FieldTemplateProps<T, S, F>,
) => {
  const {
    id,
    children,
    classNames,
    style,
    disabled,
    displayLabel,
    hidden,
    label,
    onDropPropertyClick,
    onKeyChange,
    readonly,
    required,
    rawErrors = [],
    errors,
    help,
    rawDescription,
    schema,
    uiSchema,
    registry,
  } = props;
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const WrapIfAdditionalTemplate = getTemplate<
    "WrapIfAdditionalTemplate",
    T,
    S,
    F
  >("WrapIfAdditionalTemplate", registry, uiOptions);

  if (hidden) {
    return <div style={{ display: "none" }}>{children}</div>;
  }

  const hasErrors = rawErrors.length > 0;

  return (
    <WrapIfAdditionalTemplate {...props}>
      <div
        className={`usa-form-group ${classNames || ""} ${
          hasErrors ? "usa-form-group--error" : ""
        }`}
        style={style}
      >
        {displayLabel && (
          <label
            htmlFor={id}
            className={`usa-label ${hasErrors ? "usa-label--error" : ""}`}
          >
            {label}
            {required && <span className="usa-label--required"> *</span>}
          </label>
        )}
        {rawDescription && (
          <span id={`${id}__description`} className="usa-hint">
            {rawDescription}
          </span>
        )}
        {children}
        {errors}
        {help}
      </div>
    </WrapIfAdditionalTemplate>
  );
};

export default FieldTemplate;
