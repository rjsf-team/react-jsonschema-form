import type { RJSFSchema, UiSchema } from '../src/index.ts';
import { getFieldLabel } from '../src/index.ts';

const NAME = 'fieldName';
const PARENT_TITLE = 'Parent title-1';
const SCHEMA_TITLE = 'Schema title';
const UI_TITLE = 'UI title';
const schema: RJSFSchema = { type: 'string', title: SCHEMA_TITLE };
const uiSchema: UiSchema = { 'ui:title': UI_TITLE };

describe('getFieldLabel', () => {
  it('returns the name when nothing else is provided', () => {
    expect(getFieldLabel({ schema: { type: 'string' }, name: NAME })).toBe(NAME);
  });
  it('prefers the title prop over the name', () => {
    expect(getFieldLabel({ schema: { type: 'string' }, title: PARENT_TITLE, name: NAME })).toBe(PARENT_TITLE);
  });
  it('prefers the schema title over the title prop', () => {
    expect(getFieldLabel({ schema, title: PARENT_TITLE, name: NAME })).toBe(SCHEMA_TITLE);
  });
  it('prefers the ui:title over the schema title', () => {
    expect(getFieldLabel({ schema, uiSchema, title: PARENT_TITLE, name: NAME })).toBe(UI_TITLE);
  });
  it('reads the title from ui:options', () => {
    expect(getFieldLabel({ schema, uiSchema: { 'ui:options': { title: UI_TITLE } }, name: NAME })).toBe(UI_TITLE);
  });
  it('falls back to the title in globalUiOptions', () => {
    expect(getFieldLabel({ schema, name: NAME, globalUiOptions: { title: UI_TITLE } })).toBe(UI_TITLE);
  });
  it('prefers the ui:title over the title in globalUiOptions', () => {
    expect(getFieldLabel({ schema, uiSchema, name: NAME, globalUiOptions: { title: 'global' } })).toBe(UI_TITLE);
  });
  it('respects an explicitly empty ui:title', () => {
    expect(getFieldLabel({ schema, uiSchema: { 'ui:title': '' }, name: NAME })).toBe('');
  });
  it('respects an explicitly empty schema title', () => {
    expect(getFieldLabel({ schema: { type: 'string', title: '' }, title: PARENT_TITLE, name: NAME })).toBe('');
  });
});
