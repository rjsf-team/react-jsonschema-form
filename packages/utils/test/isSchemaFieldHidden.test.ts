import type { GlobalUISchemaOptions, Registry, RJSFSchema, TemplatesType } from '../src/index.ts';
import {
  createSchemaUtils,
  englishStringTranslator,
  isSchemaFieldHidden,
  mergeThemePresentation,
  RJSF_REF_CYCLE_KEY,
} from '../src/index.ts';
import getTestValidator from './testUtils/getTestValidator.ts';
import { GLOBAL_FORM_OPTIONS } from './testUtils/testData.ts';

const ROOT_SCHEMA: RJSFSchema = {
  definitions: {
    old: { type: 'string', deprecated: true },
    secret: { type: 'string' },
  },
};

function makeRegistry(globalUiOptions?: GlobalUISchemaOptions, uiSchemaDefinitions?: Registry['uiSchemaDefinitions']) {
  return {
    formContext: {},
    rootSchema: ROOT_SCHEMA,
    schemaUtils: createSchemaUtils({ validator: getTestValidator({}) }, ROOT_SCHEMA),
    translateString: englishStringTranslator,
    fields: {},
    widgets: {},
    presentation: mergeThemePresentation(),
    templates: {} as TemplatesType,
    globalFormOptions: GLOBAL_FORM_OPTIONS,
    globalUiOptions,
    uiSchemaDefinitions,
  } as Registry;
}

const HIDE = makeRegistry({ deprecatedHandling: 'hide' });
const OLD_REF: RJSFSchema = { $ref: '#/definitions/old' };
const OLD_CYCLE = { ...OLD_REF, [RJSF_REF_CYCLE_KEY]: true } as RJSFSchema;

describe('isSchemaFieldHidden()', () => {
  it('returns false for a field nothing hides', () => {
    expect(isSchemaFieldHidden({ type: 'string' }, undefined, undefined, HIDE)).toBe(false);
  });

  it('returns true for its own hidden widget', () => {
    expect(isSchemaFieldHidden({ type: 'string' }, { 'ui:widget': 'hidden' }, undefined, makeRegistry())).toBe(true);
  });

  it('returns true for a hidden widget its ui:definitions entry sets', () => {
    const registry = makeRegistry(undefined, { '#/definitions/secret': { 'ui:widget': 'hidden' } });
    expect(isSchemaFieldHidden({ $ref: '#/definitions/secret' }, undefined, undefined, registry)).toBe(true);
  });

  it('ignores a widget in the global options', () => {
    const registry = makeRegistry({ widget: 'hidden' } as GlobalUISchemaOptions);
    expect(isSchemaFieldHidden({ type: 'string' }, undefined, undefined, registry)).toBe(false);
  });

  it('returns true for a $ref resolving to a deprecated schema under a global hide', () => {
    expect(isSchemaFieldHidden(OLD_REF, undefined, undefined, HIDE)).toBe(true);
  });

  it('returns false for a deprecated schema whose own handling overrides a global hide', () => {
    expect(isSchemaFieldHidden(OLD_REF, { 'ui:deprecatedHandling': 'label' }, undefined, HIDE)).toBe(false);
  });

  it('returns false for an unexpanded $ref cycle, which renders an Expand button', () => {
    expect(isSchemaFieldHidden(OLD_CYCLE, { 'ui:widget': 'hidden' }, undefined, HIDE)).toBe(false);
  });

  it('resolves an expanded $ref cycle one level further', () => {
    expect(isSchemaFieldHidden(OLD_CYCLE, undefined, undefined, HIDE, true)).toBe(true);
  });
});
