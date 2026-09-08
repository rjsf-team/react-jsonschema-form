import { createRef, useState, useCallback } from 'react';
import type { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import userEvent from '@testing-library/user-event';
import type { Mock } from 'vitest';

import type { FormProps } from '../src/index.ts';
import Form from '../src/index.ts';
import type { NoValFormProps, RerenderType } from './testUtils.tsx';
import { expectToHaveBeenCalledWithFormData, renderNode, submitForm, describeRepeated } from './testUtils.tsx';

const user = userEvent.setup();

describeRepeated('Form common: form state updates', (createFormComponent) => {
  describe('Required and optional fields', () => {
    const schema: RJSFSchema = {
      definitions: {
        address: {
          type: 'object',
          properties: {
            street_address: {
              type: 'string',
            },
            city: {
              type: 'string',
            },
            state: {
              type: 'string',
            },
          },
          required: ['street_address', 'city', 'state'],
        },
      },
      type: 'object',
      properties: {
        billing_address: {
          title: 'Billing address',
          $ref: '#/definitions/address',
        },
        shipping_address: {
          title: 'Shipping address',
          $ref: '#/definitions/address',
        },
      },
      required: ['shipping_address'],
    };
    it('Errors when shipping address is not filled out, billing address is not needed', async () => {
      const { node, onChange, onError } = createFormComponent({ schema });
      expectToHaveBeenCalledWithFormData(onChange, { shipping_address: {} });
      // forceFireEvent=true: clicking the submit button focuses it, blurring the
      // currently focused field and firing onChange which may mutate formData before
      // the submit handler runs. fireEvent.submit bypasses that side-effect chain.
      await submitForm(node, user, true);
      expect(onError).toHaveBeenLastCalledWith([
        {
          message: "must have required property 'street_address'",
          name: 'required',
          params: { missingProperty: 'street_address' },
          property: '.shipping_address.street_address',
          schemaPath: '#/definitions/address/required',
          stack: "must have required property 'street_address'",
          title: '',
        },
        {
          message: "must have required property 'city'",
          name: 'required',
          params: { missingProperty: 'city' },
          property: '.shipping_address.city',
          schemaPath: '#/definitions/address/required',
          stack: "must have required property 'city'",
          title: '',
        },
        {
          message: "must have required property 'state'",
          name: 'required',
          params: { missingProperty: 'state' },
          property: '.shipping_address.state',
          schemaPath: '#/definitions/address/required',
          stack: "must have required property 'state'",
          title: '',
        },
      ]);
    });
    it('Submits when shipping address is filled out, billing address is not needed', async () => {
      const { node, onSubmit } = createFormComponent({
        schema,
        formData: {
          shipping_address: {
            street_address: '21, Jump Street',
            city: 'Babel',
            state: 'Neverland',
          },
        },
      });
      // forceFireEvent=true: clicking the submit button focuses it, blurring the
      // currently focused field and firing onChange which may mutate formData before
      // the submit handler runs. fireEvent.submit bypasses that side-effect chain.
      await submitForm(node, user, true);
      expectToHaveBeenCalledWithFormData(
        onSubmit,
        {
          shipping_address: {
            street_address: '21, Jump Street',
            city: 'Babel',
            state: 'Neverland',
          },
        },
        true,
      );
    });
  });

  describe('Default form state behavior flag', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        albums: {
          type: 'array',
          items: { type: 'string' },
          title: 'Album Titles',
          minItems: 3,
        },
      },
    };
    it('Errors when minItems is set, field is required, and minimum number of items are not present with IgnoreMinItemsUnlessRequired flag set', async () => {
      const { node, onError } = createFormComponent({
        schema: { ...schema, required: ['albums'] },
        formData: {
          albums: ['Until We Have Faces'],
        },
        experimental_defaultFormStateBehavior: { arrayMinItems: { populate: 'requiredOnly' } },
      });
      await submitForm(node, user);
      expect(onError).toHaveBeenLastCalledWith([
        {
          message: 'must NOT have fewer than 3 items',
          name: 'minItems',
          params: { limit: 3 },
          property: '.albums',
          schemaPath: '#/properties/albums/minItems',
          stack: "'Album Titles' must NOT have fewer than 3 items",
          title: 'Album Titles',
        },
      ]);
    });
    it('Submits when minItems is set, field is not required, and no items are present with IgnoreMinItemsUnlessRequired flag set', async () => {
      const { node, onSubmit } = createFormComponent({
        schema,
        formData: {},
        experimental_defaultFormStateBehavior: { arrayMinItems: { populate: 'requiredOnly' } },
      });
      await submitForm(node, user);
      expectToHaveBeenCalledWithFormData(onSubmit, {}, true);
    });
  });

  describe('Schema and external formData updates', () => {
    let rerender: RerenderType;
    let onChangeProp: Mock;
    let formProps: NoValFormProps;

    beforeEach(() => {
      formProps = {
        ref: createRef(),
        schema: {
          type: 'string',
          default: 'foobar',
        },
        formData: 'some value',
      };
      const { rerender: rerenderFn, onChange } = createFormComponent(formProps);
      onChangeProp = onChange;
      rerender = rerenderFn;
    });

    describe('when the form data is set to null', () => {
      beforeEach(() =>
        rerender({
          ...formProps,
          formData: null,
        }),
      );

      it('should call onChange', () => {
        expect(onChangeProp).toHaveBeenCalledTimes(1);
        expect(onChangeProp).toHaveBeenLastCalledWith(
          expect.objectContaining({
            edit: true,
            errorSchema: {},
            errors: [],
            formData: 'foobar',
            fieldPathId: { $id: 'root', path: [] },
            schema: formProps.schema,
            uiSchema: {},
            schemaUtils: expect.any(Object),
          }),
        );
      });
    });

    describe('when the schema default is changed but formData is not changed', () => {
      const newSchema: RJSFSchema = {
        type: 'string',
        default: 'the new default',
      };

      beforeEach(() =>
        rerender({
          ...formProps,
          schema: newSchema,
          formData: 'some value',
        }),
      );

      it('should not call onChange', () => {
        expect(onChangeProp).not.toHaveBeenCalled();
      });
    });

    describe('when the schema default is changed and formData is changed', () => {
      const newSchema: RJSFSchema = {
        type: 'string',
        default: 'the new default',
      };

      beforeEach(() =>
        rerender({
          ...formProps,
          schema: newSchema,
          formData: 'something else',
        }),
      );

      it('should not call onChange', () => {
        expect(onChangeProp).not.toHaveBeenCalled();
      });
    });

    describe('when the schema default is changed and formData is nulled', () => {
      const newSchema: RJSFSchema = {
        type: 'string',
        default: 'the new default',
      };

      beforeEach(() =>
        rerender({
          ...formProps,
          schema: newSchema,
          formData: null,
        }),
      );

      it('should call onChange', () => {
        expect(onChangeProp).toHaveBeenCalledTimes(1);
        expect(onChangeProp).toHaveBeenLastCalledWith(
          expect.objectContaining({
            schema: newSchema,
            formData: 'the new default',
          }),
        );
      });
    });

    describe('when the onChange prop sets formData to a falsey value', () => {
      function TestForm(props: { falseyValue: any }) {
        const [formData, setFormData] = useState<any>({});

        const onChange = useCallback(() => {
          setFormData(props.falseyValue);
        }, [props]);
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            value: {
              type: 'string',
            },
          },
        };
        return <Form onChange={onChange} schema={schema} formData={formData} validator={validator} />;
      }

      const falseyValues = [0, false, null, undefined, NaN];

      falseyValues.forEach((falseyValue) => {
        it("Should not crash due to 'Maximum call stack size exceeded...'", () => {
          // It is expected that this will throw an error due to non-matching propTypes,
          // so the error message needs to be inspected
          try {
            renderNode(TestForm, { falseyValue });
          } catch (e) {
            const { message } = e as Error;
            expect(message).not.toEqual('Maximum call stack size exceeded');
          }
        });
      });
    });
  });

  describe('External formData updates', () => {
    describe('root level', () => {
      const formProps: Omit<FormProps, 'validator'> = {
        ref: createRef(),
        schema: { type: 'string' },
      };

      it('should call submit handler with new formData prop value', async () => {
        const { node, onSubmit, rerender } = createFormComponent(formProps);

        rerender({
          ...formProps,
          onSubmit,
          formData: 'yo',
        });
        await submitForm(node, user);
        expectToHaveBeenCalledWithFormData(onSubmit, 'yo', true);
      });

      it('should validate formData when the schema is updated', async () => {
        const { node, onError, rerender } = createFormComponent(formProps);

        rerender({
          ...formProps,
          onError,
          formData: 'yo',
          schema: { type: 'number' },
        });
        await submitForm(node, user);
        expect(onError).toHaveBeenLastCalledWith([
          {
            message: 'must be number',
            name: 'type',
            params: { type: 'number' },
            property: '',
            schemaPath: '#/type',
            stack: 'must be number',
            title: '',
          },
        ]);
      });
    });

    describe('object level', () => {
      it('should call submit handler with new formData prop value', async () => {
        const formProps: Omit<FormProps, 'validator'> = {
          ref: createRef(),
          schema: { type: 'object', properties: { foo: { type: 'string' } } },
        };
        const { onSubmit, node, rerender } = createFormComponent(formProps);

        rerender({
          ...formProps,
          onSubmit,
          formData: { foo: 'yo' },
        });

        await submitForm(node, user);
        expectToHaveBeenCalledWithFormData(onSubmit, { foo: 'yo' }, true);
      });
    });

    describe('array level', () => {
      it('should call submit handler with new formData prop value', async () => {
        const schema: RJSFSchema = {
          type: 'array',
          items: {
            type: 'string',
          },
        };
        const { node, onSubmit, rerender } = createFormComponent({ ref: createRef(), schema });

        rerender({
          schema,
          onSubmit,
          formData: ['yo'],
        });

        await submitForm(node, user);
        expectToHaveBeenCalledWithFormData(onSubmit, ['yo'], true);
      });
    });
  });

  describe('Internal formData updates', () => {
    it('root', async () => {
      const { node, onChange } = createFormComponent({
        ref: createRef(),
        schema: { type: 'string' },
      });

      await user.type(node.querySelector<HTMLInputElement>('input[type=text]')!, 'yo');

      expectToHaveBeenCalledWithFormData(onChange, 'yo', 'root');
    });
    it('object', async () => {
      const { node, onChange } = createFormComponent({
        ref: createRef(),
        schema: {
          type: 'object',
          properties: {
            foo: {
              type: 'string',
            },
          },
        },
      });

      await user.type(node.querySelector<HTMLInputElement>('input[type=text]')!, 'yo');

      expectToHaveBeenCalledWithFormData(onChange, { foo: 'yo' }, 'root_foo');
    });
    it('array of strings', async () => {
      const schema: RJSFSchema = {
        type: 'array',
        items: {
          type: 'string',
        },
      };
      const { node, onChange } = createFormComponent({ ref: createRef(), schema });

      await user.click(node.querySelector('.rjsf-array-item-add button')!);

      await user.type(node.querySelector<HTMLInputElement>('input[type=text]')!, 'yo');
      expectToHaveBeenCalledWithFormData(onChange, ['yo'], 'root_0');
    });
    it('array of objects', async () => {
      const schema: RJSFSchema = {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
      };
      const { node, onChange } = createFormComponent({ ref: createRef(), schema });

      await user.click(node.querySelector('.rjsf-array-item-add button')!);

      await user.type(node.querySelector<HTMLInputElement>('input[type=text]')!, 'yo');

      expectToHaveBeenCalledWithFormData(onChange, [{ name: 'yo' }], 'root_0_name');
    });
    it('dependency with array of objects', async () => {
      const schema: RJSFSchema = {
        definitions: {},
        type: 'object',
        properties: {
          show: {
            type: 'boolean',
          },
        },
        dependencies: {
          show: {
            oneOf: [
              {
                properties: {
                  show: {
                    const: true,
                  },
                  participants: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: {
                          type: 'string',
                        },
                      },
                    },
                  },
                },
              },
            ],
          },
        },
      };
      const { node, onChange } = createFormComponent({ ref: createRef(), schema });

      const checkbox = node.querySelector('[type=checkbox]');
      await user.click(checkbox!);

      await user.click(node.querySelector('.rjsf-array-item-add button')!);

      await user.type(node.querySelector<HTMLInputElement>('input[type=text]')!, 'yo');

      expectToHaveBeenCalledWithFormData(
        onChange,
        {
          show: true,
          participants: [{ name: 'yo' }],
        },
        'root_participants_0_name',
      );
    });
  });
});
