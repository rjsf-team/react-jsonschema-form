import type { RJSFSchema } from '../src/index.ts';
import { ADDITIONAL_PROPERTY_FLAG, englishStringTranslator, getFieldLabel } from '../src/index.ts';

const translateString = englishStringTranslator;

describe('getFieldLabel()', () => {
  it('prefers the ui:title, then the unresolved and resolved schema titles, then the title prop, then the name', () => {
    const schema: RJSFSchema = { type: 'string', title: 'Resolved' };
    const unresolvedSchema: RJSFSchema = { $ref: '#/definitions/foo', title: 'Unresolved' };
    const sources = { name: 'foo', title: 'Prop', unresolvedSchema };
    expect(getFieldLabel(schema, { title: 'Ui' }, translateString, sources)).toBe('Ui');
    expect(getFieldLabel(schema, {}, translateString, sources)).toBe('Unresolved');
    expect(getFieldLabel(schema, {}, translateString, { ...sources, unresolvedSchema: undefined })).toBe('Resolved');
    expect(getFieldLabel({ type: 'string' }, {}, translateString, { name: 'foo', title: 'Prop' })).toBe('Prop');
    expect(getFieldLabel({ type: 'string' }, {}, translateString, { name: 'foo' })).toBe('foo');
  });

  // An empty title is no title (#5394)
  it('falls through an empty title to the name', () => {
    expect(getFieldLabel({ type: 'string', title: '' }, { title: '' }, translateString, { name: 'foo' })).toBe('foo');
  });

  it('returns an empty label for a field with no title and no name', () => {
    expect(getFieldLabel({ type: 'string' }, {}, translateString)).toBe('');
  });

  it('labels an additionalProperties entry by its key rather than its schema title', () => {
    const schema = { type: 'string', title: 'Entry', [ADDITIONAL_PROPERTY_FLAG]: true } as RJSFSchema;
    expect(getFieldLabel(schema, { title: 'Ui' }, translateString, { name: 'key' })).toBe('key');
  });

  it('labels a renamed key by the name the user typed', () => {
    expect(
      getFieldLabel({ type: 'string', title: 'Entry' }, {}, translateString, {
        name: 'typed',
        wasPropertyKeyModified: true,
      }),
    ).toBe('typed');
  });

  it('decorates the label of a deprecated field', () => {
    expect(getFieldLabel({ type: 'string', title: 'Old', deprecated: true }, {}, translateString)).toBe(
      'Old (deprecated)',
    );
  });

  it('leaves a deprecated field undecorated under another deprecatedHandling', () => {
    expect(
      getFieldLabel(
        { type: 'string', title: 'Old', deprecated: true },
        { deprecatedHandling: 'disable' },
        translateString,
      ),
    ).toBe('Old');
  });

  it('leaves a deprecated field with no label unlabelled', () => {
    expect(getFieldLabel({ type: 'string', deprecated: true }, {}, translateString)).toBe('');
  });
});
