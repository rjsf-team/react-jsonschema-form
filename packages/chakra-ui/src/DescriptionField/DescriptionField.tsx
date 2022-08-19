import React from "react";
import { DescriptionFieldProps } from "@rjsf/utils";
import { Text } from "@chakra-ui/react";

const DescriptionField = ({ description, id }: DescriptionFieldProps) => {
  if (!description) {
    return null;
  }

  if (typeof description === "string") {
    return (
      <Text id={id} mt={2} mb={4}>
        {description}
      </Text>
    );
  }

  return <>{description}</>;
};

export default DescriptionField;
