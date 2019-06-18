import arrays from "./arrays";
import anyOf from "./anyOf";
import oneOf from "./oneOf";
import nested from "./nested";
import numbers from "./numbers";
import simple from "./simple";
import widgets from "./widgets";
import ordering from "./ordering";
import references from "./references";
import custom from "./custom";
import errors from "./errors";
import large from "./large";
import date from "./date";
import validation from "./validation";
import files from "./files";
import single from "./single";
import customArray from "./customArray";
import customObject from "./customObject";
import alternatives from "./alternatives";
import propertyDependencies from "./propertyDependencies";
import schemaDependencies from "./schemaDependencies";
import additionalProperties from "./additionalProperties";
import nullable from "./nullable";
import nullField from "./null";

export const samples = {
  Simple: simple,
  Nested: nested,
  Arrays: arrays,
  Numbers: numbers,
  Widgets: widgets,
  Ordering: ordering,
  References: references,
  Custom: custom,
  Errors: errors,
  Large: large,
  "Date & time": date,
  Validation: validation,
  Files: files,
  Single: single,
  "Custom Array": customArray,
  "Custom Object": customObject,
  Alternatives: alternatives,
  "Property dependencies": propertyDependencies,
  "Schema dependencies": schemaDependencies,
  "Additional Properties": additionalProperties,
  "Any Of": anyOf,
  "One Of": oneOf,
  "Null fields": nullField,
  Nullable: nullable,
};
