import React from "react";

import { FieldTemplateProps, utils } from "@visma/rjsf-core";

import FormControl from "@material-ui/core/FormControl";
import FormHelperText from "@material-ui/core/FormHelperText";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import Typography from "@material-ui/core/Typography";

import WrapIfAdditional from "./WrapIfAdditional";

const showTitle = (schema: any, uiSchema: any) => {
  if (schema.type === 'array') {
    return schema.items.type !== 'object' && (schema.items.enum || schema.items.enumNames);
  } else if (uiSchema['ui:widget'] === 'checkbox' || (schema.type === 'boolean' && uiSchema['ui:widget'] !== 'radio')) {
    return false;
  }
  return schema.format === 'table' || !(schema.type === 'object' || (schema.type === 'string' && schema.title === undefined));
}

const FieldTemplate = ({
  id,
  children,
  classNames,
  disabled,
  displayLabel,
  hidden,
  label,
  onDropPropertyClick,
  onKeyChange,
  readonly,
  required,
  rawErrors = [],
  rawHelp,
  rawDescription,
  schema,
  uiSchema
}: FieldTemplateProps) => {
  if (hidden) {
    return null;
  }

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
        {showTitle(schema, uiSchema) ?
          <Typography variant="subtitle1">
            {label || schema.title}
            {required ? ' *' : null}
          </Typography>
          : null}
        {displayLabel && rawDescription && (schema.type !== 'boolean' || uiSchema['ui:widget'] === 'radio') ? (
          <Typography
            id={utils.descriptionId(id)}
            variant="caption"
            color="textSecondary">
            {rawDescription}
          </Typography>
        ) : null}
        {children}
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
