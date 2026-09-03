import type { Field, FormContextType, RegistryFieldsType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import ArrayField from './ArrayField.tsx';
import BooleanField from './BooleanField.tsx';
import CyclicSchemaField from './CyclicSchemaField.tsx';
import FallbackField from './FallbackField.tsx';
import LayoutGridField from './LayoutGridField.tsx';
import LayoutHeaderField from './LayoutHeaderField.tsx';
import LayoutMultiSchemaField from './LayoutMultiSchemaField.tsx';
import MultiSchemaField from './MultiSchemaField.tsx';
import NullField from './NullField.tsx';
import NumberField from './NumberField.tsx';
import ObjectField from './ObjectField.tsx';
import OptionalDataControlsField from './OptionalDataControlsField.tsx';
import SchemaField from './SchemaField.tsx';
import StringField from './StringField.tsx';

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
