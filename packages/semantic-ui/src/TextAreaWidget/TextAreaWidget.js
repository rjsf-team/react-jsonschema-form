/* eslint-disable react/prop-types */
import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'semantic-ui-react';
import RawErrors from '../RawErrors';

function TextAreaWidget({
  id,
  placeholder,
  value,
  required,
  disabled,
  autofocus,
  label,
  readonly,
  onBlur,
  onFocus,
  onChange,
  options,
  schema,
  rawErrors,
}) {
  const { displayError, semanticProps } = options;
  // eslint-disable-next-line no-shadow
  const _onChange = ({ target: { value } }) => onChange && onChange(value === '' ? options.emptyValue : value);
  const _onBlur = () =>
    onBlur && onBlur(id, value);
  const _onFocus = () => onFocus && onFocus(id, value);

  return (
    <React.Fragment>
      <Form.TextArea
        id={id}
        key={id}
        label={label || schema.title}
        placeholder={placeholder}
        error={rawErrors && rawErrors.length > 0}
        autoFocus={autofocus}
        required={required}
        disabled={disabled || readonly}
        name={name}
        {...semanticProps}
        type={schema.type}
        value={value || ''}
        rows={options.rows || 5}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
      />
      <RawErrors errors={rawErrors} displayError={displayError} />
    </React.Fragment>
  );
}

TextAreaWidget.defaultProps = {
  options: {
    semanticProps: {
      inverted: false,
      fluid: true,
    },
    displayError: false,
  },
};

TextAreaWidget.propTypes = {
  options: PropTypes.object,
};

export default TextAreaWidget;
