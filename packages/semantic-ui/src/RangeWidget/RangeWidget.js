/* eslint-disable react/prop-types */
import React from "react";
import PropTypes from "prop-types";
import { Input } from "semantic-ui-react";
import { utils } from '@rjsf/core';
import { getSemanticProps } from "../util";

const { rangeSpec } = utils;
function RangeWidget({
  value,
  readonly,
  disabled,
  onBlur,
  onFocus,
  options,
  schema,
  onChange,
  required,
  label,
  name,
  id,
  formContext,
}) {
  const semanticProps = getSemanticProps({ formContext, options });
  const { eventOnChange } = utils.hooks.useEmptyValueOnChange({ onChange, options, value });
  const _onBlur = () => onBlur && onBlur(id, value);
  const _onFocus = () => onFocus && onFocus(id, value);

  return (
    <React.Fragment>
      <Input
        id={id}
        key={id}
        name={name}
        type="range"
        required={required}
        disabled={disabled || readonly}
        {...rangeSpec(schema)}
        {...semanticProps}
        value={value || ""}
        onChange={eventOnChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
      />
      <span>{value}</span>
    </React.Fragment>
  );
}

RangeWidget.defaultProps = {
  options: {
    semantic: {
      fluid: true,
    },
  },
};

RangeWidget.propTypes = {
  options: PropTypes.object,
};

export default RangeWidget;
