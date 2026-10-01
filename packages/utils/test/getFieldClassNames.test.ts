import { getFieldClassNames } from '../src/index.ts';

describe('getFieldClassNames()', () => {
  it('names the schema type alongside the rjsf-field marker', () => {
    expect(getFieldClassNames({ type: 'string' }, false)).toBe('rjsf-field rjsf-field-string');
  });

  it('derives the type the way getSchemaType() does', () => {
    expect(getFieldClassNames({ properties: { name: { type: 'string' } } }, false)).toBe(
      'rjsf-field rjsf-field-object',
    );
  });

  // The class is what a CSS rule has to match, so a schema with no derivable type is spelled out rather than skipped:
  // every field that renders a `FieldTemplate` agrees on the name, whatever it says
  it('spells the type class rjsf-field-undefined for a schema with no derivable type', () => {
    expect(
      getFieldClassNames({ discriminator: { propertyName: 'kind' }, oneOf: [{ $ref: '#/definitions/a' }] }, false),
    ).toBe('rjsf-field rjsf-field-undefined');
  });

  it('adds rjsf-field-error when the field has errors to show', () => {
    expect(getFieldClassNames({ type: 'number' }, true)).toBe('rjsf-field rjsf-field-number rjsf-field-error');
  });

  it('appends ui:classNames last, so it can override the rest', () => {
    expect(getFieldClassNames({ type: 'number' }, true, 'custom-class another')).toBe(
      'rjsf-field rjsf-field-number rjsf-field-error custom-class another',
    );
  });

  it('ignores an empty ui:classNames rather than leaving a trailing space', () => {
    expect(getFieldClassNames({ type: 'number' }, false, '')).toBe('rjsf-field rjsf-field-number');
  });
});
