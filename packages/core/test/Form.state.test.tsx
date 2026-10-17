import type { RefObject } from 'react';
import { createRef, useState, useCallback } from 'react';
import type { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { act } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { Mock } from 'vitest';

import type { FormRef, FormProps } from '../src/index.ts';
import Form from '../src/index.ts';
import type { NoValFormProps, RerenderType } from './testUtils.tsx';
import {
  createFormRef,
  describeRepeated,
  expectToHaveBeenCalledWithFormData,
  handleOf,
  renderNode,
  submitForm,
} from './testUtils.tsx';

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
      const { node, onError, getFormData } = createFormComponent({ schema });
      expect(getFormData()).toEqual({ shipping_address: {} });
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
        initialFormData: {
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
        initialFormData: {
          albums: ['Until We Have Faces'],
        },
        defaultFormStateBehavior: { arrayMinItems: { populate: 'requiredOnly' } },
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
        initialFormData: {},
        defaultFormStateBehavior: { arrayMinItems: { populate: 'requiredOnly' } },
      });
      await submitForm(node, user);
      expectToHaveBeenCalledWithFormData(onSubmit, {}, true);
    });
  });

  describe('Schema and external formData updates', () => {
    let rerender: RerenderType;
    let onChangeProp: Mock;
    let formProps: NoValFormProps;
    let ref: RefObject<FormRef | null>;

    beforeEach(() => {
      ref = createFormRef();
      formProps = {
        ref,
        schema: {
          type: 'string',
          default: 'foobar',
        },
        initialFormData: 'some value',
      };
      const { rerender: rerenderFn, onChange } = createFormComponent(formProps);
      onChangeProp = onChange;
      rerender = rerenderFn;
    });

    describe('when the form mounts with null form data', () => {
      it('should take the null as no data and render the default without calling onChange', () => {
        const nullRef = createFormRef();
        const { onChange } = createFormComponent({ ...formProps, ref: nullRef, initialFormData: null });

        expect(onChange).not.toHaveBeenCalled();
        expect(handleOf(nullRef).getFormData()).toBe('foobar');
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
          initialFormData: 'some value',
        }),
      );

      it('should not call onChange', () => {
        expect(onChangeProp).not.toHaveBeenCalled();
      });
    });

    describe('when the schema default is changed and the form is reset to a null seed', () => {
      const newSchema: RJSFSchema = {
        type: 'string',
        default: 'the new default',
      };

      beforeEach(() => {
        rerender({
          ...formProps,
          schema: newSchema,
          initialFormData: null,
        });
        act(() => handleOf(ref).reset());
      });

      it('should take the null as no data and fill in the new default, reporting it through onChange', () => {
        expect(handleOf(ref).getFormData()).toBe('the new default');
        expectToHaveBeenCalledWithFormData(onChangeProp, 'the new default');
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
        // oxlint-disable-next-line typescript/no-deprecated -- pins the v6 echo pattern, passing back what onChange reported as `formData`
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
        initialFormData: 'initial',
      };

      it('should call submit handler with the data set through setFieldValue', async () => {
        const rootRef = createFormRef();
        const { node, onSubmit } = createFormComponent({ ...formProps, ref: rootRef });

        act(() => handleOf(rootRef).setFieldValue('', 'yo'));
        await submitForm(node, user);
        expectToHaveBeenCalledWithFormData(onSubmit, 'yo', true);
      });

      it('should validate formData when the schema is updated', async () => {
        const { node, onError, rerender } = createFormComponent(formProps);

        rerender({
          ...formProps,
          onError,
          schema: { type: 'number' },
          // The number field's native `pattern` would block submitting 'yo' before AJV's type check ran
          noHtml5Validate: true,
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
      it('should call submit handler with the data set through setFieldValue', async () => {
        const objectRef = createFormRef();
        const { onSubmit, node } = createFormComponent({
          ref: objectRef,
          schema: { type: 'object', properties: { foo: { type: 'string' } } },
          initialFormData: {},
        });

        act(() => handleOf(objectRef).setFieldValue('', { foo: 'yo' }));

        await submitForm(node, user);
        expectToHaveBeenCalledWithFormData(onSubmit, { foo: 'yo' }, true);
      });
    });

    describe('array level', () => {
      it('should call submit handler with the data set through setFieldValue', async () => {
        const schema: RJSFSchema = {
          type: 'array',
          items: {
            type: 'string',
          },
        };
        const arrayRef = createFormRef();
        const { node, onSubmit } = createFormComponent({ ref: arrayRef, schema, initialFormData: [] });

        act(() => handleOf(arrayRef).setFieldValue('', ['yo']));

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
