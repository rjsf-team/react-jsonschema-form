import type { Field, FormContextType, RegistryFieldsType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import ArrayField from './ArrayField.js';
import BooleanField from './BooleanField.js';
import CyclicSchemaField from './CyclicSchemaField.js';
import FallbackField from './FallbackField.js';
import LayoutGridField from './LayoutGridField.js';
import LayoutHeaderField from './LayoutHeaderField.js';
import LayoutMultiSchemaField from './LayoutMultiSchemaField.js';
import MultiSchemaField from './MultiSchemaField.js';
import NullField from './NullField.js';
import NumberField from './NumberField.js';
import ObjectField from './ObjectField.js';
import OptionalDataControlsField from './OptionalDataControlsField.js';
import SchemaField from './SchemaField.js';
import StringField from './StringField.js';

function fields<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(): RegistryFieldsType<T, S, F> {
  return {
    AnyOfField: MultiSchemaField,
    ArrayField: ArrayField as unknown as Field<T, S, F>,
    // ArrayField falls back to SchemaField if ArraySchemaField is not defined, which it isn't by default
    BooleanField,
    CyclicSchemaField,
    FallbackField,
    LayoutGridField,
    LayoutHeaderField,
    LayoutMultiSchemaField,
    NumberField,
    ObjectField,
    OneOfField: MultiSchemaField,
    OptionalDataControlsField,
    SchemaField,
    StringField,
    NullField,
  };
}

export default fields;
