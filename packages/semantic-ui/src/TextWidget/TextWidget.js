/* eslint-disable react/prop-types */
import React from "react";
import PropTypes from "prop-types";
import { Form } from "semantic-ui-react";
import { getSemanticProps } from "../util";

function TextWidget(props) {
  const {
    id,
    required,
    readonly,
    disabled,
    name,
    label,
    schema,
    value,
    onChange,
    onBlur,
    onFocus,
    autofocus,
    options,
    formContext,
  } = props;
  const semanticProps = getSemanticProps({ formContext, options });
  console.info("props - text widget", props);
  // eslint-disable-next-line no-shadow
  const _onChange = ({ target: { value } }) =>
    onChange(value === "" ? options.emptyValue : value);
  const _onBlur = () => onBlur && onBlur(id, value);
  const _onFocus = () => onFocus && onFocus(id, value);

  return (
    <React.Fragment>
      <Form.Field>
        <label required={required}>{schema.title || label}</label>
        <Form.Input
          key={id}
          id={id}
          type={schema.type}
          required={required}
          label={schema.title || label}
          autoFocus={autofocus}
          disabled={disabled || readonly}
          name={name}
          {...semanticProps}
          value={value || ""}
          onChange={_onChange}
          onBlur={_onBlur}
          onFocus={_onFocus}
        />
      </Form.Field>
    </React.Fragment>
  );
}

TextWidget.defaultProps = {
  options: {
    semantic: {
      fluid: true,
      inverted: false,
    },
  },
};

TextWidget.propTypes = {
  options: PropTypes.object,
};

export default TextWidget;
