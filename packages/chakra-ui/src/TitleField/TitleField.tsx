import React from "react";

import { FieldProps } from "@rjsf/core";

import { Box, Divider, Heading } from "@chakra-ui/react";

const TitleField = ({ title /* , id, required */ }: FieldProps) => (
  <Box mt={1} mb={4}>
    <Heading as="h5">{title}</Heading>
    <Divider />
  </Box>
);

export default TitleField;
