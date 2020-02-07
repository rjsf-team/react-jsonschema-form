/* eslint-disable react/prop-types */
import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'semantic-ui-react';
import RawErrors from '../RawErrors';

function TextWidget({
  id,
  required,
  readonly,
  disabled,
  label,
  value,
  onChange,
  onBlur,
  onFocus,
  autofocus,
  options,
  rawErrors,
  schema,
}) {
  const { displayError, semanticProps } = options;
  // eslint-disable-next-line no-shadow
  const _onChange = ({ target: { value } }) => onChange(value === '' ? options.emptyValue : value);
  const _onBlur = () =>
    onBlur && onBlur(id, value);
  const _onFocus = () => onFocus && onFocus(id, value);
  return (
    <React.Fragment>
      <Form.Input
        key={id}
        id={id}
        error={rawErrors && rawErrors.length > 0}
        label={label || schema.title}
        autoFocus={autofocus}
        required={required}
        disabled={disabled || readonly}
        name={name}
        {...semanticProps}
        type={schema.type}
        value={value || ''}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
      />
      <RawErrors errors={rawErrors} displayError={displayError} />
    </React.Fragment>
  );
}

TextWidget.defaultProps = {
  options: {
    semanticProps: {
      inverted: false,
      fluid: true,
    },
    displayError: false,
  },
};

TextWidget.propTypes = {
  options: PropTypes.object,
};

export default TextWidget;
