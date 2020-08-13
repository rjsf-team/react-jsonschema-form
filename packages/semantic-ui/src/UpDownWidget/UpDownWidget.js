/* eslint-disable react/prop-types */
import React from "react";
import PropTypes from "prop-types";
import { Form } from "semantic-ui-react";
import { getSemanticProps } from
'../util';

function UpDownWidget({
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
  rawErrors,
  formContext,
}) {
  const semanticProps = getSemanticProps({ formContext, options });
  // eslint-disable-next-line no-shadow
  const _onChange = ({ target: { value } }) => onChange && onChange(value);
  const _onBlur = () => onBlur && onBlur(id, value);
  const _onFocus = () => onFocus && onFocus(id, value);
  return (
    <React.Fragment>
      <Form.Input
        id={id}
        key={id}
        autoFocus={autofocus}
        required={required}
        type="number"
        label={label}
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
