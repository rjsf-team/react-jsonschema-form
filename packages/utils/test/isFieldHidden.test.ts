import type { Registry } from '../src/index.ts';
import { createSchemaUtils, isFieldHidden, RJSF_REF_CYCLE_KEY } from '../src/index.ts';
import getTestValidator from './testUtils/getTestValidator.ts';

const rootSchema = {
  definitions: { legacy: { type: 'string', deprecated: true } },
  type: 'object',
};

const schemaUtils = createSchemaUtils({ validator: getTestValidator({}) }, rootSchema);
const registry = { rootSchema, schemaUtils } as Registry;
const hideRegistry = { ...registry, globalUiOptions: { deprecatedHandling: 'hide' } } as Registry;

describe('isFieldHidden()', () => {
  it('answers true for a hidden widget', () => {
    expect(isFieldHidden({ type: 'string' }, { 'ui:widget': 'hidden' }, registry)).toBe(true);
  });

  it('answers false for a field that is neither hidden nor deprecated', () => {
    expect(isFieldHidden({ type: 'string' }, {}, registry)).toBe(false);
  });

  it('answers true for a deprecated field with a handling of hide', () => {
    expect(isFieldHidden({ type: 'string', deprecated: true }, {}, hideRegistry)).toBe(true);
  });

  it('answers false for a deprecated field with the default handling', () => {
    expect(isFieldHidden({ type: 'string', deprecated: true }, {}, registry)).toBe(false);
  });

  it("answers true when a ui:definitions entry hides the schema's $ref", () => {
    expect(
      isFieldHidden({ $ref: '#/definitions/legacy' }, undefined, {
        ...registry,
        uiSchemaDefinitions: { '#/definitions/legacy': { 'ui:widget': 'hidden' } },
      }),
    ).toBe(true);
  });

  it('answers true when only an allOf merge contributes the deprecated', () => {
    expect(isFieldHidden({ title: 'B', allOf: [{ $ref: '#/definitions/legacy' }] }, {}, hideRegistry)).toBe(true);
  });

  it('answers true when a then branch applies the deprecated', () => {
    expect(isFieldHidden({ type: 'string', if: {}, then: { deprecated: true } }, {}, hideRegistry)).toBe(true);
  });

  it('does not retrieve a schema that cannot gain a deprecated through resolution', () => {
    const spy = vi.spyOn(schemaUtils, 'retrieveSchema');
    try {
      expect(isFieldHidden({ type: 'string' }, {}, registry)).toBe(false);
      expect(isFieldHidden({ type: 'string', deprecated: true }, {}, hideRegistry)).toBe(true);
      expect(spy).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  });

  it('retrieves a schema whose keywords can contribute a deprecated', () => {
    const spy = vi.spyOn(schemaUtils, 'retrieveSchema');
    try {
      expect(isFieldHidden({ title: 'B', allOf: [{ $ref: '#/definitions/legacy' }] }, {}, hideRegistry)).toBe(true);
      expect(spy).toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  });

  it('does not retrieve a schema flagged as a ref cycle', () => {
    const spy = vi.spyOn(schemaUtils, 'retrieveSchema');
    try {
      const cycle = { type: 'object', [RJSF_REF_CYCLE_KEY]: true };
      expect(isFieldHidden(cycle, {}, registry)).toBe(false);
      expect(spy).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  });

  it('answers false for a boolean schema', () => {
    expect(isFieldHidden(true, {}, registry)).toBe(false);
  });
});
