import React from "react";

import { FieldTemplateProps } from "@rjsf/core";
import WrapIfAdditional from './WrapIfAdditional';

import FormControl from "@material-ui/core/FormControl";
import FormHelperText from "@material-ui/core/FormHelperText";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import Typography from "@material-ui/core/Typography";

const FieldTemplate = (props: FieldTemplateProps) => {
  var { id, rawHelp, rawErrors = [], required, children, displayLabel, rawDescription } = props;
  return (
    <WrapIfAdditional {...props}>
      <FormControl
        fullWidth={true}
        error={rawErrors.length ? true : false}
        required={required}>
        {children}
        {displayLabel && rawDescription ? (
          <Typography variant="caption" color="textSecondary">
            {rawDescription}
          </Typography>
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
        {rawHelp && <FormHelperText id={id}>{rawHelp}</FormHelperText>}
      </FormControl>
    </WrapIfAdditional>
  );
};

export default FieldTemplate;
