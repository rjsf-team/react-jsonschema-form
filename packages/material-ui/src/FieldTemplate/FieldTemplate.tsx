import React from "react";

import { FieldTemplateProps, utils } from "@visma/rjsf-core";

import FormControl from "@material-ui/core/FormControl";
import FormHelperText from "@material-ui/core/FormHelperText";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import Typography from "@material-ui/core/Typography";

import WrapIfAdditional from "./WrapIfAdditional";

const FieldTemplate = ({
  id,
  children,
  classNames,
  disabled,
  displayLabel,
  label,
  onDropPropertyClick,
  onKeyChange,
  readonly,
  required,
  rawErrors = [],
  rawHelp,
  rawDescription,
  schema,
}: FieldTemplateProps) => {
  return (
    <WrapIfAdditional
      classNames={classNames}
      disabled={disabled}
      id={id}
      label={label}
      onDropPropertyClick={onDropPropertyClick}
      onKeyChange={onKeyChange}
      readonly={readonly}
      required={required}
      schema={schema}>
      <FormControl
        fullWidth={true}
        error={rawErrors.length ? true : false}
        required={required}>
        {children}
        {displayLabel && rawDescription ? (
          <Typography
            id={utils.descriptionId(id)}
            variant="caption"
            color="textSecondary">
            {rawDescription}
          </Typography>
        ) : null}
        {rawErrors.length > 0 && (
          <List id={utils.errorsId(id)} dense={true} disablePadding={true}>
            {rawErrors.map((error, i: number) => {
              return (
                <ListItem key={i} disableGutters={true}>
                  <FormHelperText>{error}</FormHelperText>
                </ListItem>
              );
            })}
          </List>
        )}
        {rawHelp && (
          <FormHelperText id={utils.helpId(id)}>{rawHelp}</FormHelperText>
        )}
      </FormControl>
    </WrapIfAdditional>
  );
};

export default FieldTemplate;
