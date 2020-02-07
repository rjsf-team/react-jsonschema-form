/* eslint-disable react/prop-types */
import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'semantic-ui-react';
import { rangeSpec } from 'react-jsonschema-form/lib/utils';
import RawErrors from '../RawErrors';


function RangeWidget({
  value,
  readonly,
  disabled,
  onBlur,
  onFocus,
  options,
  schema,
  onChange,
  required,
  rawErrors,
  label,
  id,
}) {
  const { displayError, semanticProps } = options;
  // eslint-disable-next-line no-shadow
  const _onChange = ({ target: { value } }) => onChange && onChange(value === '' ? options.emptyValue : value);
  const _onBlur = () =>
    onBlur && onBlur(id, value);
  const _onFocus = () => onFocus && onFocus(id, value);
  const sliderProps = { value, label, id, ...rangeSpec(schema) };
  return (
    <React.Fragment>
      <Form.Input
        id={id}
        key={id}
        {...sliderProps}
        error={rawErrors && rawErrors.length > 0}
        label={label || schema.title}
        required={required}
        disabled={disabled || readonly}
        name={name}
        {...semanticProps}
        type="range"
        value={value || ''}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
      />
      <RawErrors errors={rawErrors} displayError={displayError} />
    </React.Fragment>
  );
}

RangeWidget.defaultProps = {
  options: {
    semanticProps: {
      inverted: false,
      fluid: true,
    },
    displayError: false,
  },
};

RangeWidget.propTypes = {
  options: PropTypes.object,
};

export default RangeWidget;
