import React from "react";
import { FieldTemplateProps } from "@rjsf/utils";
import { Text, FormControl } from "@chakra-ui/react";

import WrapIfAdditional from "./WrapIfAdditional";

const FieldTemplate = (props: FieldTemplateProps) => {
  const {
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
    registry,
    required,
    rawErrors = [],
    errors,
    help,
    rawDescription,
    schema,
  } = props;

  if (hidden) {
    return <div style={{ display: "none" }}>{children}</div>;
  }

  return (
    <WrapIfAdditional
      classNames={classNames}
      disabled={disabled}
      id={id}
      label={label}
      onDropPropertyClick={onDropPropertyClick}
      onKeyChange={onKeyChange}
      readonly={readonly}
      required={required}
      schema={schema}
      registry={registry}
    >
      <FormControl
        isRequired={required}
        isInvalid={rawErrors && rawErrors.length > 0}
      >
        {children}
        {displayLabel && rawDescription ? (
          <Text mt={2}>{rawDescription}</Text>
        ) : null}
        {errors}
        {help}
      </FormControl>
    </WrapIfAdditional>
  );
};

export default FieldTemplate;
