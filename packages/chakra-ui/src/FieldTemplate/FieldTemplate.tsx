import React from "react";

import { FieldTemplateProps } from "@rjsf/core";

import {
  Text,
  FormControl,
  FormHelperText,
  FormErrorMessage,
} from "@chakra-ui/react";
import { List, ListItem } from "@chakra-ui/react";

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
    required,
    rawErrors = [],
    rawHelp,
    rawDescription,
    schema,
  } = props;

  if (hidden) {
    return <>{children}</>;
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
    >
      <FormControl
        isRequired={required}
        isInvalid={rawErrors && rawErrors.length > 0}
      >
        {children}
        {displayLabel && rawDescription ? (
          <Text mt={2}>{rawDescription}</Text>
        ) : null}
        {rawErrors && rawErrors.length > 0 && (
          <List>
            {rawErrors.map((error, i: number) => {
              return (
                <ListItem key={i}>
                  <FormErrorMessage id={id}>{error}</FormErrorMessage>
                </ListItem>
              );
            })}
          </List>
        )}
        {rawHelp && <FormHelperText id={id}>{rawHelp}</FormHelperText>}
      </FormControl>
    </WrapIfAdditional>
  );
};

export default FieldTemplate;
