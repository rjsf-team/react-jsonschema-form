import React, { CSSProperties } from "react";
import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid";
import InputLabel from "@mui/material/InputLabel";
import Input from "@mui/material/OutlinedInput";
import { ADDITIONAL_PROPERTY_FLAG, FieldTemplateProps } from "@rjsf/utils";

type WrapIfAdditionalProps = { children: React.ReactElement } & Pick<
  FieldTemplateProps,
  | "classNames"
  | "disabled"
  | "id"
  | "label"
  | "onDropPropertyClick"
  | "onKeyChange"
  | "readonly"
  | "required"
  | "schema"
  | "registry"
>;

const WrapIfAdditional = ({
  children,
  classNames,
  disabled,
  id,
  label,
  onDropPropertyClick,
  onKeyChange,
  readonly,
  required,
  schema,
  registry,
}: WrapIfAdditionalProps) => {
  const { RemoveButton } = registry.templates.ButtonTemplates;
  const keyLabel = `${label} Key`; // i18n ?
  const additional = ADDITIONAL_PROPERTY_FLAG in schema;
  const btnStyle: CSSProperties = {
    flex: 1,
    paddingLeft: 6,
    paddingRight: 6,
    fontWeight: "bold",
  };

  if (!additional) {
    return <div className={classNames}>{children}</div>;
  }

  const handleBlur = ({ target }: React.FocusEvent<HTMLInputElement>) =>
    onKeyChange(target.value);

  return (
    <Grid
      container
      key={`${id}-key`}
      alignItems="center"
      spacing={2}
      className={classNames}
    >
      <Grid item xs>
        <FormControl fullWidth={true} required={required}>
          <InputLabel>{keyLabel}</InputLabel>
          <Input
            defaultValue={label}
            disabled={disabled || readonly}
            id={`${id}-key`}
            name={`${id}-key`}
            onBlur={!readonly ? handleBlur : undefined}
            type="text"
          />
        </FormControl>
      </Grid>
      <Grid item={true} xs>
        {children}
      </Grid>
      <Grid item={true}>
        <RemoveButton
          iconType="default"
          style={btnStyle}
          disabled={disabled || readonly}
          onClick={onDropPropertyClick(label)}
        />
      </Grid>
    </Grid>
  );
};

export default WrapIfAdditional;
