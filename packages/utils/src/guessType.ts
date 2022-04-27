
// In the case where we have to implicitly create a schema, it is useful to know what type to use
//  based on the data we are defining
export default function guessType(value: any) {
  if (Array.isArray(value)) {
    return 'array';
  } else if (typeof value === 'string') {
    return 'string';
  } else if (value == null) {
    return 'null';
  } else if (typeof value === 'boolean') {
    return 'boolean';
  } else if (!isNaN(value)) {
    return 'number';
  } else if (typeof value === 'object') {
    return 'object';
  }
  // Default to string if we can't figure it out
  return 'string';
};
