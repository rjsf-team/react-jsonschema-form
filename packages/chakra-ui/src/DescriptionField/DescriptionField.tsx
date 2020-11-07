import React from "react";
import { Text } from "@chakra-ui/core";
import { FieldTemplateProps } from '@rjsf/core';

const DescriptionField = ({ description }: FieldTemplateProps) => {
  if (description) {
    return (
      <Text fontSize="sm" mb={2} opacity="0.9">
        {description}
      </Text>
    );
  }

  return null;
};

export default DescriptionField;
