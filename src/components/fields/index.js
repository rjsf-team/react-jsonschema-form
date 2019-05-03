import ArrayField from "./ArrayField";
import BooleanField from "./BooleanField";
import DescriptionField from "./DescriptionField";
import MultiSchemaField from "./MultiSchemaField";
import NumberField from "./NumberField";
import ObjectField from "./ObjectField";
import SchemaField from "./SchemaField";
import StringField from "./StringField";
import TitleField from "./TitleField";
import NullField from "./NullField";
import UnsupportedField from "./UnsupportedField";

export default {
  AnyOfField: MultiSchemaField,
  ArrayField,
  BooleanField,
  DescriptionField,
  NumberField,
  ObjectField,
  OneOfField: MultiSchemaField,
  SchemaField,
  StringField,
  TitleField,
  NullField,
  UnsupportedField,
};
