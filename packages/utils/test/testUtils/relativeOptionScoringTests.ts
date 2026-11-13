import type { RJSFSchema, ValidatorType } from '../../src/index.ts';
import { getFirstMatchingOption } from '../../src/index.ts';

export default function relativeOptionScoringTests(createValidator: () => ValidatorType): void {
  describe('scoring options with relative references', () => {
    it.each([
      ['no child', { name: 'x' }, 1],
      ['a valid child', { name: 'x', child: { name: 'y' } }, 1],
      ['an invalid child', { name: 'x', child: { name: 5 } }, 0],
    ])('resolves a self-reference with %s', (_case, formData, expected) => {
      const options: RJSFSchema[] = [
        { type: 'object', properties: { other: { type: 'string' } } },
        {
          $id: 'defs/self.json',
          type: 'object',
          properties: { child: { $ref: 'self.json' }, name: { type: 'string' } },
        },
      ];
      const schema: RJSFSchema = { oneOf: options };

      expect(getFirstMatchingOption({ validator: createValidator() }, formData, options, schema)).toBe(expected);
    });

    it.each([
      ['no address', { name: 'x' }, 1],
      ['a valid address', { name: 'x', address: { city: 'Lagos' } }, 1],
      ['an invalid address', { name: 'x', address: { city: 5 } }, 0],
    ])('resolves a sibling reference with %s', (_case, formData, expected) => {
      const options: RJSFSchema[] = [
        { type: 'object', properties: { other: { type: 'string' } } },
        {
          $id: 'defs/person.json',
          type: 'object',
          properties: { name: { type: 'string' }, address: { $ref: 'address.json' } },
        },
      ];
      const schema: RJSFSchema = {
        oneOf: options,
        definitions: {
          address: { $id: 'defs/address.json', type: 'object', properties: { city: { type: 'string' } } },
        },
      };

      expect(getFirstMatchingOption({ validator: createValidator() }, formData, options, schema)).toBe(expected);
    });
  });
}
