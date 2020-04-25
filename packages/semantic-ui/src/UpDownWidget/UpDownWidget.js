/* eslint-disable react/prop-types */
import React from "react";
import PropTypes from "prop-types";
import { Form } from "semantic-ui-react";
import RawErrors from "../RawErrors";

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
}) {
  const { errorOptions, semanticProps } = options;
  const { showErrors, pointing } = errorOptions;
  const error =
    rawErrors && rawErrors.length > 0
      ? { content: rawErrors[0], pointing }
      : false;
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
        error={error}
        type="number"
        label={label}
        disabled={disabled || readonly}
        name={name}
        {...semanticProps}
        value={value || ""}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
      />
      <RawErrors errors={rawErrors} displayError={showErrors} />
    </React.Fragment>
  );
}

UpDownWidget.defaultProps = {
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

UpDownWidget.propTypes = {
  options: PropTypes.object,
};

export default UpDownWidget;
