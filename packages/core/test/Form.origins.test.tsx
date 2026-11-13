import type { RJSFSchema } from '@rjsf/utils';
import { buttonId, isObject } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { act, render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import type { FormProps, FormRef } from '../src/index.ts';
import Form from '../src/index.ts';
import { createFormRef, elementOf, handleOf } from './testUtils.tsx';

const user = userEvent.setup();

/** Mounts a form of `schema`, and hands back its handle with a way to render it again under another schema */
function mount(schema: RJSFSchema, props: Omit<FormProps, 'schema' | 'validator' | 'ref'> = {}) {
  const ref = createFormRef();
  const element = (shown: RJSFSchema) => <Form {...props} ref={ref} schema={shown} validator={validator} />;
  const { container, rerender } = render(element(schema));
  const form: FormRef = handleOf(ref);
  return {
    container,
    form,
    setSchema: (shown: RJSFSchema) => rerender(element(shown)),
    write: (path: Parameters<FormRef['setFieldValue']>[0], value: unknown) =>
      act(() => form.setFieldValue(path, value)),
  };
}

describe('where a value came from, as a schema, a branch or a write changes the form', () => {
  describe('a value an `enum` stops listing', () => {
    const picking = (values: string[]): RJSFSchema => ({
      type: 'object',
      properties: { a: { type: 'string', enum: values, default: values[0] } },
    });

    it('takes the new default where a person entered it, as one of any other origin does', () => {
      const { form, setSchema, write } = mount(picking(['d', 'e']));
      write(['a'], 'e');
      setSchema(picking(['d', 'f']));
      expect(form.getFormData()).toEqual({ a: 'd' });
    });

    it('is dropped where a person entered it and the new list offers no default', () => {
      const listing = (values: string[]): RJSFSchema => ({
        type: 'object',
        properties: { a: { type: 'string', enum: values } },
      });
      const { form, setSchema, write } = mount(listing(['d', 'e']));
      write(['a'], 'e');
      setSchema(listing(['d', 'f']));
      expect(form.getFormData()).toEqual({});
    });
  });

  describe('a value the sanitize or the fill takes out or writes over', () => {
    const coloured = (other: RJSFSchema): RJSFSchema => ({
      type: 'object',
      properties: {
        mode: { type: 'string', enum: ['a', 'b'], default: 'a' },
        color: { type: 'string' },
        note: { type: 'string' },
      },
      if: { properties: { mode: { const: 'a' } } },
      then: { properties: { color: { enum: ['red', 'green', 'blue'], default: 'red' } } },
      else: { properties: { color: other } },
    });

    it('takes the default its branch gives once the `const` the other branch filled in took its place', () => {
      const { form, write } = mount(coloured({ const: 'black' }));
      write(['color'], 'green');
      write(['mode'], 'b');
      expect(form.getFormData()).toEqual({ mode: 'b', color: 'black' });
      write(['mode'], 'a');
      expect(form.getFormData()).toEqual({ mode: 'a', color: 'red' });
    });

    it('takes the default its branch gives once a list of one took its place', () => {
      const { form, write } = mount(coloured({ enum: ['black'] }));
      write(['color'], 'green');
      write(['mode'], 'b');
      expect(form.getFormData()).toEqual({ mode: 'b', color: 'black' });
      write(['mode'], 'a');
      expect(form.getFormData()).toEqual({ mode: 'a', color: 'red' });
    });

    it('is dropped with its type, and the default filled in for the other type goes with that type in turn', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: { kind: { type: 'string', enum: ['s', 'n'], default: 's' } },
        if: { properties: { kind: { const: 's' } } },
        then: { properties: { x: { type: 'string' } } },
        else: { properties: { x: { type: 'number', default: 5 } } },
      };
      const { form, write } = mount(schema);
      write(['x'], 'hi');
      write(['kind'], 'n');
      expect(form.getFormData()).toEqual({ kind: 'n', x: 5 });
      write(['kind'], 's');
      expect(form.getFormData()).toEqual({ kind: 's' });
    });

    it("is the form's from the mount on where the seed held a value the `enum` does not list", () => {
      const listing = (chosen: string): RJSFSchema => ({
        type: 'object',
        properties: { color: { type: 'string', enum: ['r', 'g'], default: chosen } },
      });
      const { form, setSchema } = mount(listing('r'), { initialFormData: { color: 'unlisted' } });
      expect(form.getFormData()).toEqual({ color: 'r' });
      setSchema(listing('g'));
      expect(form.getFormData()).toEqual({ color: 'g' });
    });

    describe('a seeded value a narrowed `enum` replaces', () => {
      const listing = (values: string[], chosen: string): RJSFSchema => ({
        type: 'object',
        properties: { color: { type: 'string', enum: values, default: chosen } },
      });

      it("is the form's from then on, so it takes the default a later list declares", () => {
        const { form, setSchema } = mount(listing(['r', 'g', 'b'], 'r'), { initialFormData: { color: 'g' } });
        setSchema(listing(['r', 'b'], 'b'));
        expect(form.getFormData()).toEqual({ color: 'b' });
        setSchema(listing(['r', 'x'], 'r'));
        expect(form.getFormData()).toEqual({ color: 'r' });
      });

      it('follows a later default while the list still offers the value it was replaced with', () => {
        const { form, setSchema } = mount(listing(['r', 'g', 'b'], 'r'), { initialFormData: { color: 'g' } });
        setSchema(listing(['r', 'b'], 'b'));
        setSchema(listing(['r', 'b'], 'r'));
        expect(form.getFormData()).toEqual({ color: 'r' });
      });
    });
  });

  describe('an array or object nobody entered anything in, filled from its own default', () => {
    const tagged = (tags: string[]): RJSFSchema => ({
      type: 'object',
      properties: { tags: { type: 'array', items: { type: 'string' }, default: tags } },
    });

    it('takes a shorter default whole', () => {
      const { form, setSchema } = mount(tagged(['a', 'b']));
      setSchema(tagged(['c']));
      expect(form.getFormData()).toEqual({ tags: ['c'] });
    });

    it('takes a longer default whole', () => {
      const { form, setSchema } = mount(tagged(['a', 'b']));
      setSchema(tagged(['d', 'e', 'f']));
      expect(form.getFormData()).toEqual({ tags: ['d', 'e', 'f'] });
    });

    it('takes each default in turn, through a shorter one to a longer one', () => {
      const { form, setSchema } = mount(tagged(['a', 'b']));
      setSchema(tagged(['c']));
      setSchema(tagged(['d', 'e', 'f']));
      expect(form.getFormData()).toEqual({ tags: ['d', 'e', 'f'] });
    });

    it('takes the new default whole where the array is the root', () => {
      const rooted = (tags: string[]): RJSFSchema => ({ type: 'array', items: { type: 'string' }, default: tags });
      const { form, setSchema } = mount(rooted(['a', 'b']));
      setSchema(rooted(['c']));
      expect(form.getFormData()).toEqual(['c']);
    });

    it('keeps the row a person wrote in, and the length the data has', () => {
      const { form, setSchema, write } = mount(tagged(['a', 'b']));
      write(['tags', 1], 'mine');
      setSchema(tagged(['c']));
      expect(form.getFormData()).toEqual({ tags: ['c', 'mine'] });
    });

    it('keeps an empty array the seed held', () => {
      const { form, setSchema } = mount(tagged(['a', 'b']), { initialFormData: { tags: [] } });
      setSchema(tagged(['c']));
      expect(form.getFormData()).toEqual({ tags: [] });
    });

    it('takes an object default whole, a key the new default leaves out included', () => {
      const shaped = (box: Record<string, number>): RJSFSchema => ({
        type: 'object',
        properties: { box: { type: 'object', additionalProperties: { type: 'number' }, default: box } },
      });
      const { form, setSchema } = mount(shaped({ w: 1, h: 2 }));
      setSchema(shaped({ w: 3 }));
      expect(form.getFormData()).toEqual({ box: { w: 3 } });
    });
  });

  describe('a filled value that follows its default and decides a condition by it', () => {
    const branching = (kind: string, extra: RJSFSchema = {}): RJSFSchema => ({
      type: 'object',
      ...extra,
      properties: { kind: { type: 'string', default: kind } },
      if: { properties: { kind: { const: 'x' } }, required: ['kind'] },
      then: { properties: { size: { type: 'number', default: 1 } } },
      else: { properties: { note: { type: 'string', default: 'n' } } },
    });

    it('fills the branch the new default opens and drops what the closed one filled', () => {
      const { form, setSchema } = mount(branching('y'));
      expect(form.getFormData()).toEqual({ kind: 'y', note: 'n' });
      setSchema(branching('x'));
      expect(form.getFormData()).toEqual({ kind: 'x', size: 1 });
      setSchema(branching('y'));
      expect(form.getFormData()).toEqual({ kind: 'y', note: 'n' });
    });

    it('drops what the closed branch filled where the object would hold its key as an extra one', () => {
      const open: RJSFSchema = { additionalProperties: { type: 'number' } };
      const { form, setSchema } = mount(branching('x', open));
      setSchema(branching('y', open));
      expect(form.getFormData()).toEqual({ kind: 'y', note: 'n' });
    });

    it('keeps a value a person entered in the closed branch as the extra key the object holds it as', () => {
      const open: RJSFSchema = { additionalProperties: { type: 'number' } };
      const { form, setSchema, write } = mount(branching('x', open));
      write(['size'], 5);
      setSchema(branching('y', open));
      expect(form.getFormData()).toEqual({ kind: 'y', note: 'n', size: 5 });
    });

    it('decides the condition by the value where a person entered one equal to the old default', () => {
      const { form, setSchema, write } = mount(branching('x'));
      write(['kind'], 'x');
      setSchema(branching('y'));
      expect(form.getFormData()).toEqual({ kind: 'x', size: 1 });
    });
  });

  describe('a write from outside the fields', () => {
    const coloured = (color: string): RJSFSchema => ({
      type: 'object',
      properties: { color: { type: 'string', default: color } },
    });

    it('enters a value equal to the one the data held, at the path of the value', () => {
      const { form, setSchema, write } = mount(coloured('red'));
      write(['color'], 'red');
      setSchema(coloured('blue'));
      expect(form.getFormData()).toEqual({ color: 'red' });
    });

    it('enters a value equal to the one the data held, at the path of the object holding it', () => {
      const { form, setSchema, write } = mount(coloured('red'));
      write('', { color: 'red' });
      setSchema(coloured('blue'));
      expect(form.getFormData()).toEqual({ color: 'red' });
    });

    it('is told from a record `reset()` loads, whose value equal to the old default follows the new one', () => {
      const { form, setSchema } = mount(coloured('red'));
      act(() => form.reset({ color: 'red' }));
      setSchema(coloured('blue'));
      expect(form.getFormData()).toEqual({ color: 'blue' });
    });

    it('enters only what a `transformChange` changes of the edit it is handed', () => {
      const named = (color: string): RJSFSchema => ({
        type: 'object',
        properties: { name: { type: 'string' }, shout: { type: 'string' }, color: { type: 'string', default: color } },
      });
      const { form, setSchema, write } = mount(named('red'), {
        transformChange: (next: unknown) =>
          isObject(next) && typeof next.name === 'string' ? { ...next, shout: next.name.toUpperCase() } : next,
      });
      write(['name'], 'ada');
      expect(form.getFormData()).toEqual({ name: 'ada', shout: 'ADA', color: 'red' });
      setSchema(named('blue'));
      expect(form.getFormData()).toEqual({ name: 'ada', shout: 'ADA', color: 'blue' });
    });

    it('keeps the rows of an array written whole where the write left them, after a row was moved', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: { list: { type: 'array', default: ['a', 'b'], items: { type: 'string' } } },
      };
      const { container, form, write } = mount(schema);
      await user.click(elementOf(container, `#${buttonId('root_list_1', 'moveUp')}`));
      expect(form.getFormData()).toEqual({ list: ['b', 'a'] });
      write(['list'], ['b', 'a', 'c']);
      expect(form.getFormData()).toEqual({ list: ['b', 'a', 'c'] });
    });

    it('keeps the rows of an array written whole in the order written, under an array default', () => {
      const listed = (list: string[]): RJSFSchema => ({
        type: 'object',
        properties: { list: { type: 'array', default: list, items: { type: 'string' } } },
      });
      const { form, setSchema, write } = mount(listed(['a', 'b']));
      write(['list'], ['a', 'b']);
      setSchema(listed(['x', 'y', 'z']));
      expect(form.getFormData()).toEqual({ list: ['a', 'b'] });
    });
  });
});

describe('an array holding an item the user cleared', () => {
  it('is theirs, so it does not take a new default whole', async () => {
    const schemaWith = (fallback: (string | null)[]): RJSFSchema => ({
      type: 'object',
      properties: { list: { type: 'array', default: fallback, items: { type: ['string', 'null'] } } },
    });
    const ref = createFormRef();
    const form = (schema: RJSFSchema) => <Form schema={schema} validator={validator} ref={ref} />;
    const { container, rerender } = render(form(schemaWith([null, 'b'])));
    const first = elementOf(container, '#root_list_0', HTMLInputElement);
    await user.type(first, 'x');
    await user.clear(first);

    rerender(form(schemaWith(['c'])));

    expect(handleOf(ref).getFormData()).toEqual({ list: [null, 'b'] });
  });
});
