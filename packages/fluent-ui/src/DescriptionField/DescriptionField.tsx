import React from "react";
import { DescriptionFieldProps } from "@rjsf/utils";
import { Text } from "@fluentui/react";

const DescriptionField = ({ description, id }: DescriptionFieldProps) => {
  if (description) {
    return <Text id={id}>{description}</Text>;
  }

  return null;
};

export default DescriptionField;
