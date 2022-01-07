import React from "react";
import { ErrorListProps } from "@rjsf/core";
import { Box, Heading, List, ListIcon, ListItem } from "@chakra-ui/react";

const ErrorList = ({ errors }: ErrorListProps) => (
  <Box>
    <Heading>Errors</Heading>
    <List>
      {errors.map((error, i) => (
        <ListItem key={i}>
          <ListIcon icon="warning-2" />
          {error.stack}
        </ListItem>
      ))}
    </List>
  </Box>
);

export default ErrorList;
