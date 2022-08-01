import React from "react";
import { DescriptionFieldProps } from "@rjsf/utils";
import { Text } from "@fluentui/react";

const DescriptionField = ({ description }: DescriptionFieldProps) => {
  if (description) {
    return <Text>{description}</Text>;
  }

  return null;
};

export default DescriptionField;
