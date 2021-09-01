/* eslint-disable react/prop-types */
import { utils } from "@visma/rjsf-core";
import PropTypes from "prop-types";
import React from "react";
import { Form } from "semantic-ui-react";
import { getSemanticProps } from "../util";
const { getDisplayLabel } = utils;
function TextareaWidget(props) {
  const {
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
    uiSchema,
    formContext,
  } = props;
  const semanticProps = getSemanticProps({ formContext, options });
  // eslint-disable-next-line no-shadow
  const _onChange = ({ target: { value } }) =>
    onChange && onChange(value === "" ? options.emptyValue : value);
  const _onBlur = () => onBlur && onBlur(id, value);
  const _onFocus = () => onFocus && onFocus(id, value);
  const displayLabel = getDisplayLabel(
    schema,
    uiSchema
    /* TODO: , rootSchema */
  );
  return (
    <Form.TextArea
      id={id}
      key={id}
      label={displayLabel ? label || schema.title : false}
      placeholder={placeholder}
      autoFocus={autofocus}
      required={required}
      disabled={disabled || readonly}
      name={name}
      {...semanticProps}
      value={value || ""}
      rows={options.rows || 5}
      onChange={_onChange}
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
