import { Field, FormContextType, RegistryFieldsType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import ArrayField from './ArrayField';
import BooleanField from './BooleanField';
import MultiSchemaField from './MultiSchemaField';
import NumberField from './NumberField';
import ObjectField from './ObjectField';
import SchemaField from './SchemaField';
import StringField from './StringField';
import NullField from './NullField';

function fields<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(): RegistryFieldsType<T, S, F> {
  return {
    AnyOfField: MultiSchemaField,
    ArrayField: ArrayField as unknown as Field<T, S, F>,
    // ArrayField falls back to SchemaField if ArraySchemaField is not defined, which it isn't by default
    BooleanField,
    NumberField,
    ObjectField,
    OneOfField: MultiSchemaField,
    SchemaField,
    StringField,
    NullField,
  };
}

export default fields;
