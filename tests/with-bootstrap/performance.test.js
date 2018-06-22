import { scryRenderedComponentsWithType } from 'react-dom/test-utils';
import { getDefaultRegistry } from 'react-jsonschema-form/src/utils';

import SchemaField from 'react-jsonschema-form/src/components/fields/SchemaField';

import { createComponent, createFormComponent } from './test_utils';

describe('Rendering performance optimizations', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Form', () => {
    it('should not render if next props are equivalent', () => {
      const schema = { type: 'string' };
      const uiSchema = {};

      const { rerender, getInstance } = createFormComponent({
        schema,
        uiSchema
      });

      /**
       * This spy gets the access to the existing mock
       * so it knows about the first render of component.
       */
      const spy = jest.spyOn(getInstance(), 'render');

      rerender({ schema });

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should not render if next formData are equivalent', () => {
      const schema = { type: 'string' };
      const formData = 'foo';

      const { rerender, getInstance } = createFormComponent({
        schema,
        formData
      });

      /**
       * This spy gets the access to the existing mock
       * so it knows about the first render of component.
       */
      const spy = jest.spyOn(getInstance(), 'render');

      rerender({ formData });

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should only render changed object properties', () => {
      const schema = {
        type: 'object',
        properties: {
          const: { type: 'string' },
          var: { type: 'string' }
        }
      };

      const { getInstance, rerender } = createFormComponent({
        schema,
        formData: { const: '0', var: '0' }
      });

      const fields = scryRenderedComponentsWithType(
        getInstance(),
        SchemaField
      ).reduce((fields, fieldComp) => {
        /**
         * These spies are totally new
         * so they don't know about the first render
         */
        const spy = jest.spyOn(fieldComp, 'render');
        fields[fieldComp.props.idSchema.$id] = spy;
        return fields;
      });

      rerender({ schema, formData: { const: '0', var: '1' } });

      expect(fields.root_const).toHaveBeenCalledTimes(0);
      expect(fields.root_var).toHaveBeenCalledTimes(1);
    });

    it('should only render changed array items', () => {
      const schema = {
        type: 'array',
        items: { type: 'string' }
      };

      const { getInstance, rerender } = createFormComponent({
        schema,
        formData: ['const', 'var0']
      });

      const fields = scryRenderedComponentsWithType(
        getInstance(),
        SchemaField
      ).reduce((fields, fieldComp) => {
        /**
         * These spies are totally new
         * so they don't know about the first render
         */
        const spy = jest.spyOn(fieldComp, 'render');
        fields[fieldComp.props.idSchema.$id] = spy;
        return fields;
      });

      rerender({ schema, formData: ['const', 'var1'] });

      expect(fields.root_0).toHaveBeenCalledTimes(0);
      expect(fields.root_1).toHaveBeenCalledTimes(1);
    });
  });

  describe('SchemaField', () => {
    const onChange = () => {};
    const onBlur = () => {};
    const onFocus = () => {};
    const registry = getDefaultRegistry();
    const uiSchema = {};
    const schema = {
      type: 'object',
      properties: {
        foo: { type: 'string' }
      }
    };
    const idSchema = { $id: 'root', foo: { $id: 'root_plop' } };

    it('should not render if next props are equivalent', () => {
      const props = {
        registry,
        schema,
        uiSchema,
        onChange,
        idSchema,
        onBlur,
        onFocus
      };

      const { getInstance, rerender } = createComponent(SchemaField, props);

      /**
       * It should be already called two times because once was called
       * for the root object and the other was for property foo.
       */
      const spy = jest.spyOn(getInstance(), 'render');

      rerender(props);

      expect(spy).toHaveBeenCalledTimes(2);
    });

    it('should not render if next formData are equivalent', () => {
      const props = {
        registry,
        schema,
        formData: { foo: 'blah' },
        onChange,
        idSchema,
        onBlur
      };

      const { getInstance, rerender } = createComponent(SchemaField, props);

      /**
       * It should be already called two times because once was called
       * for the root object and the other was for property foo.
       */
      const spy = jest.spyOn(getInstance(), 'render');

      rerender({ ...props, formData: { foo: 'blah' } });

      expect(spy).toHaveBeenCalledTimes(2);
    });
  });
});
