import React from "react";
import { FieldTemplateProps } from "@rjsf/utils";
import { Text } from "@fluentui/react";

const FieldTemplate = ({
  id,
  children,
  errors,
  help,
  rawDescription,
  classNames = "",
  hidden,
}: FieldTemplateProps) => {
  // TODO: do this better by not returning the form-group class from master.
  classNames = "ms-Grid-col ms-sm12 " + classNames.replace("form-group", "");
  return (
    <div
      id={id}
      className={classNames}
      style={{ marginBottom: 15, display: hidden ? "none" : undefined }}
    >
      {children}
      {rawDescription && <Text>{rawDescription}</Text>}
      {errors}
      {help}
    </div>
  );
};

export default FieldTemplate;
