import React from "react";
import { TitleFieldProps } from "@rjsf/utils";
import { Box, Divider, Heading } from "@chakra-ui/react";

const TitleField = ({ id, title /* , required */ }: TitleFieldProps) => (
  <Box id={id} mt={1} mb={4}>
    <Heading as="h5">{title}</Heading>
    <Divider />
  </Box>
);

export default TitleField;
