import React from 'react';
import { FieldTemplateProps } from '@rjsf/core';

import { useMuiComponent } from '../MuiComponentContext';
import WrapIfAdditional from './WrapIfAdditional';

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
}: FieldTemplateProps) => {
  if (hidden) {
    return children;
  }
  const { FormControl, FormHelperText, List, ListItem, Typography } = useMuiComponent();
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
      schema={schema}
    >
      <FormControl fullWidth={true} error={rawErrors.length ? true : false} required={required}>
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
