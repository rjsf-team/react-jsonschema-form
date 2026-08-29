import additionalProperties from './additionalProperties.js';
import allOf from './allOf.js';
import alternatives from './alternatives.js';
import anyOf from './anyOf.js';
import arrays from './arrays.js';
import bundledSchema from './bundledSchema.js';
import custom from './custom.js';
import customArray from './customArray.js';
import customField from './customField.js';
import customFieldAnyOf from './customFieldAnyOf.js';
import customObject from './customObject.js';
import date from './date.js';
import defaults from './defaults.js';
import enumObjects from './enumObjects.js';
import errors from './errors.js';
import errorSchema from './errorSchema.js';
import examples from './examples.js';
import fallback from './fallback.js';
import files from './files.js';
import ifThenElse from './ifThenElse.js';
import large from './large.js';
import layoutGrid from './layoutGrid.js';
import nested from './nested.js';
import nullField from './null.js';
import nullable from './nullable.js';
import numbers from './numbers.js';
import oneOf from './oneOf.js';
import optionalDataControls from './optionalDataControls.js';
import options from './options.js';
import ordering from './ordering.js';
import patternProperties from './patternProperties.js';
import propertyDependencies from './propertyDependencies.js';
import references from './references.js';
import type { Sample } from './Sample.js';
import schemaDependencies from './schemaDependencies.js';
import simple from './simple.js';
import single from './single.js';
import validation from './validation.js';
import widgets from './widgets.js';

const samplesList: Record<string, Sample> = {
  Blank: { schema: {}, uiSchema: {}, formData: {} },
  Simple: simple,
  'UI Options': options,
  Nested: nested,
  Arrays: arrays,
  Numbers: numbers,
  Widgets: widgets,
  Ordering: ordering,
  References: references,
  Custom: custom,
  Errors: errors,
  Examples: examples,
  Large: large,
  'Date & time': date,
  Validation: validation,
  Files: files,
  Single: single,
  'Custom Array': customArray,
  'Custom Object': customObject,
  Alternatives: alternatives,
  'Property dependencies': propertyDependencies,
  'Schema dependencies': schemaDependencies,
  'Additional Properties': additionalProperties,
  'Pattern Properties': patternProperties,
  'Any Of': anyOf,
  'Any Of with Custom Field': customFieldAnyOf,
  'One Of': oneOf,
  'All Of': allOf,
  'If Then Else': ifThenElse,
  'Null fields': nullField,
  'Enumerated objects': enumObjects,
  Nullable: nullable,
  ErrorSchema: errorSchema,
  Defaults: defaults,
  'Custom Field': customField,
  'Layout Grid': layoutGrid,
  'Bundled Schema': bundledSchema,
  'Optional Data Controls': optionalDataControls,
  'Fallback (unknown schema)': fallback,
};

export const samples = samplesList;
