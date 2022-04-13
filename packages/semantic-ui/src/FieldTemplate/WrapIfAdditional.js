import { utils } from '@rjsf/core';
import React from 'react';
import { Button, Form, Grid } from "semantic-ui-react";

const { ADDITIONAL_PROPERTY_FLAG } = utils;

const WrapIfAdditional = ({
  children,
  classNames,
  disabled,
  formContext,
  id,
  label,
  onDropPropertyClick,
  onKeyChange,
  readonly,
  required,
  schema,
}) => {
  const {
    readonlyAsDisabled = true,
    wrapperStyle,
  } = formContext;

  const keyLabel = `${label} Key`; // i18n ?
  const additional = schema.hasOwnProperty(ADDITIONAL_PROPERTY_FLAG);

  if (!additional) {
    return <>{children}</>;
  }

  const handleBlur = ({ target }) => onKeyChange(target.value);

  return (
    <div className={classNames} key={`${id}-key`}>
      <Grid columns='equal'>
      <Grid.Row>
        <Grid.Column className="form-additional">
        <Form.Group  widths="equal" grouped>
            <Form.Input
              className="form-group"
              hasFeedback
              fluid
              htmlFor={`${id}`}
              label={keyLabel}
              required={required}
              defaultValue={label}
              disabled={disabled || (readonlyAsDisabled && readonly)}
              id={`${id}`}
              name={`${id}`}
              onBlur={!readonly ? handleBlur : undefined}
              style={wrapperStyle}
              type="text"
            >
            </Form.Input>
          </Form.Group >
        </Grid.Column>
        <Grid.Column className="form-additional"  verticalAlign="middle">
          {children}
        </Grid.Column>
        <Grid.Column>
          <Button
              size="mini"
              icon="trash"
              className="array-item-remove"
              tabIndex="-1"
              disabled={disabled || readonly}
              onClick={onDropPropertyClick(label)}
            />
        </Grid.Column>
      </Grid.Row>
      </Grid>
    </div>
  );
};

export default WrapIfAdditional;
