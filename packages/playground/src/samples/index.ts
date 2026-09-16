import additionalProperties from './additionalProperties.ts';
import allOf from './allOf.ts';
import alternatives from './alternatives.ts';
import anyOf from './anyOf.ts';
import arrays from './arrays.ts';
import bundledSchema from './bundledSchema.ts';
import custom from './custom.ts';
import customArray from './customArray.tsx';
import customField from './customField.ts';
import customFieldAnyOf from './customFieldAnyOf.tsx';
import customObject from './customObject.tsx';
import date from './date.ts';
import defaults from './defaults.ts';
import enumObjects from './enumObjects.ts';
import errors from './errors.ts';
import errorSchema from './errorSchema.ts';
import examples from './examples.ts';
import fallback from './fallback.ts';
import files from './files.ts';
import ifThenElse from './ifThenElse.ts';
import large from './large.ts';
import layoutGrid from './layoutGrid.tsx';
import nested from './nested.ts';
import nullField from './null.ts';
import nullable from './nullable.ts';
import numbers from './numbers.ts';
import oneOf from './oneOf.ts';
import optionalDataControls from './optionalDataControls.ts';
import options from './options.ts';
import ordering from './ordering.ts';
import patternProperties from './patternProperties.ts';
import propertyDependencies from './propertyDependencies.ts';
import references from './references.ts';
import type { Sample } from './Sample.ts';
import schemaDependencies from './schemaDependencies.ts';
import simple from './simple.ts';
import single from './single.ts';
import validation from './validation.ts';
import widgets from './widgets.tsx';

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
