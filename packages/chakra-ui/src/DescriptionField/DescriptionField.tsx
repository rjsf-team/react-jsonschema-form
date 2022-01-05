 import React from "react";

import { FieldProps } from "@rjsf/core";

import { Text } from "@chakra-ui/react";

const DescriptionField = ({ description, id }: FieldProps) => {
  if (!description) return null;

  if (typeof description === "string") {
    return <Text id={id}>{description}</Text>;
  }

  return <>{description}</>;
};

export default DescriptionField;
