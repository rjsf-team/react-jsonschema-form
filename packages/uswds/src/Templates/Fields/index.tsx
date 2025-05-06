import ArrayField from './ArrayField';
import BooleanField from './BooleanField';
import NumberField from './NumberField';
import ObjectField from './ObjectField';
import StringField from './StringField';

export const Fields = {
  ArrayField,
  BooleanField,
  NumberField,
  ObjectField,
  StringField,
} as const;

export default Fields;
