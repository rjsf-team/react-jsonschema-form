/* eslint-disable react/prop-types */
import React from "react";
import PropTypes from "prop-types";
import { Form } from "semantic-ui-react";
import RawErrors from "../RawErrors";

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
  rawErrors,
}) {
  const { errorOptions, semanticProps } = options;
  const { showErrors, pointing } = errorOptions;
  const error =
    rawErrors && rawErrors.length > 0
      ? { content: rawErrors[0], pointing }
      : false;
  // eslint-disable-next-line no-shadow
  const _onChange = ({ target: { value } }) =>
    onChange && onChange(value === "" ? options.emptyValue : value);
  const _onBlur = () => onBlur && onBlur(id, value);
  const _onFocus = () => onFocus && onFocus(id, value);

  return (
    <React.Fragment>
      <Form.TextArea
        id={id}
        key={id}
        label={label || schema.title}
        placeholder={placeholder}
        error={error}
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
      <RawErrors errors={rawErrors} displayError={showErrors} />
    </React.Fragment>
  );
}

TextareaWidget.defaultProps = {
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

TextareaWidget.propTypes = {
  options: PropTypes.object,
};

export default TextareaWidget;
