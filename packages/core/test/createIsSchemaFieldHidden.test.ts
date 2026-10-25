import type { GlobalUISchemaOptions, Registry, RJSFSchema } from '@rjsf/utils';
import { RJSF_REF_CYCLE_KEY, ROOT_FIELD_PATH } from '@rjsf/utils';

import { createIsSchemaFieldHidden } from '../src/components/fields/SchemaField.tsx';
import { getTestRegistry } from '../src/testing.ts';

const ROOT_SCHEMA: RJSFSchema = {
  definitions: {
    old: { type: 'string', deprecated: true },
    secret: { type: 'string' },
  },
};

function makeRegistry(
  globalUiOptions?: GlobalUISchemaOptions,
  uiSchemaDefinitions?: Registry['uiSchemaDefinitions'],
): Registry {
  return { ...getTestRegistry(ROOT_SCHEMA), globalUiOptions, uiSchemaDefinitions };
}

const OLD_REF: RJSFSchema = { $ref: '#/definitions/old' };
const OLD_CYCLE = { ...OLD_REF, [RJSF_REF_CYCLE_KEY]: true } as RJSFSchema;
const BOOLEAN_SELECT: RJSFSchema = { oneOf: [{ const: true }, { const: false }] };
// `ui:widget` comes last, so `getUiOptions()` reads no widget from it, while the widget `SchemaField` writes back for an
// inferred select is the caller's `ui:options.widget`
const HIDDEN_OPTION_UNDER_UNDEFINED_WIDGET = { 'ui:options': { widget: 'hidden' }, 'ui:widget': undefined };

describe('createIsSchemaFieldHidden()', () => {
  let isSchemaFieldHidden: ReturnType<typeof createIsSchemaFieldHidden>;
  beforeEach(() => {
    isSchemaFieldHidden = createIsSchemaFieldHidden();
  });

  it('returns false for a field nothing hides', () => {
    expect(isSchemaFieldHidden({ type: 'string' }, undefined, undefined, ROOT_FIELD_PATH, makeRegistry())).toBe(false);
  });

  it('returns true for its own hidden widget', () => {
    const uiSchema = { 'ui:widget': 'hidden' };
    expect(isSchemaFieldHidden({ type: 'string' }, uiSchema, undefined, ROOT_FIELD_PATH, makeRegistry())).toBe(true);
  });

  it('returns true for a hidden widget its ui:definitions entry sets', () => {
    const registry = makeRegistry(undefined, { '#/definitions/secret': { 'ui:widget': 'hidden' } });
    expect(isSchemaFieldHidden({ $ref: '#/definitions/secret' }, undefined, undefined, ROOT_FIELD_PATH, registry)).toBe(
      true,
    );
  });

  it('ignores a widget in the global options', () => {
    const registry = makeRegistry({ widget: 'hidden' } as GlobalUISchemaOptions);
    expect(isSchemaFieldHidden({ type: 'string' }, undefined, undefined, ROOT_FIELD_PATH, registry)).toBe(false);
  });

  it('returns true for a $ref resolving to a deprecated schema under a global hide', () => {
    const registry = makeRegistry({ deprecatedHandling: 'hide' });
    expect(isSchemaFieldHidden(OLD_REF, undefined, undefined, ROOT_FIELD_PATH, registry)).toBe(true);
  });

  it('returns false for a deprecated schema whose own handling overrides a global hide', () => {
    const registry = makeRegistry({ deprecatedHandling: 'hide' });
    const uiSchema = { 'ui:deprecatedHandling': 'label' } as const;
    expect(isSchemaFieldHidden(OLD_REF, uiSchema, undefined, ROOT_FIELD_PATH, registry)).toBe(false);
  });

  it('returns false for an unexpanded $ref cycle, which renders an Expand button', () => {
    const registry = makeRegistry({ deprecatedHandling: 'hide' });
    const uiSchema = { 'ui:widget': 'hidden' };
    expect(isSchemaFieldHidden(OLD_CYCLE, uiSchema, undefined, ROOT_FIELD_PATH, registry)).toBe(false);
  });

  it('resolves an expanded $ref cycle one level further', () => {
    const registry = makeRegistry({ deprecatedHandling: 'hide' });
    expect(isSchemaFieldHidden(OLD_CYCLE, undefined, undefined, ROOT_FIELD_PATH, registry, true)).toBe(true);
  });

  it('returns false for a boolean schema', () => {
    const registry = makeRegistry({ deprecatedHandling: 'hide' });
    expect(isSchemaFieldHidden(true as unknown as RJSFSchema, undefined, undefined, ROOT_FIELD_PATH, registry)).toBe(
      false,
    );
  });

  it('reads the hidden widget SchemaField writes back for an inferred boolean select', () => {
    const registry = makeRegistry();
    const uiSchema = HIDDEN_OPTION_UNDER_UNDEFINED_WIDGET;
    expect(isSchemaFieldHidden(BOOLEAN_SELECT, uiSchema, undefined, ROOT_FIELD_PATH, registry)).toBe(true);
    expect(isSchemaFieldHidden({ type: 'string' }, uiSchema, undefined, ROOT_FIELD_PATH, registry)).toBe(false);
  });

  it('retrieves the schema again only once its data changes', () => {
    const registry = makeRegistry({ deprecatedHandling: 'hide' });
    const retrieveSchema = vi.spyOn(registry.schemaUtils, 'retrieveSchema');
    const schema: RJSFSchema = { $ref: '#/definitions/old' };
    const uiSchema = {};
    expect(isSchemaFieldHidden(schema, uiSchema, 'a', ROOT_FIELD_PATH, registry)).toBe(true);
    expect(isSchemaFieldHidden(schema, uiSchema, 'a', ROOT_FIELD_PATH, registry)).toBe(true);
    expect(retrieveSchema).toHaveBeenCalledTimes(1);
    expect(isSchemaFieldHidden(schema, uiSchema, 'b', ROOT_FIELD_PATH, registry)).toBe(true);
    expect(isSchemaFieldHidden(schema, { 'ui:deprecatedHandling': 'label' }, 'b', ROOT_FIELD_PATH, registry)).toBe(
      false,
    );
    expect(retrieveSchema).toHaveBeenCalledTimes(2);
  });
});
