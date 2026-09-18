import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import { noop, toPath } from '@rjsf/utils';
import { userEvent } from '@testing-library/user-event';
import type { MockInstance } from 'vitest';

import { createFormComponent, submitForm } from './testUtils.tsx';

const user = userEvent.setup();

async function expectSubmitBlocked(schema: RJSFSchema, uiSchema: UiSchema, formData?: unknown) {
  const { node, onSubmit, onError } = createFormComponent({ schema, uiSchema, formData });
  await submitForm(node, user, true);
  expect(onSubmit).not.toHaveBeenCalled();
  expect(onError).toHaveBeenCalled();
}

describe('ui:required enforcement', () => {
  let warnSpy: MockInstance;
  beforeAll(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(noop);
  });
  afterAll(() => {
    warnSpy.mockRestore();
  });

  describe('schema shapes the rendered field resolves through', () => {
    it('enforces ui:required declared inside a ui:definitions fragment', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        definitions: { Address: { type: 'object', properties: { zip: { type: 'string' } } } },
        properties: { home: { $ref: '#/definitions/Address' } },
      };
      const uiSchema: UiSchema = {
        'ui:definitions': { '#/definitions/Address': { zip: { 'ui:required': true } } },
      };
      await expectSubmitBlocked(schema, uiSchema, { home: {} });
    });

    it('enforces ui:required on a field nested inside array items', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          people: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' } } } },
        },
      };
      const uiSchema: UiSchema = { people: { items: { name: { 'ui:required': true } } } };
      await expectSubmitBlocked(schema, uiSchema, { people: [{}] });
    });

    it('enforces ui:required on a field declared through a nested allOf', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          address: {
            allOf: [
              { type: 'object', properties: { street: { type: 'string' } } },
              { type: 'object', properties: { city: { type: 'string' } } },
            ],
          },
        },
      };
      const uiSchema: UiSchema = { address: { street: { 'ui:required': true } } };
      await expectSubmitBlocked(schema, uiSchema, { address: {} });
    });

    it('enforces ui:required under a nested $ref on a plain submit (no liveValidate)', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        definitions: { Address: { type: 'object', properties: { street: { type: 'string' } } } },
        properties: { address: { $ref: '#/definitions/Address' } },
      };
      const uiSchema: UiSchema = { address: { street: { 'ui:required': true } } };
      await expectSubmitBlocked(schema, uiSchema, { address: {} });
    });

    it('enforces ui:required on a $ref-rooted schema on a plain submit', async () => {
      const schema: RJSFSchema = {
        definitions: { Person: { type: 'object', properties: { nick: { type: 'string' } } } },
        $ref: '#/definitions/Person',
      };
      const uiSchema: UiSchema = { nick: { 'ui:required': true } };
      await expectSubmitBlocked(schema, uiSchema, {});
    });

    it('applies ui:initialValue declared inside a ui:definitions fragment', () => {
      const schema: RJSFSchema = {
        type: 'object',
        definitions: { Address: { type: 'object', properties: { country: { type: 'string' } } } },
        properties: { home: { $ref: '#/definitions/Address' } },
      };
      const uiSchema: UiSchema = {
        'ui:definitions': { '#/definitions/Address': { country: { 'ui:initialValue': 'US' } } },
      };
      const { node } = createFormComponent({ schema, uiSchema });
      expect(node.querySelector<HTMLInputElement>('#root_home_country')).toHaveValue('US');
    });

    it('lets the user clear a ui:initialValue mid-edit instead of resurrecting it', async () => {
      const schema: RJSFSchema = { type: 'object', properties: { country: { type: 'string' } } };
      const uiSchema: UiSchema = { country: { 'ui:initialValue': 'US' } };
      const { node } = createFormComponent({ schema, uiSchema });
      const input = node.querySelector<HTMLInputElement>('#root_country')!;
      expect(input).toHaveValue('US');
      await user.clear(input);
      expect(input).toHaveValue('');
    });

    it('enforces ui:required inside the selected oneOf branch', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          thing: {
            oneOf: [
              {
                type: 'object',
                title: 'A',
                properties: { kind: { type: 'string', const: 'a' }, aField: { type: 'string' } },
              },
              {
                type: 'object',
                title: 'B',
                properties: { kind: { type: 'string', const: 'b' }, bField: { type: 'string' } },
              },
            ],
          },
        },
      };
      const uiSchema: UiSchema = { thing: { aField: { 'ui:required': true } } };
      const { node, onSubmit } = createFormComponent({ schema, uiSchema, formData: { thing: { kind: 'a' } } });
      await submitForm(node, user, true);
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('enforces ui:required on a deeply nested object property', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          a: { type: 'object', properties: { b: { type: 'object', properties: { c: { type: 'string' } } } } },
        },
      };
      const uiSchema: UiSchema = { a: { b: { c: { 'ui:required': true } } } };
      const { node, onSubmit } = createFormComponent({ schema, uiSchema, formData: { a: { b: {} } } });
      await submitForm(node, user, true);
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('does not fire for a field that has a value', async () => {
      const schema: RJSFSchema = { type: 'object', properties: { nick: { type: 'string' } } };
      const uiSchema: UiSchema = { nick: { 'ui:required': true } };
      const { node, onSubmit } = createFormComponent({ schema, uiSchema, formData: { nick: 'x' } });
      await submitForm(node, user, true);
      expect(onSubmit).toHaveBeenCalled();
    });

    it('reports the error at the field path so it renders under the field', async () => {
      const schema: RJSFSchema = { type: 'object', properties: { nick: { type: 'string' } } };
      const uiSchema: UiSchema = { nick: { 'ui:required': true } };
      const { node, onError } = createFormComponent({ schema, uiSchema, formData: {} });
      await submitForm(node, user, true);
      expect(onError).toHaveBeenCalled();
      const errors = onError.mock.calls[0][0];
      expect(errors[0].property).toBe('.nick');
    });
  });

  describe('error reporting', () => {
    it('toPath treats a leading dot the same', () => {
      expect(toPath('.nick')).toEqual(toPath('nick'));
    });

    it('focusOnFirstError focuses the ui:required field', async () => {
      const schema: RJSFSchema = { type: 'object', properties: { nick: { type: 'string' } } };
      const uiSchema: UiSchema = { nick: { 'ui:required': true } };
      const { node } = createFormComponent({ schema, uiSchema, formData: {}, focusOnFirstError: true });
      await submitForm(node, user, true);
      expect(document.activeElement?.id).toBe('root_nick');
    });

    it('renders the error under the field', async () => {
      const schema: RJSFSchema = { type: 'object', properties: { nick: { type: 'string' } } };
      const uiSchema: UiSchema = { nick: { 'ui:required': true } };
      const { node } = createFormComponent({ schema, uiSchema, formData: {}, showErrorList: false });
      await submitForm(node, user, true);
      expect(node.textContent).toContain("must have required property 'nick'");
    });

    it('reports a single error, not a duplicate, for a field that is both schema-required and ui:required: true', async () => {
      const schema: RJSFSchema = { type: 'object', required: ['nick'], properties: { nick: { type: 'string' } } };
      const uiSchema: UiSchema = { nick: { 'ui:required': true } };
      const { node, onError } = createFormComponent({ schema, uiSchema, formData: {} });
      await submitForm(node, user, true);
      expect(onError).toHaveBeenCalled();
      const errors = onError.mock.calls[0][0];
      expect(errors).toHaveLength(1);
      // AJV's own required error (the one that survives, since the ui:required walk defers to it) reports the
      // property without ui:required's leading-dot convention.
      expect(errors[0].property).toBe('nick');
    });

    it('passes the same formContext to the function form of uiSchema.items as rendering does, even when the formContext prop is omitted', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(noop);
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          people: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' } } } },
        },
      };
      const uiSchema: UiSchema = {
        people: {
          items: (_item: unknown, _index: number, formContext: { mode?: string }) =>
            formContext.mode === 'strict' ? {} : { name: { 'ui:required': true } },
        },
      };
      // No `formContext` prop: the registry normalizes the missing prop to `{}` for rendering, and validation must
      // see that same `{}` rather than `undefined`, or the function above throws and ui:required silently no-ops.
      await expectSubmitBlocked(schema, uiSchema, { people: [{}] });
      expect(errorSpy).not.toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });
});
