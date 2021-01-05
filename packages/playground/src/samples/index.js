import additionalProperties from "./additionalProperties";
import allOf from "./allOf";
import alternatives from "./alternatives";
import anyOf from "./anyOf";
import arrays from "./arrays";
import custom from "./custom";
import customArray from "./customArray";
import customObject from "./customObject";
import date from "./date";
import defaults from "./defaults";
import errorSchema from "./errorSchema";
import errors from "./errors";
import errorsLocalization from "./errorsLocalization";
import examples from "./examples";
import files from "./files";
import large from "./large";
import nested from "./nested";
import nullField from "./null";
import nullable from "./nullable";
import numbers from "./numbers";
import oneOf from "./oneOf";
import ordering from "./ordering";
import propertyDependencies from "./propertyDependencies";
import references from "./references";
import schemaDependencies from "./schemaDependencies";
import simple from "./simple";
import single from "./single";
import validation from "./validation";
import widgets from "./widgets";

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
  "Errors Localization": errorsLocalization,
  Examples: examples,
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
  "All Of": allOf,
  "Null fields": nullField,
  Nullable: nullable,
  ErrorSchema: errorSchema,
  Defaults: defaults,
};
