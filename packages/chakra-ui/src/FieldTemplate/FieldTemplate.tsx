import React from "react";

import { FieldTemplateProps } from "@rjsf/core";

import { Text, FormControl, FormHelperText } from "@chakra-ui/react";
import { List, ListItem } from "@chakra-ui/react";

import WrapIfAdditional from "./WrapIfAdditional";

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
  rawHelp,
  rawDescription,
  schema,
}: FieldTemplateProps) => {
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
      schema={schema}>
      <FormControl
        // fullWidth={true}
        isRequired={required}
        error={rawErrors.length ? true : false}
        // required={required}
      >
        {children}
        {displayLabel && rawDescription ? <Text>{rawDescription}</Text> : null}
        {rawErrors.length > 0 && (
          <List>
            {rawErrors.map((error, i: number) => {
              return (
                <ListItem key={i}>
                  <FormHelperText id={id}>{error}</FormHelperText>
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
