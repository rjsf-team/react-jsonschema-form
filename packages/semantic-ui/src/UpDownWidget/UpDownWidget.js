/* eslint-disable react/prop-types */
import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'semantic-ui-react';
import RawErrors from '../RawErrors';

function UpDownWidget({
  id,
  required,
  readonly,
  disabled,
  label,
  value,
  options,
  onChange,
  onBlur,
  onFocus,
  autofocus,
  rawErrors,
}) {
  const { displayError, semanticProps } = options;
  // eslint-disable-next-line no-shadow
  const _onChange = ({ target: { value } }) => onChange && onChange(value);
  const _onBlur = () =>
    onBlur && onBlur(id, value);
  const _onFocus = () => onFocus && onFocus(id, value);

  return (
    <React.Fragment>
      <Form.Input
        id={id}
        key={id}
        autoFocus={autofocus}
        required={required}
        error={rawErrors && rawErrors.length > 0}
        type="number"
        label={label}
        disabled={disabled || readonly}
        name={name}
        {...semanticProps}
        value={value || ''}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
      />
      <RawErrors errors={rawErrors} displayError={displayError} />
    </React.Fragment>
  );
}

UpDownWidget.defaultProps = {
  options: {
    semanticProps: {
      inverted: false,
      fluid: true,
    },
    displayError: false,
  },
};

UpDownWidget.propTypes = {
  options: PropTypes.object,
};

export default UpDownWidget;
