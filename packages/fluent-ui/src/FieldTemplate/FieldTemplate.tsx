import React from "react";
import { FieldTemplateProps } from "@rjsf/core";
import { Text } from "@fluentui/react";
import { List } from "@fluentui/react";

const FieldTemplate = ({
  id,
  children,
  displayLabel,
  rawErrors = [],
  rawHelp,
  rawDescription,
}: FieldTemplateProps) => {
  return (
    <div>
      {children}
      {displayLabel && rawDescription ? <Text>{rawDescription}</Text> : null}
      {rawErrors.length > 0 && <List items={rawErrors}>})}</List>}
      {rawHelp && <Text id={id}>{rawHelp}</Text>}
    </div>
  );
};

export default FieldTemplate;
