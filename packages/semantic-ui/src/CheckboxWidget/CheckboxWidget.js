/* eslint-disable react/prop-types */
import React from 'react';
import { Form, Checkbox } from 'semantic-ui-react';

function CheckboxWidget(props) {
  const {
    id,
    value,
    required,
    disabled,
    readonly,
    label,
    autofocus,
    onChange,
    onBlur,
    options,
    onFocus,
  } = props;
  const { semanticProps } = options;
  const _onChange = (event, data) => onChange && onChange(data.checked);
  const _onBlur = () =>
    onBlur && onBlur(id, value);
  const _onFocus = () => onFocus && onFocus(id, value);
  return (
    <Form.Field required={required}>
      <Checkbox
        id={id}
        checked={typeof value === 'undefined' ? false : value}
        disabled={disabled || readonly}
        autoFocus={autofocus}
        {...semanticProps}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
        required={required}
        label={label}
      />
    </Form.Field>
  );
}

CheckboxWidget.defaultProps = {
  options: {
    semanticProps: {},
  },
};

export default CheckboxWidget;
