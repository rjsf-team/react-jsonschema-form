/* eslint-disable react/prop-types */
import React from "react";
import { Form } from "semantic-ui-react";
import { getSemanticProps } from '../util';

function UpDownWidget(props) {
  const {
    id,
    name,
    label,
    value,
    required,
    readonly,
    disabled,
    onChange,
    onBlur,
    onFocus,
    autofocus,
    options,
    schema,
    uiSchema,
    formContext,
    registry,
  } = props;
  const semanticProps = getSemanticProps(
    { formContext,
      options,
      uiSchema,
  });
  const { schemaUtils } = registry;
  // eslint-disable-next-line no-shadow
  const _onChange = ({ target: { value } }) => onChange && onChange(value);
  const _onBlur = () => onBlur && onBlur(id, value);
  const _onFocus = () => onFocus && onFocus(id, value);
  const displayLabel = schemaUtils.getDisplayLabel(schema, uiSchema);
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
export default UpDownWidget;
