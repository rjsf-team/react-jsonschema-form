import React from "react";

import { FieldProps } from "@rjsf/utils";

import { Text } from "@chakra-ui/react";

const DescriptionField = ({ description, id }: FieldProps) => {
  if (!description) return null;

  if (typeof description === "string") {
    return <Text id={id} mt={2} mb={4}>{description}</Text>;
  }

  return <>{description}</>;
};

export default DescriptionField;
