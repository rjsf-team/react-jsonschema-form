/* eslint-disable react/prop-types */
import React from "react";
import PropTypes from "prop-types";
import { Form } from "semantic-ui-react";
import { getSemanticProps } from "../util";
import {utils} from '@rjsf/core';

function TextareaWidget({
  id,
  placeholder,
  value,
  required,
  disabled,
  autofocus,
  label,
  name,
  readonly,
  onBlur,
  onFocus,
  onChange,
  options,
  schema,
  formContext,
}) {
  const semanticProps = getSemanticProps({ formContext, options });
  const { eventOnChange } = utils.hooks.useEmptyValueOnChange({ onChange, options, value });
  const _onBlur = () => onBlur && onBlur(id, value);
  const _onFocus = () => onFocus && onFocus(id, value);

  return (
    <Form.TextArea
      id={id}
      key={id}
      label={schema.title || label}
      placeholder={placeholder}
      autoFocus={autofocus}
      required={required}
      disabled={disabled || readonly}
      name={name}
      {...semanticProps}
      value={value || ""}
      rows={options.rows || 5}
      onChange={eventOnChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
    />
  );
}

TextareaWidget.defaultProps = {
  options: {
    semantic: {
      inverted: false,
    },
  },
};

TextareaWidget.propTypes = {
  options: PropTypes.object,
};

export default TextareaWidget;
