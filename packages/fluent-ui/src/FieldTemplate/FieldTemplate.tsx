import React from "react";
import { FieldTemplateProps } from "@rjsf/core";
import { Text } from "@fluentui/react";
import { List } from "@fluentui/react";

const FieldTemplate = ({
  id,
  children,
  rawErrors = [],
  rawHelp,
  rawDescription,
  classNames,
  hidden,
}: FieldTemplateProps) => {
  // TODO: do this better by not returning the form-group class from master.
  classNames = "ms-Grid-col ms-sm12 " + classNames.replace("form-group", "");
  return (
    <div
      className={classNames}
      style={{ marginBottom: 15, display: hidden ? "none" : undefined }}>
      {children}
      {rawDescription && <Text>{rawDescription}</Text>}
      {rawErrors.length > 0 && <List items={rawErrors} />}
      {rawHelp && <Text id={id}>{rawHelp}</Text>}
    </div>
  );
};

export default FieldTemplate;
