import { RegistryFieldsType } from "@rjsf/utils";

import ArrayField from "./ArrayField";
import BooleanField from "./BooleanField";
import MultiSchemaField from "./MultiSchemaField";
import NumberField from "./NumberField";
import ObjectField from "./ObjectField";
import SchemaField from "./SchemaField";
import StringField from "./StringField";
import NullField from "./NullField";

const fields: RegistryFieldsType = {
  AnyOfField: MultiSchemaField,
  ArrayField,
  BooleanField,
  NumberField,
  ObjectField,
  OneOfField: MultiSchemaField,
  SchemaField,
  StringField,
  NullField,
};

export default fields;
