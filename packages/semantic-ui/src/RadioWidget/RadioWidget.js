/* eslint-disable react/jsx-no-undef,react/no-array-index-key,react/prop-types */
import React from "react";
import { Form, Radio } from "semantic-ui-react";
import { getSemanticProps } from "../util";

function RadioWidget(props) {
  const {
    id,
    value,
    required,
    disabled,
    readonly,
    onChange,
    onBlur,
    onFocus,
    schema,
    options,
    formContext,
    uiSchema,
  } = props;
  // Generating a unique field name to identify this set of radio buttons
  const name = Math.random().toString();
  const { enumOptions, enumDisabled } = options;
  const semanticProps = getSemanticProps(
    { formContext,
      options,
      uiSchema,
    });
  // eslint-disable-next-line no-shadow
  const _onChange = (event, { value : eventValue }) => {
    return onChange &&  onChange(schema.type === "boolean" ? eventValue !== "false" : eventValue);};
  const _onBlur = () => onBlur && onBlur(id, value);
  const _onFocus = () => onFocus && onFocus(id, value);
  const inlineOption = options.inline ? { inline: true } : { grouped: true };
  return (
    <Form.Group {...inlineOption}>
      {enumOptions.map((option, i) => {
        const itemDisabled =
          enumDisabled && enumDisabled.indexOf(option.value) !== -1;
        return (
          <Form.Field
            required={required}
            control={Radio}
            name={name}
            {...semanticProps}
            onFocus={_onFocus}
            onBlur={_onBlur}
            label={`${option.label}`}
            value={`${option.value}`}
            key={`${option.value}-${i}`}
            checked={value == option.value}
            onChange={_onChange}
            disabled={disabled || itemDisabled || readonly}
          />
        );
      })}
    </Form.Group>
  );
}
export default RadioWidget;
