import React from "react";
import { ErrorListProps } from "@rjsf/utils";
import { List, ListIcon, ListItem, Alert, AlertTitle } from "@chakra-ui/react";
import { WarningIcon } from "@chakra-ui/icons";

const ErrorList = ({ errors }: ErrorListProps) => {
  return (
    <Alert
      flexDirection="column"
      alignItems="flex-start"
      gap={3}
      status="error"
    >
      <AlertTitle>Errors</AlertTitle>

      <List>
        {errors.map((error, i) => (
          <ListItem key={i}>
            <ListIcon as={WarningIcon} color="red.500" />
            {error.stack}
          </ListItem>
        ))}
      </List>
    </Alert>
  );
};

export default ErrorList;
