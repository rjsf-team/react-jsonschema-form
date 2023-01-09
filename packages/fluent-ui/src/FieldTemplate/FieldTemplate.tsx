import React from "react";
import { FieldTemplateProps, getTemplate, getUiOptions } from "@rjsf/utils";
import { Text } from "@fluentui/react";

const FieldTemplate = (props: FieldTemplateProps) => {
  const {
    id,
    children,
    errors,
    help,
    rawDescription,
    hidden,
    uiSchema,
    registry,
  } = props;
  const uiOptions = getUiOptions(uiSchema);
  const WrapIfAdditionalTemplate = getTemplate<"WrapIfAdditionalTemplate">(
    "WrapIfAdditionalTemplate",
    registry,
    uiOptions
  );
  // TODO: do this better by not returning the form-group class from master.
  let { classNames = "" } = props;
  classNames = "ms-Grid-col ms-sm12 " + classNames.replace("form-group", "");
  return (
    <WrapIfAdditionalTemplate {...props}>
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
    </WrapIfAdditionalTemplate>
  );
};

export default FieldTemplate;
