/* eslint-disable react/prop-types */
import React from "react";
import PropTypes from "prop-types";
import { Form } from "semantic-ui-react";
import { getSemanticProps } from
'../util';
import {  utils } from "@rjsf/core";
const { getDisplayLabel } = utils;
function UpDownWidget(props) {
  const {
    id,
    required,
    readonly,
    disabled,
    label,
    name,
    value,
    options,
    onChange,
    onBlur,
    onFocus,
    autofocus,
    formContext,
    schema,
    uiSchema,
  } = props;
  const semanticProps = getSemanticProps({ formContext, options });
  // eslint-disable-next-line no-shadow
  const _onChange = ({ target: { value } }) => onChange && onChange(value);
  const _onBlur = () => onBlur && onBlur(id, value);
  const _onFocus = () => onFocus && onFocus(id, value);
  const displayLabel = getDisplayLabel(
    schema,
    uiSchema
    /* TODO: , rootSchema */
  );
  return (
    <React.Fragment>
      <Form.Input
        id={id}
        key={id}
        autoFocus={autofocus}
        required={required}
        type="number"
        label={displayLabel ? label || schema.title : false}
        disabled={disabled || readonly}
        name={name}
        {...semanticProps}
        value={value || value === 0 ? value : ""}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
      />
    </React.Fragment>
  );
}

UpDownWidget.defaultProps = {
  options: {
    semantic: {
      inverted: false,
      fluid: true,
    },
  },
};

UpDownWidget.propTypes = {
  options: PropTypes.object,
};

export default UpDownWidget;
