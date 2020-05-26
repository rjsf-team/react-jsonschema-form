// import 'node_modules/office-ui-fabric-react/dist/css/fabric.css';
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
  classNames,
}: FieldTemplateProps) => {
  // TODO: do this better by not returning the form-group class from master.
  classNames = "ms-Grid-col ms-sm12 " + classNames.replace("form-group", "");
  return (
    <div className={classNames}>
      {children}
      {displayLabel && rawDescription ? <Text>{rawDescription}</Text> : null}
      {rawErrors.length > 0 && <List items={rawErrors}>})}</List>}
      {rawHelp && <Text id={id}>{rawHelp}</Text>}
    </div>
  );
};

export default FieldTemplate;
