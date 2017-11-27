import PropTypes from "prop-types";

const { func, object, objectOf, oneOfType, shape } = PropTypes;

export const registryShape = shape({
  widgets: objectOf(oneOfType([func, object])).isRequired,
  fields: objectOf(func).isRequired,
  definitions: object.isRequired,
  formContext: object.isRequired,
  ArrayFieldTemplate: func,
  ObjectFieldTemplate: func,
  FieldTemplate: func,
});
