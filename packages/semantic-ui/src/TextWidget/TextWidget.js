/* eslint-disable react/prop-types */
import React from "react";
import PropTypes from "prop-types";
import { Form, Grid } from "semantic-ui-react";
import RawErrors from "../RawErrors";

function TextWidget({
  id,
  required,
  readonly,
  disabled,
  label,
  name,
  value,
  onChange,
  onBlur,
  onFocus,
  autofocus,
  options,
  rawErrors,
  schema,
}) {
  const { errorOptions, semanticProps } = options;
  const { showErrors, pointing } = errorOptions;
  const error =
    rawErrors && rawErrors.length > 0
      ? { content: rawErrors[0], pointing }
      : false;
  // eslint-disable-next-line no-shadow
  const _onChange = ({ target: { value } }) =>
    onChange(value === "" ? options.emptyValue : value);
  const _onBlur = () => onBlur && onBlur(id, value);
  const _onFocus = () => onFocus && onFocus(id, value);
  return (
    <Grid>
      <Grid.Column width={3} verticalAlign="middle">
        <label htmlFor={id}>{label || schema.title}</label>
      </Grid.Column>
      <Grid.Column width={13}>
        <Form.Input
          key={id}
          id={id}
          required={required}
          error={error}
          autoFocus={autofocus}
          disabled={disabled || readonly}
          name={name}
          {...semanticProps}
          value={value || ""}
          onChange={_onChange}
          onBlur={_onBlur}
          onFocus={_onFocus}
        />
        <RawErrors errors={rawErrors} displayError={showErrors} />
      </Grid.Column>
    </Grid>
  );
}

TextWidget.defaultProps = {
  options: {
    semanticProps: {
      inverted: false,
      fluid: true,
    },
    errorOptions: {
      showErrors: false,
      pointing: "above",
    },
  },
};

TextWidget.propTypes = {
  options: PropTypes.object,
};

export default TextWidget;
