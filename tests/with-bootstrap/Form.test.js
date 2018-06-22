import React from 'react';
import lolex from 'lolex';
import { render, cleanup, fireEvent, wait } from 'react-testing-library';

import Form from 'react-jsonschema-form/src';
import { createFormComponent, suppressLogs } from './test_utils';

describe('Form', () => {
  /**
   * We need cleanup after each render()
   * until this issue https://github.com/facebook/react/issues/2043 will be solved.
   */
  afterEach(cleanup);

  describe('Empty schema', () => {
    it('should render a form tag', () => {
      const { node } = createFormComponent({ schema: {} });

      expect(node.tagName).toEqual('FORM');
    });

    it('should render a submit button', () => {
      const { queryByText } = createFormComponent({ schema: {} });

      expect(queryByText('Submit')).toBeInTheDOM();
    });

    it('should render children buttons', () => {
      const props = { schema: {} };
      const { queryByText } = render(
        <Form {...props}>
          <button type="submit">Submit</button>
          <button type="submit">Another submit</button>
        </Form>
      );

      expect(queryByText('Submit')).toBeInTheDOM();
      expect(queryByText('Another submit')).toBeInTheDOM();
    });
  });

  describe('Option idPrefix', function() {
    it('should change the rendered ids', function() {
      const schema = {
        type: 'object',
        title: 'root object',
        required: ['foo'],
        properties: {
          count: {
            title: 'Count',
            type: 'number'
          }
        }
      };
      const { getByLabelText } = render(
        <Form schema={schema} idPrefix="rjsf" />
      );

      expect(getByLabelText('Count').getAttribute('id')).toBe('rjsf_count');
    });
  });

  describe('Changing idPrefix', function() {
    it('should work with oneOf', function() {
      const schema = {
        $schema: 'http://json-schema.org/draft-06/schema#',
        type: 'object',
        properties: {
          connector: {
            type: 'string',
            enum: ['aws', 'gcp'],
            title: 'Provider',
            default: 'aws'
          }
        },
        dependencies: {
          connector: {
            oneOf: [
              {
                type: 'object',
                properties: {
                  connector: {
                    type: 'string',
                    enum: ['aws']
                  },
                  key_aws: {
                    title: 'Key AWS',
                    type: 'string'
                  }
                }
              },
              {
                type: 'object',
                properties: {
                  connector: {
                    type: 'string',
                    enum: ['gcp']
                  },
                  key_gcp: {
                    type: 'string'
                  }
                }
              }
            ]
          }
        }
      };
      const { getByLabelText } = render(
        <Form schema={schema} idPrefix="rjsf" />
      );

      expect(getByLabelText('Key AWS').getAttribute('id')).toBe('rjsf_key_aws');
    });
  });

  describe('Custom field template', () => {
    const schema = {
      type: 'object',
      title: 'root object',
      required: ['foo'],
      properties: {
        foo: {
          title: 'Foo',
          type: 'string',
          description: 'this is description',
          minLength: 32
        }
      }
    };

    const uiSchema = {
      foo: {
        'ui:help': 'this is help'
      }
    };

    const formData = { foo: 'invalid' };

    function FieldTemplate(props) {
      const {
        id,
        classNames,
        label,
        help,
        rawHelp,
        required,
        description,
        rawDescription,
        errors,
        rawErrors,
        children
      } = props;
      return (
        <div className={classNames} data-testid="my-template">
          <label htmlFor={id} className="my-template__label">
            {label}
            {required ? '*' : null}
          </label>
          {description}
          {children}
          {errors}
          {help}
          <span data-testid="raw-help">
            {`${rawHelp} rendered from the raw format`}
          </span>
          <span data-testid="raw-description">
            {`${rawDescription} rendered from the raw format`}
          </span>
          {rawErrors ? (
            <ul>
              {rawErrors.map((error, i) => (
                <li key={i} data-testid="raw-error">
                  {error}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      );
    }
    const renderForm = () =>
      createFormComponent({
        schema,
        uiSchema,
        formData,
        FieldTemplate,
        liveValidate: true
      });

    it('should use the provided field template', () => {
      const { queryByTestId } = renderForm();
      expect(queryByTestId('my-template')).toBeInTheDOM();
    });

    it('should use the provided template for labels', () => {
      const { getByText } = renderForm();
      expect(getByText(/^root object/)).toHaveClass('my-template__label');
      expect(getByText(/^Foo/)).toHaveClass('my-template__label');
    });

    it('should pass description as the provided React element', () => {
      const { node } = renderForm();
      expect(node.querySelector('#root_foo__description')).toHaveTextContent(
        'this is description'
      );
    });

    it('should pass rawDescription as a string', () => {
      const { queryByTestId } = renderForm();
      expect(queryByTestId('raw-description')).toBeInTheDOM();
    });

    it('should pass errors as the provided React component', () => {
      const { node } = renderForm();
      expect(node.querySelectorAll('.error-detail li')).toHaveLength(1);
    });

    it('should pass rawErrors as an array of strings', () => {
      const { queryAllByTestId } = renderForm();
      expect(queryAllByTestId('raw-error')).toHaveLength(1);
    });

    it('should pass help as the string', () => {
      const { getByText } = renderForm();
      expect(getByText('this is help')).toBeInTheDOM();
    });

    it('should pass rawHelp as a string', () => {
      const { getByText } = renderForm();
      expect(
        getByText('this is help rendered from the raw format')
      ).toHaveAttribute('data-testid', 'raw-help');
    });
  });

  describe('Custom submit buttons', () => {
    it('should submit the form when clicked', () => {
      const onSubmit = jest.fn();
      const { getByText } = render(
        <Form onSubmit={onSubmit} schema={{}}>
          <button type="submit">Submit</button>
          <button type="submit">Another submit</button>
        </Form>
      );

      /**
       * From some of the reason this doesn't work with wait()
       * so we use lolex instead
       */
      const clock = lolex.install();
      fireEvent.click(getByText('Submit'));
      fireEvent.click(getByText('Another submit'));
      clock.tick();

      expect(onSubmit).toHaveBeenCalledTimes(2);
      clock.uninstall();
    });
  });

  describe('Schema definitions', () => {
    it('should use a single schema definition reference', () => {
      const schema = {
        definitions: {
          testdef: { title: 'TestDef', type: 'string' }
        },
        $ref: '#/definitions/testdef'
      };

      const { queryByText } = createFormComponent({ schema });

      expect(queryByText('TestDef')).toBeInTheDOM();
    });

    it('should handle multiple schema definition references', () => {
      const schema = {
        definitions: {
          testdef: { type: 'string' }
        },
        type: 'object',
        properties: {
          foo: { $ref: '#/definitions/testdef' },
          bar: { $ref: '#/definitions/testdef' }
        }
      };

      const { node } = createFormComponent({ schema });

      expect(node.querySelectorAll('input[type=text]')).toHaveLength(2);
    });

    it('should handle deeply referenced schema definitions', () => {
      const schema = {
        definitions: {
          testdef: { type: 'string' }
        },
        type: 'object',
        properties: {
          foo: {
            type: 'object',
            properties: {
              bar: { $ref: '#/definitions/testdef' }
            }
          }
        }
      };

      const { node } = createFormComponent({ schema });

      expect(node.querySelectorAll('input[type=text]')).toHaveLength(1);
    });

    it('should handle references to deep schema definitions', () => {
      const schema = {
        definitions: {
          testdef: {
            type: 'object',
            properties: {
              bar: { title: 'Bar', type: 'string' }
            }
          }
        },
        type: 'object',
        properties: {
          foo: { $ref: '#/definitions/testdef/properties/bar' }
        }
      };

      const { queryByText } = createFormComponent({ schema });

      expect(queryByText('Bar')).toBeInTheDOM();
    });

    it('should handle referenced definitions for array items', () => {
      const schema = {
        definitions: {
          testdef: { title: 'TestDef', type: 'string' }
        },
        type: 'object',
        properties: {
          foo: {
            type: 'array',
            items: { $ref: '#/definitions/testdef' }
          }
        }
      };

      const { queryByText } = createFormComponent({
        schema,
        formData: {
          foo: ['blah']
        }
      });

      expect(queryByText(/^TestDef/)).toBeInTheDOM();
    });

    it('should raise for non-existent definitions referenced', () => {
      const schema = {
        type: 'object',
        properties: {
          foo: { $ref: '#/definitions/nonexistent' }
        }
      };

      suppressLogs('error', () => {
        expect(() => createFormComponent({ schema })).toThrowError(Error);
      });
    });

    it('should propagate referenced definition defaults', () => {
      const schema = {
        definitions: {
          testdef: { type: 'string', default: 'hello' }
        },
        $ref: '#/definitions/testdef'
      };

      const { getByValue } = createFormComponent({ schema });

      expect(getByValue('hello')).toBeInTheDOM();
    });

    it('should propagate nested referenced definition defaults', () => {
      const schema = {
        definitions: {
          testdef: { type: 'string', default: 'hello' }
        },
        type: 'object',
        properties: {
          foo: { $ref: '#/definitions/testdef' }
        }
      };

      const { getByValue } = createFormComponent({ schema });

      expect(getByValue('hello')).toBeInTheDOM();
    });

    it('should propagate referenced definition defaults for array items', () => {
      const schema = {
        definitions: {
          testdef: { type: 'string', default: 'hello' }
        },
        type: 'array',
        items: {
          $ref: '#/definitions/testdef'
        }
      };

      const { getByTestId, queryByValue } = createFormComponent({ schema });

      expect(queryByValue('hello')).not.toBeInTheDOM();

      fireEvent.click(getByTestId('add-array-item'));

      expect(queryByValue('hello')).toBeInTheDOM();
    });

    it('should recursively handle referenced definitions', () => {
      const schema = {
        $ref: '#/definitions/node',
        definitions: {
          node: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              children: {
                type: 'array',
                items: {
                  $ref: '#/definitions/node'
                }
              }
            }
          }
        }
      };

      const { queryByModel, getByTestId } = createFormComponent({ schema });

      expect(queryByModel('children.0.name')).not.toBeInTheDOM();

      fireEvent.click(getByTestId('add-array-item'));

      expect(queryByModel('children.0.name')).toBeInTheDOM();
    });

    it('should priorize definition over schema type property', () => {
      // Refs bug #140
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          childObj: {
            type: 'object',
            $ref: '#/definitions/childObj'
          }
        },
        definitions: {
          childObj: {
            title: 'Child Obj',
            type: 'object',
            properties: {
              otherName: { type: 'string' }
            }
          }
        }
      };

      const { queryByText } = createFormComponent({ schema });

      expect(queryByText('Child Obj')).toBeInTheDOM();
    });

    it('should priorize local properties over definition ones', () => {
      // Refs bug #140
      const schema = {
        type: 'object',
        properties: {
          foo: {
            title: 'custom title',
            $ref: '#/definitions/objectDef'
          }
        },
        definitions: {
          objectDef: {
            type: 'object',
            title: 'definition title',
            properties: {
              field: { type: 'string' }
            }
          }
        }
      };

      const { queryByText } = createFormComponent({ schema });

      expect(queryByText('custom title')).toBeInTheDOM();
    });

    it('should propagate and handle a resolved schema definition', () => {
      const schema = {
        definitions: {
          enumDef: { type: 'string', enum: ['a', 'b'] }
        },
        type: 'object',
        properties: {
          name: { $ref: '#/definitions/enumDef' }
        }
      };

      const { node } = createFormComponent({ schema });

      expect(node.querySelectorAll('option')).toHaveLength(3);
    });
  });

  describe('Default value handling on clear', () => {
    const schema = {
      title: 'Foo',
      type: 'string',
      default: 'foo'
    };

    it('should not set default when a text field is cleared', () => {
      const { getByLabelText } = createFormComponent({
        schema,
        formData: 'bar'
      });
      const input = getByLabelText('Foo');

      input.value = '';
      fireEvent.change(input);

      expect(input.value).toBe('');
    });
  });

  describe('Defaults array items default propagation', () => {
    const schema = {
      type: 'object',
      title: 'lvl 1 obj',
      properties: {
        object: {
          type: 'object',
          title: 'lvl 2 obj',
          properties: {
            array: {
              type: 'array',
              items: {
                type: 'object',
                title: 'lvl 3 obj',
                properties: {
                  bool: {
                    type: 'boolean',
                    default: true
                  }
                }
              }
            }
          }
        }
      }
    };

    it('should propagate deeply nested defaults to form state', async () => {
      const { getInstance, node, getByTestId } = createFormComponent({
        schema
      });

      fireEvent.click(getByTestId('add-array-item'));

      await wait(() => {
        fireEvent.submit(node);
      });

      expect(getInstance().state.formData).toEqual({
        object: {
          array: [{ bool: true }]
        }
      });
    });
  });

  describe('Submit handler', () => {
    it('should call provided submit handler with form state', async () => {
      const schema = {
        type: 'object',
        properties: {
          foo: { type: 'string' }
        }
      };
      const formData = {
        foo: 'bar'
      };
      const onSubmit = jest.fn();
      const { getInstance, node } = createFormComponent({
        schema,
        formData,
        onSubmit
      });

      await wait(() => {
        fireEvent.submit(node);
      });

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining(getInstance().state)
      );
    });

    it('should not call provided submit handler on validation errors', async () => {
      const schema = {
        type: 'object',
        properties: {
          foo: {
            type: 'string',
            minLength: 1
          }
        }
      };
      const formData = {
        foo: ''
      };
      const onSubmit = jest.fn();
      const onError = jest.fn();
      const { node } = createFormComponent({
        schema,
        formData,
        onSubmit,
        onError
      });

      await wait(() => {
        fireEvent.submit(node);
      });

      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Change handler', () => {
    it('should call provided change handler on form state change', () => {
      const schema = {
        type: 'object',
        properties: {
          foo: {
            title: 'Foo',
            type: 'string'
          }
        }
      };
      const formData = {
        foo: ''
      };
      const onChange = jest.fn();
      const { getByLabelText } = createFormComponent({
        schema,
        formData,
        onChange
      });
      const input = getByLabelText('Foo');

      input.value = 'new';
      fireEvent.change(input);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ formData: { foo: 'new' } })
      );
    });
  });

  describe('Blur handler', () => {
    it('should call provided blur handler on form input blur event', () => {
      const schema = {
        type: 'object',
        properties: {
          foo: {
            title: 'Foo',
            type: 'string'
          }
        }
      };
      const formData = {
        foo: ''
      };
      const onBlur = jest.fn();
      const { getByLabelText } = createFormComponent({
        schema,
        formData,
        onBlur
      });

      const input = getByLabelText('Foo');

      input.value = 'new';
      fireEvent.blur(input);

      expect(onBlur).toHaveBeenCalledWith(input.id, 'new');
    });
  });

  describe('Focus handler', () => {
    it('should call provided focus handler on form input focus event', () => {
      const schema = {
        type: 'object',
        properties: {
          foo: {
            title: 'Foo',
            type: 'string'
          }
        }
      };
      const formData = {
        foo: ''
      };
      const onFocus = jest.fn();
      const { getByLabelText } = createFormComponent({
        schema,
        formData,
        onFocus
      });

      const input = getByLabelText('Foo');

      input.value = 'new';
      fireEvent.focus(input);

      expect(onFocus).toHaveBeenCalledWith(input.id, 'new');
    });
  });

  describe('Error handler', () => {
    it('should call provided error handler on validation errors', () => {
      const schema = {
        type: 'object',
        properties: {
          foo: {
            title: 'Foo',
            type: 'string',
            minLength: 1
          }
        }
      };
      const formData = {
        foo: ''
      };
      const onError = jest.fn();
      const { node } = createFormComponent({ schema, formData, onError });

      fireEvent.submit(node);

      expect(onError).toHaveBeenCalledTimes(1);
    });
  });

  describe('External formData updates', () => {
    describe('root level', () => {
      const formProps = {
        schema: { type: 'string' },
        liveValidate: true
      };

      it('should update form state from new formData prop value', () => {
        const { rerender, getInstance } = createFormComponent(formProps);

        rerender({ formData: 'yo' });
        // rerender({ formData: 'yo' });

        expect(getInstance().state.formData).toBe('yo');
      });

      it('should validate formData when the schema is updated', () => {
        const { rerender, getInstance } = createFormComponent(formProps);

        rerender({
          formData: 'yo',
          schema: { type: 'number' }
        });

        expect(getInstance().state.errors).toHaveLength(1);
        expect(getInstance().state.errors[0].stack).toEqual('should be number');
      });
    });

    describe('object level', () => {
      it('should update form state from new formData prop value', () => {
        const { rerender, getInstance } = createFormComponent({
          schema: {
            type: 'object',
            properties: {
              foo: {
                type: 'string'
              }
            }
          }
        });

        rerender({ formData: { foo: 'yo' } });

        expect(getInstance().state.formData).toEqual({ foo: 'yo' });
      });
    });

    describe('array level', () => {
      it('should update form state from new formData prop value', () => {
        const schema = {
          type: 'array',
          items: {
            type: 'string'
          }
        };
        const { rerender, getInstance } = createFormComponent({ schema });

        rerender({ formData: ['yo'] });

        expect(getInstance().state.formData).toEqual(['yo']);
      });
    });
  });

  describe('Error contextualization', () => {
    describe('on form state updated', () => {
      const schema = {
        title: 'Foo',
        type: 'string',
        minLength: 8
      };

      describe('Lazy validation', () => {
        it('should not update the errorSchema when the formData changes', () => {
          const { getInstance, getByLabelText } = createFormComponent({
            schema
          });
          const input = getByLabelText('Foo');

          input.value = 'short';
          fireEvent.change(input);

          expect(getInstance().state.errorSchema).toEqual({});
        });

        it('should not denote an error in the field', () => {
          const { getByLabelText, node } = createFormComponent({
            schema
          });
          const input = getByLabelText('Foo');

          input.value = 'short';
          fireEvent.change(input);

          expect(node.querySelectorAll('.field-error')).toHaveLength(0);
        });

        it('should clean contextualized errors up when they\'re fixed', () => {
          const altSchema = {
            type: 'object',
            properties: {
              field1: { title: 'Field 1', type: 'string', minLength: 8 },
              field2: { title: 'Field 2', type: 'string', minLength: 8 }
            }
          };
          const { node, getByLabelText } = createFormComponent({
            schema: altSchema,
            formData: {
              field1: 'short',
              field2: 'short'
            }
          });
          const form = node;
          const field1 = getByLabelText('Field 1');
          const field2 = getByLabelText('Field 2');

          function submit(node) {
            // Validation is expected to fail and call console.error, which is
            // stubbed to actually throw in createSandbox().
            suppressLogs('error', () => {
              fireEvent.submit(node);
            });
          }

          submit(form);

          // Fix the first field
          field1.value = 'fixed error';
          fireEvent.change(field1);
          submit(form);

          expect(node.querySelectorAll('.field-error')).toHaveLength(1);

          // Fix the second field
          field2.value = 'fixed error too';
          fireEvent.change(field2);
          submit(form);

          // No error remaining, shouldn't throw.
          fireEvent.submit(form);

          expect(node.querySelectorAll('.field-error')).toHaveLength(0);
        });
      });

      describe('Live validation', () => {
        it('should update the errorSchema when the formData changes', () => {
          const { getInstance, getByLabelText } = createFormComponent({
            schema,
            liveValidate: true
          });
          const input = getByLabelText('Foo');

          input.value = 'short';
          fireEvent.change(input);

          expect(getInstance().state.errorSchema).toEqual({
            __errors: ['should NOT be shorter than 8 characters']
          });
        });

        it('should denote the new error in the field', () => {
          const { getByLabelText, node } = createFormComponent({
            schema,
            liveValidate: true
          });
          const input = getByLabelText('Foo');

          input.value = 'short';
          fireEvent.change(input);

          expect(node.querySelectorAll('.field-error')).toHaveLength(1);
          expect(
            node.querySelector('.field-string .error-detail')
          ).toHaveTextContent('should NOT be shorter than 8 characters');
        });
      });

      describe('Disable validation onChange event', () => {
        it('should not update errorSchema when the formData changes', () => {
          const { getInstance, getByLabelText } = createFormComponent({
            schema,
            noValidate: true,
            liveValidate: true
          });
          const input = getByLabelText('Foo');

          input.value = 'short';
          fireEvent.change(input);

          expect(getInstance().state.errorSchema).toEqual({});
        });
      });

      describe('Disable validation onSubmit event', () => {
        it('should not update errorSchema when the formData changes', () => {
          const { getInstance, getByLabelText, node } = createFormComponent({
            schema,
            noValidate: true
          });
          const input = getByLabelText('Foo');

          input.value = 'short';
          fireEvent.change(input);

          fireEvent.submit(node);

          expect(getInstance().state.errorSchema).toEqual({});
        });
      });
    });

    describe('on form submitted', () => {
      const schema = {
        title: 'Foo',
        type: 'string',
        minLength: 8
      };

      it('should update the errorSchema on form submission', () => {
        const { getInstance, getByLabelText, node } = createFormComponent({
          schema,
          onError: () => {}
        });
        const input = getByLabelText('Foo');

        input.value = 'short';
        fireEvent.change(input);

        fireEvent.submit(node);

        expect(getInstance().state.errorSchema).toEqual({
          __errors: ['should NOT be shorter than 8 characters']
        });
      });

      it('should call the onError handler', async () => {
        const onError = jest.fn();
        const { node, getByLabelText } = createFormComponent({
          schema,
          onError
        });
        const input = getByLabelText('Foo');

        input.value = 'short';
        fireEvent.change(input);

        fireEvent.submit(node);

        expect(onError).toHaveBeenCalledWith([
          expect.objectContaining({
            message: 'should NOT be shorter than 8 characters'
          })
        ]);
      });

      it('should reset errors and errorSchema state to initial state after correction and resubmission', () => {
        const onError = jest.fn();
        const { getInstance, node, getByLabelText } = createFormComponent({
          schema,
          onError
        });
        const input = getByLabelText('Foo');

        input.value = 'short';
        fireEvent.change(input);

        fireEvent.submit(node);

        expect(getInstance().state.errorSchema).toEqual({
          __errors: ['should NOT be shorter than 8 characters']
        });
        expect(getInstance().state.errors).toHaveLength(1);

        expect(onError).toHaveBeenCalledTimes(1);

        input.value = 'long enough';
        fireEvent.change(input);

        fireEvent.submit(node);

        expect(getInstance().state.errorSchema).toEqual({});
        expect(getInstance().state.errors).toEqual([]);

        expect(onError).toHaveBeenCalledTimes(1);
      });
    });

    describe('root level', () => {
      const formProps = {
        liveValidate: true,
        schema: {
          type: 'string',
          minLength: 8
        },
        formData: 'short'
      };

      it('should reflect the contextualized error in state', () => {
        const { getInstance } = createFormComponent(formProps);

        expect(getInstance().state.errorSchema).toEqual({
          __errors: ['should NOT be shorter than 8 characters']
        });
      });

      it('should denote the error in the field', () => {
        const { node } = createFormComponent(formProps);

        expect(node.querySelectorAll('.field-error')).toHaveLength(1);
        expect(
          node.querySelector('.field-string .error-detail')
        ).toHaveTextContent('should NOT be shorter than 8 characters');
      });
    });

    describe('root level with multiple errors', () => {
      const formProps = {
        liveValidate: true,
        schema: {
          type: 'string',
          minLength: 8,
          pattern: 'd+'
        },
        formData: 'short'
      };

      it('should reflect the contextualized error in state', () => {
        const { getInstance } = createFormComponent(formProps);
        expect(getInstance().state.errorSchema).toEqual({
          __errors: [
            'should NOT be shorter than 8 characters',
            'should match pattern "d+"'
          ]
        });
      });

      it('should denote the error in the field', () => {
        const { node } = createFormComponent(formProps);

        const liNodes = node.querySelectorAll('.field-string .error-detail li');
        const errors = [].map.call(liNodes, li => li.textContent);

        expect(errors).toEqual([
          'should NOT be shorter than 8 characters',
          'should match pattern "d+"'
        ]);
      });
    });

    describe('nested field level', () => {
      const schema = {
        type: 'object',
        properties: {
          level1: {
            type: 'object',
            properties: {
              level2: {
                type: 'string',
                minLength: 8
              }
            }
          }
        }
      };

      const formProps = {
        schema,
        liveValidate: true,
        formData: {
          level1: {
            level2: 'short'
          }
        }
      };

      it('should reflect the contextualized error in state', () => {
        const { getInstance } = createFormComponent(formProps);

        expect(getInstance().state.errorSchema).toEqual({
          level1: {
            level2: { __errors: ['should NOT be shorter than 8 characters'] }
          }
        });
      });

      it('should denote the error in the field', () => {
        const { node } = createFormComponent(formProps);
        const errorDetail = node.querySelector(
          '.field-object .field-string .error-detail'
        );

        expect(node.querySelectorAll('.field-error')).toHaveLength(1);
        expect(errorDetail).toHaveTextContent(
          'should NOT be shorter than 8 characters'
        );
      });
    });

    describe('array indices', () => {
      const schema = {
        type: 'array',
        items: {
          type: 'string',
          minLength: 4
        }
      };

      const formProps = {
        schema,
        liveValidate: true,
        formData: ['good', 'bad', 'good']
      };

      it('should contextualize the error for array indices', () => {
        const { getInstance } = createFormComponent(formProps);

        expect(getInstance().state.errorSchema).toEqual({
          1: {
            __errors: ['should NOT be shorter than 4 characters']
          }
        });
      });

      it('should denote the error in the item field in error', () => {
        const { node } = createFormComponent(formProps);
        const fieldNodes = node.querySelectorAll('.field-string');

        const liNodes = fieldNodes[1].querySelectorAll(
          '.field-string .error-detail li'
        );
        const errors = [].map.call(liNodes, li => li.textContent);

        expect(fieldNodes[1]).toHaveClass('field-error');
        expect(errors).toEqual(['should NOT be shorter than 4 characters']);
      });

      it('should not denote errors on non impacted fields', () => {
        const { node } = createFormComponent(formProps);
        const fieldNodes = node.querySelectorAll('.field-string');

        expect(fieldNodes[0]).not.toHaveClass('field-error');
        expect(fieldNodes[2]).not.toHaveClass('field-error');
      });
    });

    describe('nested array indices', () => {
      const schema = {
        type: 'object',
        properties: {
          level1: {
            type: 'array',
            items: {
              type: 'string',
              minLength: 4
            }
          }
        }
      };

      const formProps = { schema, liveValidate: true };

      it('should contextualize the error for nested array indices', () => {
        const { getInstance } = createFormComponent({
          ...formProps,
          formData: {
            level1: ['good', 'bad', 'good', 'bad']
          }
        });

        expect(getInstance().state.errorSchema).toEqual({
          level1: {
            1: {
              __errors: ['should NOT be shorter than 4 characters']
            },
            3: {
              __errors: ['should NOT be shorter than 4 characters']
            }
          }
        });
      });

      it('should denote the error in the nested item field in error', () => {
        const { node } = createFormComponent({
          ...formProps,
          formData: {
            level1: ['good', 'bad', 'good']
          }
        });

        const liNodes = node.querySelectorAll('.field-string .error-detail li');
        const errors = [].map.call(liNodes, li => li.textContent);

        expect(errors).toEqual(['should NOT be shorter than 4 characters']);
      });
    });

    describe('nested arrays', () => {
      const schema = {
        type: 'object',
        properties: {
          outer: {
            type: 'array',
            items: {
              type: 'array',
              items: {
                type: 'string',
                minLength: 4
              }
            }
          }
        }
      };

      const formData = {
        outer: [['good', 'bad'], ['bad', 'good']]
      };

      const formProps = { schema, formData, liveValidate: true };

      it('should contextualize the error for nested array indices', () => {
        const { getInstance } = createFormComponent(formProps);

        expect(getInstance().state.errorSchema).toEqual({
          outer: {
            0: {
              1: {
                __errors: ['should NOT be shorter than 4 characters']
              }
            },
            1: {
              0: {
                __errors: ['should NOT be shorter than 4 characters']
              }
            }
          }
        });
      });

      it('should denote the error in the nested item field in error', () => {
        const { node } = createFormComponent(formProps);
        const fields = node.querySelectorAll('.field-string');
        const errors = [].map.call(fields, field => {
          const li = field.querySelector('.error-detail li');
          return li && li.textContent;
        });

        expect(errors).toEqual([
          null,
          'should NOT be shorter than 4 characters',
          'should NOT be shorter than 4 characters',
          null
        ]);
      });
    });

    describe('array nested items', () => {
      const schema = {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            foo: {
              type: 'string',
              minLength: 4
            }
          }
        }
      };

      const formProps = {
        schema,
        liveValidate: true,
        formData: [{ foo: 'good' }, { foo: 'bad' }, { foo: 'good' }]
      };

      it('should contextualize the error for array nested items', () => {
        const { getInstance } = createFormComponent(formProps);

        expect(getInstance().state.errorSchema).toEqual({
          1: {
            foo: {
              __errors: ['should NOT be shorter than 4 characters']
            }
          }
        });
      });

      it('should denote the error in the array nested item', () => {
        const { node } = createFormComponent(formProps);
        const fieldNodes = node.querySelectorAll('.field-string');

        const liNodes = fieldNodes[1].querySelectorAll(
          '.field-string .error-detail li'
        );
        const errors = [].map.call(liNodes, li => li.textContent);

        expect(fieldNodes[1].classList.contains('field-error')).toEqual(true);
        expect(errors).toEqual(['should NOT be shorter than 4 characters']);
      });
    });

    describe('schema dependencies', () => {
      const schema = {
        type: 'object',
        properties: {
          branch: {
            type: 'number',
            enum: [1, 2, 3],
            default: 1
          }
        },
        required: ['branch'],
        dependencies: {
          branch: {
            oneOf: [
              {
                properties: {
                  branch: {
                    enum: [1]
                  },
                  field1: {
                    type: 'number'
                  }
                },
                required: ['field1']
              },
              {
                properties: {
                  branch: {
                    enum: [2]
                  },
                  field1: {
                    type: 'number'
                  },
                  field2: {
                    type: 'number'
                  }
                },
                required: ['field1', 'field2']
              }
            ]
          }
        }
      };

      it.skip('should only show error for property in selected branch', () => {
        const { getInstance, node } = createFormComponent({
          schema,
          liveValidate: true
        });

        fireEvent.change(node.querySelector('input[type=text]'), {
          target: { value: 'not a number' }
        });

        expect(getInstance().state.errorSchema).toEqual({
          field1: {
            __errors: ['should be number']
          }
        });
      });

      it.skip('should only show errors for properties in selected branch', () => {
        const { getInstance, node } = createFormComponent({
          schema,
          liveValidate: true,
          formData: { branch: 2 }
        });

        fireEvent.change(node.querySelector('input[type=text]'), {
          target: { value: 'not a number' }
        });

        expect(getInstance().state.errorSchema).toEqual({
          field1: {
            __errors: ['should be number']
          },
          field2: {
            __errors: ['is a required property']
          }
        });
      });

      it('should not show any errors when branch is empty', () => {
        const { getInstance, node } = createFormComponent({
          schema,
          liveValidate: true,
          formData: { branch: 3 }
        });

        fireEvent.change(node.querySelector('select'), {
          target: { value: 3 }
        });

        expect(getInstance().state.errorSchema).toEqual({});
      });
    });
  });

  describe('Schema and formData updates', () => {
    // https://github.com/mozilla-services/react-jsonschema-form/issues/231
    const schema = {
      type: 'object',
      properties: {
        foo: { title: 'Foo', type: 'string' },
        bar: { title: 'Bar', type: 'string' }
      }
    };

    it('should replace state when formData have keys removed', () => {
      const formData = { foo: 'foo', bar: 'bar' };
      const { rerender, getInstance, getByLabelText } = createFormComponent({
        schema,
        formData
      });
      const inputBar = getByLabelText('Bar');

      rerender({
        schema: {
          type: 'object',
          properties: {
            bar: { title: 'Bar', type: 'string' }
          }
        },
        formData: { bar: 'bar' }
      });

      inputBar.value = 'baz';
      fireEvent.change(inputBar);

      expect(getInstance().state.formData).toEqual({ bar: 'baz' });
    });

    it('should replace state when formData keys have changed', () => {
      const formData = { foo: 'foo', bar: 'bar' };
      const { rerender, getInstance, getByLabelText } = createFormComponent({
        schema,
        formData
      });

      rerender({
        schema: {
          type: 'object',
          properties: {
            foo: { type: 'string' },
            baz: { title: 'Baz', type: 'string' }
          }
        },
        formData: { foo: 'foo', baz: 'bar' }
      });
      const inputBaz = getByLabelText('Baz');

      inputBaz.value = 'baz';
      fireEvent.change(inputBaz);

      expect(getInstance().state.formData).toEqual({ foo: 'foo', baz: 'baz' });
    });
  });

  describe('idSchema updates based on formData', () => {
    const schema = {
      type: 'object',
      properties: {
        a: { type: 'string', enum: ['int', 'bool'] }
      },
      dependencies: {
        a: {
          oneOf: [
            {
              properties: {
                a: { enum: ['int'] }
              }
            },
            {
              properties: {
                a: { enum: ['bool'] },
                b: { type: 'boolean' }
              }
            }
          ]
        }
      }
    };

    it('should not update idSchema for a falsey value', () => {
      const formData = { a: 'int' };
      const { rerender, getInstance } = createFormComponent({
        schema,
        formData
      });

      rerender({
        schema: {
          type: 'object',
          properties: {
            a: { type: 'string', enum: ['int', 'bool'] }
          },
          dependencies: {
            a: {
              oneOf: [
                {
                  properties: {
                    a: { enum: ['int'] }
                  }
                },
                {
                  properties: {
                    a: { enum: ['bool'] },
                    b: { type: 'boolean' }
                  }
                }
              ]
            }
          }
        },
        formData: { a: 'int' }
      });

      expect(getInstance().state.idSchema).toEqual({
        $id: 'root',
        a: { $id: 'root_a' }
      });
    });

    it('should update idSchema based on truthy value', () => {
      const formData = {
        a: 'int'
      };
      const { rerender, getInstance } = createFormComponent({
        schema,
        formData
      });
      rerender({
        schema: {
          type: 'object',
          properties: {
            a: { type: 'string', enum: ['int', 'bool'] }
          },
          dependencies: {
            a: {
              oneOf: [
                {
                  properties: {
                    a: { enum: ['int'] }
                  }
                },
                {
                  properties: {
                    a: { enum: ['bool'] },
                    b: { type: 'boolean' }
                  }
                }
              ]
            }
          }
        },
        formData: { a: 'bool' }
      });
      expect(getInstance().state.idSchema).toEqual({
        $id: 'root',
        a: { $id: 'root_a' },
        b: { $id: 'root_b' }
      });
    });
  });

  describe('Attributes', () => {
    const formProps = {
      schema: {},
      id: 'test-form',
      className: 'test-class other-class',
      name: 'testName',
      method: 'post',
      target: '_blank',
      action: '/users/list',
      autocomplete: 'off',
      enctype: 'multipart/form-data',
      acceptcharset: 'ISO-8859-1',
      noHtml5Validate: true
    };

    let form;

    beforeEach(() => {
      form = createFormComponent(formProps).node;
    });

    it('should set attr id of form', () => {
      expect(form.getAttribute('id')).toEqual(formProps.id);
    });

    it('should set attr class of form', () => {
      expect(form.getAttribute('class')).toEqual(formProps.className);
    });

    it('should set attr name of form', () => {
      expect(form.getAttribute('name')).toEqual(formProps.name);
    });

    it('should set attr method of form', () => {
      expect(form.getAttribute('method')).toEqual(formProps.method);
    });

    it('should set attr target of form', () => {
      expect(form.getAttribute('target')).toEqual(formProps.target);
    });

    it('should set attr action of form', () => {
      expect(form.getAttribute('action')).toEqual(formProps.action);
    });

    it('should set attr autoComplete of form', () => {
      expect(form.getAttribute('autocomplete')).toEqual(formProps.autocomplete);
    });

    it('should set attr enctype of form', () => {
      expect(form.getAttribute('enctype')).toEqual(formProps.enctype);
    });

    it('should set attr acceptcharset of form', () => {
      expect(form.getAttribute('accept-charset')).toEqual(
        formProps.acceptcharset
      );
    });

    it('should set attr novalidate of form', () => {
      expect(form.getAttribute('novalidate')).not.toBeNull();
    });
  });
});
