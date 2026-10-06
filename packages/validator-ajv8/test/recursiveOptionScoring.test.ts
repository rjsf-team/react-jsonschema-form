/**
 * Scoring an option asserts that the form data holds at least one of the keys the option declares. An option that
 * carries an `$id` names a document that a `$ref` inside it can resolve back to -- `$ref: ''` names the document
 * itself -- so these verify that the assertion does not reach the children the option describes through such a
 * reference, where it would reject data the option itself accepts.
 *
 * Only AJV resolves a reference like that: `findSchemaDefinition()` has no base URI to resolve it against and throws
 * `Could not find a definition for .`, so a schema holding one reaches scoring through a direct call rather than
 * through `retrieveSchema()` or a parse. The last test covers the wrapping that scoring now does for every option
 * carrying an `$id`, which a precompiled validator has to have compiled.
 */

import type { RJSFSchema } from '@rjsf/utils';
import { getFirstMatchingOption } from '@rjsf/utils';

import { compileSchemaValidatorsCode } from '../src/compileSchemaValidators.ts';
import validator, { createPrecompiledValidator } from '../src/index.ts';
import { evalValidatorCode } from './harness/compileSuperSchema.ts';

const RECURSIVE_OPTION: RJSFSchema = {
  $id: 'http://example.com/a.json',
  type: 'object',
  properties: {
    child: { $ref: '' },
    label: { type: 'string' },
  },
};
const OTHER_OPTION: RJSFSchema = { type: 'object', properties: { other: { type: 'string' } } };
const OPTIONS: RJSFSchema[] = [OTHER_OPTION, RECURSIVE_OPTION];
const SCHEMA: RJSFSchema = { oneOf: OPTIONS };

describe('scoring an option that references itself', () => {
  it.each([
    ['an empty child, which the option allows', { child: {} }],
    ['a child nested two deep', { child: { child: {} } }],
    ['a child alongside a filled-in key', { label: 'x', child: {} }],
  ])('matches the recursive option for %s', (_case, formData) => {
    expect(getFirstMatchingOption({ validator }, formData, OPTIONS, SCHEMA)).toBe(1);
  });

  it('still declines an option when the data holds none of the keys it declares', () => {
    // The assertion has to keep applying at the top level: `{}` holds nothing either option declares, so there is no
    // match to make and the first option is the documented fallback
    expect(getFirstMatchingOption({ validator }, {}, OPTIONS, SCHEMA)).toBe(0);
  });

  it('scores an option that carries an $id through a precompiled validator', () => {
    const schema: RJSFSchema = {
      oneOf: [
        { $id: 'http://example.com/b.json', type: 'object', properties: { b: { type: 'string' } }, required: ['b'] },
        { $id: 'http://example.com/c.json', type: 'object', properties: { c: { type: 'number' } } },
      ],
    };
    const options = schema.oneOf as RJSFSchema[];
    const precompiled = createPrecompiledValidator(evalValidatorCode(compileSchemaValidatorsCode(schema)), schema);
    expect(getFirstMatchingOption({ validator: precompiled }, { c: 1 }, options, schema)).toBe(1);
    // The `required` an option declares is dropped for scoring, so a key the user has yet to fill in still matches
    expect(getFirstMatchingOption({ validator: precompiled }, { b: undefined }, options, schema)).toBe(0);
  });
});
