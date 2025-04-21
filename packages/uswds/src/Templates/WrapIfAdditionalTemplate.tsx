import React from "react";
import {
  WrapIfAdditionalTemplateProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from "@rjsf/utils";

/** The `WrapIfAdditional` component is used by the `FieldTemplate` to wrap automatically added additional properties.
 * This component prevents the additional property buttons from appearing when the `additionalProperties` keyword is
 * set to false.
 *
 * @param props - The `WrapIfAdditionalProps` for the component
 */
const WrapIfAdditionalTemplate = <
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({
  children,
  classNames,
  style,
  disabled,
  id,
  label,
  onDropPropertyClick,
  onKeyChange,
  readonly,
  required,
  registry,
  schema,
  uiSchema,
}: WrapIfAdditionalTemplateProps<T, S, F>) => {
  // This template doesn't add any specific USWDS styling by default for the wrapper itself,
  // but it includes the necessary logic. The inner FieldTemplate handles the main styling.
  // You could add a wrapper div with classes here if needed for specific additional property styling.
  const { RemoveButton } = registry.templates.ButtonTemplates;
  const { readonlyAsDisabled = true } = registry.formContext;

  const additional = schema.hasOwnProperty("__additional_property"); // RJSF adds this marker

  if (!additional) {
    return (
      <div className={classNames} style={style}>
        {children}
      </div>
    );
  }

  const handleDropPropertyClick = (key: string) => (event: any) => {
    event.preventDefault();
    onDropPropertyClick(key)(event);
  };

  return (
    <div className={`${classNames} grid-row grid-gap`} style={style}>
      <div className="grid-col-10">{children}</div>
      <div className="grid-col-2 rjsf-uswds-additional-toolbox">
        <RemoveButton
          className="array-item-remove" // Re-use array item remove class/styling
          disabled={disabled || (readonly && readonlyAsDisabled)}
          onClick={handleDropPropertyClick(label)}
          uiSchema={uiSchema}
          registry={registry}
        />
      </div>
    </div>
  );
};

export default WrapIfAdditionalTemplate;
