import React from "react";

import { FieldTemplateProps } from "@rjsf/core";

import FormControl from "@material-ui/core/FormControl";
import FormHelperText from "@material-ui/core/FormHelperText";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";

import Form from "react-bootstrap/Form"

const FieldTemplate = ({
  id,
  children,
  displayLabel,
  required,
  rawErrors = [],
  rawHelp,
  rawDescription,
}: FieldTemplateProps) => {
  return (
    <FormControl
      fullWidth={true}
      error={rawErrors.length ? true : false}
      required={required}>
      {children}
      {displayLabel && rawDescription ? (
        <Form.Text>
          {rawDescription}
        </Form.Text>
      ) : null}
      {rawErrors.length > 0 && (
        <List dense={true} disablePadding={true}>
          {rawErrors.map((error, i: number) => {
            return (
              <ListItem key={i} disableGutters={true}>
                <FormHelperText id={id}>{error}</FormHelperText>
              </ListItem>
            );
          })}
        </List>
      )}
      {rawHelp && <Form.Text className="text-muted" id={id}>{rawHelp}</Form.Text>}
    </FormControl>
  );
};

export default FieldTemplate;
