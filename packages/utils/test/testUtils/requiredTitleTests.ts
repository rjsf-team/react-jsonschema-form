import type { RJSFSchema, ValidatorType } from '../../src/index.ts';

const N: RJSFSchema = { type: 'string', title: 'Full name' };
const item = (keywords: RJSFSchema, name: RJSFSchema = N): RJSFSchema => ({
  type: 'object',
  properties: { flag: { type: 'boolean' }, name },
  ...keywords,
});
const requiredThen: RJSFSchema = {
  if: { properties: { flag: { const: true } }, required: ['flag'] },
  then: { required: ['name'] },
};
const inArrayItem = (schema: RJSFSchema): RJSFSchema => ({
  $defs: { N },
  type: 'object',
  properties: { arr: { type: 'array', items: schema } },
});

/** Runs the cases where a missing required property is named by a `title` its error's schema doesn't hold itself: one
 * behind the property's own `$ref`, or in the field holding the branch that requires it. Each validator package runs
 * them against its validator.
 *
 * @param buildValidator - Returns the package's validator
 */
export default function requiredTitleTests(buildValidator: () => ValidatorType) {
  describe('naming a missing required property by its title', () => {
    it.each<[string, RJSFSchema, unknown, string]>([
      [
        'whose schema is a $ref',
        { $defs: { N }, type: 'object', required: ['name'], properties: { name: { $ref: '#/$defs/N' } } },
        {},
        'Full name',
      ],
      [
        'whose schema is a $ref beside a title of its own',
        { $defs: { N }, type: 'object', required: ['name'], properties: { name: { title: 'Own', $ref: '#/$defs/N' } } },
        {},
        'Own',
      ],
      [
        'whose schema is a $ref, inside an array item',
        inArrayItem(item({ required: ['name'] }, { $ref: '#/$defs/N' })),
        { arr: [{}] },
        'Full name',
      ],
      [
        'required by a then branch, inside an array item',
        inArrayItem(item(requiredThen)),
        { arr: [{ flag: true }] },
        'Full name',
      ],
      [
        'required by a then branch, under a $ref',
        { $defs: { F: item(requiredThen) }, type: 'object', properties: { a: { $ref: '#/$defs/F' } } },
        { a: { flag: true } },
        'Full name',
      ],
      [
        'required by an allOf branch, inside an array item',
        inArrayItem(item({ allOf: [{ required: ['name'] }] })),
        { arr: [{}] },
        'Full name',
      ],
      [
        'whose schema is a $ref, required by a then branch inside an array item',
        inArrayItem(item(requiredThen, { $ref: '#/$defs/N' })),
        { arr: [{ flag: true }] },
        'Full name',
      ],
    ])('%s', (_, schema, formData, title) => {
      const required = buildValidator()
        .validateFormData(formData, schema)
        .errors.filter((error) => error.name === 'required');
      expect(required).toEqual([expect.objectContaining({ title, message: expect.stringContaining(`'${title}'`) })]);
    });
  });
}
