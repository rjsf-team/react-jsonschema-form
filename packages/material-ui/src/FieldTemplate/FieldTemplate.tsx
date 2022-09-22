import React from "react";
import FormControl from "@material-ui/core/FormControl";
import Typography from "@material-ui/core/Typography";
import { FieldTemplateProps, getTemplate, getUiOptions } from "@rjsf/utils";

const FieldTemplate = ({
  id,
  children,
  classNames,
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
}: FieldTemplateProps) => {
  const uiOptions = getUiOptions(uiSchema);
  const WrapIfAdditionalTemplate = getTemplate(
    "WrapIfAdditionalTemplate",
    registry,
    uiOptions
  );

  if (hidden) {
    return <div style={{ display: "none" }}>{children}</div>;
  }
  return (
    <WrapIfAdditionalTemplate
      classNames={classNames}
      disabled={disabled}
      id={id}
      label={label}
      onDropPropertyClick={onDropPropertyClick}
      onKeyChange={onKeyChange}
      readonly={readonly}
      required={required}
      schema={schema}
      uiSchema={uiSchema}
      registry={registry}
    >
      <FormControl
        fullWidth={true}
        error={rawErrors.length ? true : false}
        required={required}
      >
        {children}
        {displayLabel && rawDescription ? (
          <Typography variant="caption" color="textSecondary">
            {rawDescription}
          </Typography>
        ) : null}
        {errors}
        {help}
      </FormControl>
    </WrapIfAdditionalTemplate>
  );
};

export default FieldTemplate;
