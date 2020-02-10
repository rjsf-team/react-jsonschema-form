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
    rawErrors,
    onFocus,
  } = props;
  const { errorOptions, semanticProps } = options;
  const { pointing } = errorOptions;
  const error = rawErrors && rawErrors.length > 0 ? { content: rawErrors[0], pointing } : false;
  const _onChange = (event, data) => onChange && onChange(data.checked);
  const _onBlur = () =>
    onBlur && onBlur(id, value);
  const _onFocus = () => onFocus && onFocus(id, value);
  return (
    <Form.Field required={required} error={error}>
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
    errorOptions: {
      pointing: 'left',
    },
  },
};

export default CheckboxWidget;
