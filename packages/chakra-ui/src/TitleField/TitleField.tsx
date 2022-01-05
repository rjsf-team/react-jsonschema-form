import React from "react";

import { FieldProps } from "@rjsf/core";

import { Box, Divider, Heading } from "@chakra-ui/react";

const TitleField = ({ title }: FieldProps) => (
  <Box mb={1} mt={1}>
    <Heading as="h5">{title}</Heading>
    <Divider />
  </Box>
);

export default TitleField;
