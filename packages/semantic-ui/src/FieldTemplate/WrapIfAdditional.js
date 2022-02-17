import React from 'react';
import { Button, Grid, Form } from "semantic-ui-react";
import { utils } from '@rjsf/core';

const { ADDITIONAL_PROPERTY_FLAG } = utils;

const INPUT_STYLE = {
  width: '100%',
};

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
    <div className={classNames}>
      <Grid columns='equal'>
      <Grid.Row>
        <Grid.Column className="form-additional">
        <Form.Group key={id} widths="equal" grouped>
            <Form.Input
              className="form-group"
              hasFeedback
              fluid
              htmlFor={`${id}-key`}
              label={keyLabel}
              required={required}
              style={wrapperStyle}
              defaultValue={label}
              disabled={disabled || (readonlyAsDisabled && readonly)}
              id={`${id}-key`}
              name={`${id}-key`}
              onBlur={!readonly ? handleBlur : undefined}
              style={INPUT_STYLE}
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
