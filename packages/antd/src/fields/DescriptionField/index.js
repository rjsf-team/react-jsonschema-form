import React from 'react';
// import PropTypes from 'prop-types';

import { FieldProps } from 'react-jsonschema-form';

const DescriptionField = ({
  // autofocus,
  description,
  // disabled,
  // errorSchema,
  // formContext,
  // formData,
  id,
  // idSchema,
  // name,
  // onChange,
  // readonly,
  // registry,
  // required,
  // schema,
  // uiSchema,
}) => <span id={id}>{description}</span>;

DescriptionField.propTypes = FieldProps;

export default DescriptionField;
