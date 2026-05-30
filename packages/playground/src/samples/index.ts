import additionalProperties from './additionalProperties';
import allOf from './allOf';
import alternatives from './alternatives';
import anyOf from './anyOf';
import arrays from './arrays';
import bundledSchema from './bundledSchema';
import custom from './custom';
import customArray from './customArray';
import customField from './customField';
import customFieldAnyOf from './customFieldAnyOf';
import customObject from './customObject';
import date from './date';
import defaults from './defaults';
import enumObjects from './enumObjects';
import errors from './errors';
import errorSchema from './errorSchema';
import examples from './examples';
import fallback from './fallback';
import files from './files';
import ifThenElse from './ifThenElse';
import large from './large';
import layoutGrid from './layoutGrid';
import nested from './nested';
import nullField from './null';
import nullable from './nullable';
import numbers from './numbers';
import oneOf from './oneOf';
import optionalDataControls from './optionalDataControls';
import options from './options';
import ordering from './ordering';
import patternProperties from './patternProperties';
import propertyDependencies from './propertyDependencies';
import references from './references';
import type { Sample } from './Sample';
import schemaDependencies from './schemaDependencies';
import simple from './simple';
import single from './single';
import validation from './validation';
import widgets from './widgets';

export type { Sample };

const _samples: Record<string, Sample> = {
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

export const samples = _samples;
