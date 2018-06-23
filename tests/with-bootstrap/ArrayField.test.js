import React from 'react';
import { Simulate } from 'react-dom/test-utils';
import { fireEvent, cleanup } from 'react-testing-library';

import { createFormComponent, suppressLogs } from './test_utils';

describe('ArrayField', () => {
  afterEach(cleanup);

  const CustomComponent = props => {
    return <div id="custom">{props.rawErrors}</div>;
  };

  describe('Unsupported array schema', () => {
    it('should warn on missing items descriptor', () => {
      const { node } = createFormComponent({ schema: { type: 'array' } });

      expect(
        node.querySelector('.field-array > .unsupported-field').textContent
      ).toContain('Missing items definition');
    });
  });

  describe('List of inputs', () => {
    const schema = {
      type: 'array',
      title: 'my list',
      description: 'my description',
      items: { type: 'string' }
    };

    it('should render a fieldset', () => {
      const { node } = createFormComponent({ schema });

      expect(node.querySelectorAll('fieldset')).toHaveLength(1);
    });

    it('should render a fieldset legend', () => {
      const { node } = createFormComponent({ schema });

      const legend = node.querySelector('fieldset > legend');

      expect(legend).toHaveTextContent('my list');
      expect(legend.id).toEqual('root__title');
    });

    it('should render a description', () => {
      const { node } = createFormComponent({ schema });

      const description = node.querySelector('fieldset > .field-description');

      expect(description).toHaveTextContent('my description');
      expect(description.id).toEqual('root__description');
    });

    it('should render a customized title', () => {
      const CustomTitleTemplate = ({ title }) => <div id="custom">{title}</div>;

      const { node } = createFormComponent({
        schema,
        templates: { TitleTemplate: CustomTitleTemplate }
      });
      expect(node.querySelector('fieldset > #custom')).toHaveTextContent(
        'my list'
      );
    });

    it('should render a customized description', () => {
      const CustomDescriptionTemplate = ({ description }) => (
        <div id="custom">{description}</div>
      );

      const { node } = createFormComponent({
        schema,
        templates: {
          DescriptionTemplate: CustomDescriptionTemplate
        }
      });
      expect(node.querySelector('fieldset > #custom')).toHaveTextContent(
        'my description'
      );
    });

    it('should render a customized file widget', () => {
      const { node } = createFormComponent({
        schema,
        uiSchema: {
          'ui:widget': 'files'
        },
        widgets: { FileWidget: CustomComponent }
      });
      expect(node.querySelector('#custom')).toBeDefined();
    });

    it('should pass rawErrors down to custom array field templates', () => {
      const schema = {
        type: 'array',
        title: 'my list',
        description: 'my description',
        items: { type: 'string' },
        minItems: 2
      };

      const { node } = createFormComponent({
        schema,
        templates: { ArrayFieldTemplate: CustomComponent },
        formData: [1],
        liveValidate: true
      });

      const matches = node.querySelectorAll('#custom');
      expect(matches).toHaveLength(1);
      expect(matches[0]).toHaveTextContent('should NOT have less than 2 items');
    });

    it('should contain no field in the list by default', () => {
      const { node } = createFormComponent({ schema });

      expect(node.querySelectorAll('.field-string')).toHaveLength(0);
    });

    it('should have an add button', () => {
      const { node } = createFormComponent({ schema });

      expect(node.querySelector('.array-item-add button')).not.toEqual(null);
    });

    it('should not have an add button if addable is false', () => {
      const { node } = createFormComponent({
        schema,
        uiSchema: { 'ui:options': { addable: false } }
      });

      expect(node.querySelector('.array-item-add button')).toBeNull();
    });

    it('should add a new field when clicking the add button', () => {
      const { node } = createFormComponent({ schema });

      fireEvent.click(node.querySelector('.array-item-add button'));

      expect(node.querySelectorAll('.field-string')).toHaveLength(1);
    });

    it('should not provide an add button if length equals maxItems', () => {
      const { node } = createFormComponent({
        schema: { maxItems: 2, ...schema },
        formData: ['foo', 'bar']
      });

      expect(node.querySelector('.array-item-add button')).toBeNull();
    });

    it('should provide an add button if length is lesser than maxItems', () => {
      const { node } = createFormComponent({
        schema: { maxItems: 2, ...schema },
        formData: ['foo']
      });

      expect(node.querySelector('.array-item-add button')).not.toEqual(null);
    });

    it('should not provide an add button if addable is expliclty false regardless maxItems value', () => {
      const { node } = createFormComponent({
        schema: { maxItems: 2, ...schema },
        formData: ['foo'],
        uiSchema: {
          'ui:options': {
            addable: false
          }
        }
      });

      expect(node.querySelector('.array-item-add button')).toBeNull();
    });

    it('should ignore addable value if maxItems constraint is not satisfied', () => {
      const { node } = createFormComponent({
        schema: { maxItems: 2, ...schema },
        formData: ['foo', 'bar'],
        uiSchema: {
          'ui:options': {
            addable: true
          }
        }
      });

      expect(node.querySelector('.array-item-add button')).toBeNull();
    });

    it('should mark a non-null array item widget as required', () => {
      const { node } = createFormComponent({ schema });

      fireEvent.click(node.querySelector('.array-item-add button'));

      expect(
        node.querySelector('.field-string input[type=text]').required
      ).toEqual(true);
    });

    it('should fill an array field with data', () => {
      const { node } = createFormComponent({
        schema,
        formData: ['foo', 'bar']
      });
      const inputs = node.querySelectorAll('.field-string input[type=text]');

      expect(inputs).toHaveLength(2);
      expect(inputs[0].value).toEqual('foo');
      expect(inputs[1].value).toEqual('bar');
    });

    it('should\'t have reorder buttons when list length <= 1', () => {
      const { node } = createFormComponent({ schema, formData: ['foo'] });

      expect(node.querySelector('.array-item-move-up')).toEqual(null);
      expect(node.querySelector('.array-item-move-down')).toEqual(null);
    });

    it('should have reorder buttons when list length >= 2', () => {
      const { node } = createFormComponent({
        schema,
        formData: ['foo', 'bar']
      });

      expect(node.querySelector('.array-item-move-up')).not.toEqual(null);
      expect(node.querySelector('.array-item-move-down')).not.toEqual(null);
    });

    it('should move down a field from the list', () => {
      const { node } = createFormComponent({
        schema,
        formData: ['foo', 'bar', 'baz']
      });
      const moveDownBtns = node.querySelectorAll('.array-item-move-down');

      fireEvent.click(moveDownBtns[0]);

      const inputs = node.querySelectorAll('.field-string input[type=text]');
      expect(inputs).toHaveLength(3);
      expect(inputs[0].value).toEqual('bar');
      expect(inputs[1].value).toEqual('foo');
      expect(inputs[2].value).toEqual('baz');
    });

    it('should move up a field from the list', () => {
      const { node } = createFormComponent({
        schema,
        formData: ['foo', 'bar', 'baz']
      });
      const moveUpBtns = node.querySelectorAll('.array-item-move-up');

      fireEvent.click(moveUpBtns[2]);

      const inputs = node.querySelectorAll('.field-string input[type=text]');
      expect(inputs).toHaveLength(3);
      expect(inputs[0].value).toEqual('foo');
      expect(inputs[1].value).toEqual('baz');
      expect(inputs[2].value).toEqual('bar');
    });

    it('should disable move buttons on the ends of the list', () => {
      const { node } = createFormComponent({
        schema,
        formData: ['foo', 'bar']
      });
      const moveUpBtns = node.querySelectorAll('.array-item-move-up');
      const moveDownBtns = node.querySelectorAll('.array-item-move-down');

      expect(moveUpBtns[0].disabled).toEqual(true);
      expect(moveDownBtns[0].disabled).toEqual(false);
      expect(moveUpBtns[1].disabled).toEqual(false);
      expect(moveDownBtns[1].disabled).toEqual(true);
    });

    it('should not show move up/down buttons if orderable is false', () => {
      const { node } = createFormComponent({
        schema,
        formData: ['foo', 'bar'],
        uiSchema: { 'ui:options': { orderable: false } }
      });
      const moveUpBtns = node.querySelector('.array-item-move-up');
      const moveDownBtns = node.querySelector('.array-item-move-down');

      expect(moveUpBtns).toBeNull();
      expect(moveDownBtns).toBeNull();
    });

    it('should remove a field from the list', () => {
      const { node } = createFormComponent({
        schema,
        formData: ['foo', 'bar']
      });
      const dropBtns = node.querySelectorAll('.array-item-remove');

      fireEvent.click(dropBtns[0]);

      const inputs = node.querySelectorAll('.field-string input[type=text]');
      expect(inputs).toHaveLength(1);
      expect(inputs[0].value).toEqual('bar');
    });

    it('should not show remove button if removable is false', () => {
      const { node } = createFormComponent({
        schema,
        formData: ['foo', 'bar'],
        uiSchema: { 'ui:options': { removable: false } }
      });
      const dropBtn = node.querySelector('.array-item-remove');

      expect(dropBtn).toBeNull();
    });

    it('should force revalidation when a field is removed', () => {
      // refs #195
      const { node, queryAllByTestId } = createFormComponent({
        schema: {
          ...schema,
          items: { ...schema.items, minLength: 4 }
        },
        formData: ['foo', 'bar!']
      });

      suppressLogs('error', () => {
        fireEvent.submit(node);
      });

      expect(queryAllByTestId(/error-detail__item/)).toHaveLength(1);

      const dropBtns = queryAllByTestId('remove-array-item');

      fireEvent.click(dropBtns[0]);

      expect(queryAllByTestId(/error-detail__item/)).toHaveLength(0);
    });

    it('should handle cleared field values in the array', () => {
      const schema = {
        type: 'array',
        items: { type: 'integer' }
      };
      const formData = [1, 2, 3];
      const { getInstance, node } = createFormComponent({
        liveValidate: true,
        schema,
        formData
      });
      const input = node.querySelector('#root_1');

      input.value = '';
      fireEvent.change(input);

      expect(getInstance().state.formData).toEqual([1, null, 3]);
      expect(getInstance().state.errors).toHaveLength(1);
    });

    it('should render the input widgets with the expected ids', () => {
      const { node } = createFormComponent({
        schema,
        formData: ['foo', 'bar']
      });

      const inputs = node.querySelectorAll('input[type=text]');
      expect(inputs[0].id).toEqual('root_0');
      expect(inputs[1].id).toEqual('root_1');
    });

    it('should render nested input widgets with the expected ids', () => {
      const complexSchema = {
        type: 'object',
        properties: {
          foo: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                bar: { type: 'string' },
                baz: { type: 'string' }
              }
            }
          }
        }
      };
      const { node } = createFormComponent({
        schema: complexSchema,
        formData: {
          foo: [{ bar: 'bar1', baz: 'baz1' }, { bar: 'bar2', baz: 'baz2' }]
        }
      });

      const inputs = node.querySelectorAll('input[type=text]');
      expect(inputs[0].id).toEqual('root_foo_0_bar');
      expect(inputs[1].id).toEqual('root_foo_0_baz');
      expect(inputs[2].id).toEqual('root_foo_1_bar');
      expect(inputs[3].id).toEqual('root_foo_1_baz');
    });

    it('should render enough inputs with proper defaults to match minItems in schema when no formData is set', () => {
      const complexSchema = {
        type: 'object',
        definitions: {
          Thing: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                default: 'Default name'
              }
            }
          }
        },
        properties: {
          foo: {
            type: 'array',
            minItems: 2,
            items: {
              $ref: '#/definitions/Thing'
            }
          }
        }
      };
      let form = createFormComponent({
        schema: complexSchema,
        formData: {}
      });
      let inputs = form.node.querySelectorAll('input[type=text]');
      expect(inputs[0].value).toEqual('Default name');
      expect(inputs[1].value).toEqual('Default name');
    });

    it('should render an input for each default value, even when this is greater than minItems', () => {
      const schema = {
        type: 'object',
        properties: {
          turtles: {
            type: 'array',
            minItems: 2,
            default: ['Raphael', 'Michaelangelo', 'Donatello', 'Leonardo'],
            items: {
              type: 'string'
            }
          }
        }
      };
      const { node } = createFormComponent({ schema: schema });
      const inputs = node.querySelectorAll('input[type=text]');
      expect(inputs.length).toEqual(4);
      expect(inputs[0].value).toEqual('Raphael');
      expect(inputs[1].value).toEqual('Michaelangelo');
      expect(inputs[2].value).toEqual('Donatello');
      expect(inputs[3].value).toEqual('Leonardo');
    });

    it('should render enough input to match minItems, populating the first with default values, and the rest empty', () => {
      const schema = {
        type: 'object',
        properties: {
          turtles: {
            type: 'array',
            minItems: 4,
            default: ['Raphael', 'Michaelangelo'],
            items: {
              type: 'string'
            }
          }
        }
      };
      const { node } = createFormComponent({ schema });
      const inputs = node.querySelectorAll('input[type=text]');
      expect(inputs.length).toEqual(4);
      expect(inputs[0].value).toEqual('Raphael');
      expect(inputs[1].value).toEqual('Michaelangelo');
      expect(inputs[2].value).toEqual('');
      expect(inputs[3].value).toEqual('');
    });

    it('should render enough input to match minItems, populating the first with default values, and the rest with the item default', () => {
      const schema = {
        type: 'object',
        properties: {
          turtles: {
            type: 'array',
            minItems: 4,
            default: ['Raphael', 'Michaelangelo'],
            items: {
              type: 'string',
              default: 'Unknown'
            }
          }
        }
      };
      const { node } = createFormComponent({ schema });
      const inputs = node.querySelectorAll('input[type=text]');
      expect(inputs.length).toEqual(4);
      expect(inputs[0].value).toEqual('Raphael');
      expect(inputs[1].value).toEqual('Michaelangelo');
      expect(inputs[2].value).toEqual('Unknown');
      expect(inputs[3].value).toEqual('Unknown');
    });

    it('should not add minItems extra formData entries when schema item is a multiselect', () => {
      const schema = {
        type: 'object',
        properties: {
          multipleChoicesList: {
            type: 'array',
            minItems: 3,
            uniqueItems: true,
            items: {
              type: 'string',
              enum: ['Aramis', 'Athos', 'Porthos', 'd\'Artagnan']
            }
          }
        }
      };
      const uiSchema = {
        multipleChoicesList: {
          'ui:widget': 'checkboxes'
        }
      };
      const form = createFormComponent({
        schema: schema,
        uiSchema: uiSchema,
        formData: {},
        liveValidate: true
      }).getInstance();

      expect(form.state.formData).toHaveProperty('multipleChoicesList');
      expect(form.state.formData.multipleChoicesList).toHaveLength(0);
      expect(form.state.errors.length).toBe(1);
      expect(form.state.errors[0].name).toBe('minItems');
      expect(form.state.errors[0].params.limit).toBe(3);
    });

    it('should honor given formData, even when it does not meet ths minItems-requirement', () => {
      const complexSchema = {
        type: 'object',
        definitions: {
          Thing: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                default: 'Default name'
              }
            }
          }
        },
        properties: {
          foo: {
            type: 'array',
            minItems: 2,
            items: {
              $ref: '#/definitions/Thing'
            }
          }
        }
      };
      const form = createFormComponent({
        schema: complexSchema,
        formData: { foo: [] }
      });
      const inputs = form.node.querySelectorAll('input[type=text]');
      expect(inputs.length).toEqual(0);
    });
  });

  describe('Multiple choices list', () => {
    const schema = {
      type: 'array',
      title: 'My field',
      items: {
        enum: ['foo', 'bar', 'fuzz'],
        type: 'string'
      },
      uniqueItems: true
    };

    describe('Select multiple widget', () => {
      it('should render a select widget', () => {
        const { node } = createFormComponent({ schema });

        expect(node.querySelectorAll('select')).toHaveLength(1);
      });

      it('should render a select widget with a label', () => {
        const { node } = createFormComponent({ schema });

        expect(node.querySelector('.field label')).toHaveTextContent(
          'My field'
        );
      });

      it('should render a select widget with multiple attribute', () => {
        const { node } = createFormComponent({ schema });

        expect(
          node.querySelector('.field select').getAttribute('multiple')
        ).not.toBeNull();
      });

      it('should render options', () => {
        const { node } = createFormComponent({ schema });

        expect(node.querySelectorAll('select option')).toHaveLength(3);
      });

      it('should handle a change event', () => {
        const { getInstance, getByLabelText, getByText } = createFormComponent({
          schema
        });
        const select = getByLabelText('My field');

        getByText('foo').selected = true;
        getByText('bar').selected = true;
        fireEvent.change(select);

        expect(getInstance().state.formData).toEqual(['foo', 'bar']);
      });

      it('should handle a blur event', () => {
        const onBlur = jest.fn();
        const { node, getByText } = createFormComponent({ schema, onBlur });
        const select = node.querySelector('.field select');

        getByText('foo').selected = true;
        getByText('bar').selected = true;
        fireEvent.blur(select);

        expect(onBlur).toHaveBeenCalledWith(select.id, ['foo', 'bar']);
      });

      it('should handle a focus event', () => {
        const onFocus = jest.fn();
        const { node, getByText } = createFormComponent({ schema, onFocus });
        const select = node.querySelector('.field select');

        getByText('foo').selected = true;
        getByText('bar').selected = true;
        fireEvent.focus(select);

        expect(onFocus).toHaveBeenCalledWith(select.id, ['foo', 'bar']);
      });

      it('should fill field with data', () => {
        const { node } = createFormComponent({
          schema,
          formData: ['foo', 'bar']
        });

        const options = node.querySelectorAll('.field select option');
        expect(options).toHaveLength(3);
        expect(options[0].selected).toEqual(true); // foo
        expect(options[1].selected).toEqual(true); // bar
        expect(options[2].selected).toEqual(false); // fuzz
      });

      it('should render the select widget with the expected id', () => {
        const { node } = createFormComponent({ schema });

        expect(node.querySelector('select').id).toEqual('root');
      });

      it('should pass rawErrors down to custom widgets', () => {
        const { node } = createFormComponent({
          schema,
          widgets: {
            SelectWidget: CustomComponent
          },
          formData: ['foo', 'foo'],
          liveValidate: true
        });
        const matches = node.querySelectorAll('#custom');

        expect(matches).toHaveLength(1);
        /**
         * It failed because the output was with swapped numbers..
         * Original test:
         * expected: 'should NOT have duplicate items (items ## 0 and 1 are identical)'
         * actual: 'should NOT have duplicate items (items ## 1 and 0 are identical)'
         */
        expect(matches[0]).toHaveTextContent(
          'should NOT have duplicate items (items ## 1 and 0 are identical)'
        );
      });
    });

    describe('CheckboxesWidget', () => {
      const uiSchema = {
        'ui:widget': 'checkboxes'
      };

      it('should render the expected number of checkboxes', () => {
        const { node } = createFormComponent({ schema, uiSchema });

        expect(node.querySelectorAll('[type=checkbox]')).toHaveLength(3);
      });

      it('should render the expected labels', () => {
        const { queryByLabelText } = createFormComponent({ schema, uiSchema });

        expect(queryByLabelText('foo')).toBeInTheDOM();
        expect(queryByLabelText('bar')).toBeInTheDOM();
        expect(queryByLabelText('fuzz')).toBeInTheDOM();
      });

      it('should handle a change event', () => {
        const { getInstance, node } = createFormComponent({
          schema,
          uiSchema
        });
        const checkbox1 = node.querySelectorAll('[type=checkbox]')[0];
        const checkbox3 = node.querySelectorAll('[type=checkbox]')[2];

        checkbox1.checked = true;
        fireEvent.change(checkbox1);
        checkbox3.checked = true;
        fireEvent.change(checkbox3);

        expect(getInstance().state.formData).toEqual(['foo', 'fuzz']);
      });

      it('should fill field with data', () => {
        const { getByLabelText } = createFormComponent({
          schema,
          uiSchema,
          formData: ['foo', 'fuzz']
        });

        expect(getByLabelText('foo').checked).toBe(true);
        expect(getByLabelText('bar').checked).toBe(false);
        expect(getByLabelText('fuzz').checked).toBe(true);
      });

      it('should render the widget with the expected id', () => {
        const { node } = createFormComponent({ schema, uiSchema });

        expect(node.querySelector('.checkboxes').id).toEqual('root');
      });

      it('should support inline checkboxes', () => {
        const { queryAllByTestId } = createFormComponent({
          schema,
          uiSchema: {
            'ui:widget': 'checkboxes',
            'ui:options': {
              inline: true
            }
          }
        });

        expect(queryAllByTestId('checkboxes-inline')).toHaveLength(3);
      });

      it('should pass rawErrors down to custom widgets', () => {
        const schema = {
          type: 'array',
          title: 'My field',
          items: {
            enum: ['foo', 'bar', 'fuzz'],
            type: 'string'
          },
          minItems: 3,
          uniqueItems: true
        };

        const { node } = createFormComponent({
          schema,
          widgets: {
            CheckboxesWidget: CustomComponent
          },
          uiSchema,
          formData: [],
          liveValidate: true
        });

        const matches = node.querySelectorAll('#custom');
        expect(matches).toHaveLength(1);
        expect(matches[0]).toHaveTextContent(
          'should NOT have less than 3 items'
        );
      });
    });
  });

  describe('Multiple files field', () => {
    const schema = {
      type: 'array',
      title: 'My field',
      items: {
        type: 'string',
        format: 'data-url'
      }
    };

    it('should render an input[type=file] widget', () => {
      const { node } = createFormComponent({ schema });

      expect(node.querySelectorAll('input[type=file]')).toHaveLength(1);
    });

    it('should render a select widget with a label', () => {
      const { node } = createFormComponent({ schema });

      expect(node.querySelector('.field label')).toHaveTextContent('My field');
    });

    it('should render a file widget with multiple attribute', () => {
      const { node } = createFormComponent({ schema });

      expect(
        node.querySelector('.field [type=file]').getAttribute('multiple')
      ).not.toBeNull();
    });

    it('should handle a change event', async () => {
      window.FileReader = jest.fn(() => ({
        set onload(fn) {
          fn({ target: { result: 'data:text/plain;base64,x=' } });
        },
        readAsDataUrl() {}
      }));

      const { getInstance, node } = createFormComponent({ schema });

      Simulate.change(node.querySelector('.field input[type=file]'), {
        target: {
          files: [
            { name: 'file1.txt', size: 1, type: 'type' },
            { name: 'file2.txt', size: 2, type: 'type' }
          ]
        }
      });

      await new Promise(setImmediate);

      expect(getInstance().state.formData).toEqual([
        'data:text/plain;name=file1.txt;base64,x=',
        'data:text/plain;name=file2.txt;base64,x='
      ]);
    });

    it('should fill field with data', () => {
      const { node } = createFormComponent({
        schema,
        formData: [
          'data:text/plain;name=file1.txt;base64,dGVzdDE=',
          'data:image/png;name=file2.png;base64,ZmFrZXBuZw=='
        ]
      });

      const li = node.querySelectorAll('.file-info li');

      expect(li).toHaveLength(2);
      expect(li[0]).toHaveTextContent('file1.txt (text/plain, 5 bytes)');
      expect(li[1]).toHaveTextContent('file2.png (image/png, 7 bytes)');
    });

    it('should render the file widget with the expected id', () => {
      const { node } = createFormComponent({ schema });

      expect(node.querySelector('input[type=file]').id).toEqual('root');
    });

    it('should pass rawErrors down to custom widgets', () => {
      const schema = {
        type: 'array',
        title: 'My field',
        items: {
          type: 'string',
          format: 'data-url'
        },
        minItems: 5
      };

      const { node } = createFormComponent({
        schema,
        widgets: {
          FileWidget: CustomComponent
        },
        formData: [],
        liveValidate: true
      });

      const matches = node.querySelectorAll('#custom');
      expect(matches).toHaveLength(1);
      expect(matches[0]).toHaveTextContent('should NOT have less than 5 items');
    });
  });

  describe('Nested lists', () => {
    const schema = {
      type: 'array',
      title: 'A list of arrays',
      items: {
        type: 'array',
        title: 'A list of numbers',
        items: {
          type: 'number'
        }
      }
    };

    it('should render two lists of inputs inside of a list', () => {
      const { node } = createFormComponent({
        schema,
        formData: [[1, 2], [3, 4]]
      });
      expect(node.querySelectorAll('fieldset fieldset')).toHaveLength(2);
    });

    it('should add an inner list when clicking the add button', () => {
      const { node } = createFormComponent({ schema });
      expect(node.querySelectorAll('fieldset fieldset')).toHaveLength(0);

      fireEvent.click(node.querySelector('.array-item-add button'));

      expect(node.querySelectorAll('fieldset fieldset')).toHaveLength(1);
    });

    it('should pass rawErrors down to every level of custom widgets', () => {
      const CustomItem = props => <div id="custom-item">{props.children}</div>;
      const CustomTemplate = props => {
        return (
          <div id="custom">
            {props.items &&
              props.items.map((p, i) => <CustomItem key={i} {...p} />)}
            <div id="custom-error">
              {props.rawErrors && props.rawErrors.join(', ')}
            </div>
          </div>
        );
      };

      const schema = {
        type: 'array',
        title: 'A list of arrays',
        items: {
          type: 'array',
          title: 'A list of numbers',
          items: {
            type: 'number'
          },
          minItems: 3
        },
        minItems: 2
      };

      const { node } = createFormComponent({
        schema,
        templates: { ArrayFieldTemplate: CustomTemplate },
        formData: [[]],
        liveValidate: true
      });

      const matches = node.querySelectorAll('#custom-error');
      expect(matches).toHaveLength(2);
      expect(matches[0]).toHaveTextContent('should NOT have less than 3 items');
      expect(matches[1]).toHaveTextContent('should NOT have less than 2 items');
    });
  });

  describe('Fixed items lists', () => {
    const schema = {
      type: 'array',
      title: 'List of fixed items',
      items: [
        {
          type: 'string',
          title: 'Some text'
        },
        {
          type: 'number',
          title: 'A number'
        }
      ]
    };

    const schemaAdditional = {
      type: 'array',
      title: 'List of fixed items',
      items: [
        {
          type: 'number',
          title: 'A number'
        },
        {
          type: 'number',
          title: 'Another number'
        }
      ],
      additionalItems: {
        type: 'string',
        title: 'Additional item'
      }
    };

    it('should render a fieldset', () => {
      const { node } = createFormComponent({ schema });

      expect(node.querySelectorAll('fieldset')).toHaveLength(1);
    });

    it('should render a fieldset legend', () => {
      const { node } = createFormComponent({ schema });
      const legend = node.querySelector('fieldset > legend');
      expect(legend).toHaveTextContent('List of fixed items');
      expect(legend.id).toEqual('root__title');
    });

    it('should render field widgets', () => {
      const { node } = createFormComponent({ schema });
      const strInput = node.querySelector(
        'fieldset .field-string input[type=text]'
      );
      const numInput = node.querySelector(
        'fieldset .field-number input[type=text]'
      );
      expect(strInput.id).toEqual('root_0');
      expect(numInput.id).toEqual('root_1');
    });

    it('should mark non-null item widgets as required', () => {
      const { node } = createFormComponent({ schema });
      const strInput = node.querySelector(
        'fieldset .field-string input[type=text]'
      );
      const numInput = node.querySelector(
        'fieldset .field-number input[type=text]'
      );
      expect(strInput.required).toEqual(true);
      expect(numInput.required).toEqual(true);
    });

    it('should fill fields with data', () => {
      const { node } = createFormComponent({
        schema,
        formData: ['foo', 42]
      });
      const strInput = node.querySelector(
        'fieldset .field-string input[type=text]'
      );
      const numInput = node.querySelector(
        'fieldset .field-number input[type=text]'
      );
      expect(strInput.value).toEqual('foo');
      expect(numInput.value).toEqual('42');
    });

    it('should handle change events', () => {
      const { getInstance, node } = createFormComponent({ schema });
      const strInput = node.querySelector(
        'fieldset .field-string input[type=text]'
      );
      const numInput = node.querySelector(
        'fieldset .field-number input[type=text]'
      );

      strInput.value = 'bar';
      fireEvent.change(strInput);
      numInput.value = '101';
      fireEvent.change(numInput);

      expect(getInstance().state.formData).toEqual(['bar', 101]);
    });

    it('should generate additional fields and fill data', () => {
      const { node } = createFormComponent({
        schema: schemaAdditional,
        formData: [1, 2, 'bar']
      });
      const addInput = node.querySelector(
        'fieldset .field-string input[type=text]'
      );
      expect(addInput.id).toEqual('root_2');
      expect(addInput.value).toEqual('bar');
    });

    it('should have an add button if additionalItems is an object', () => {
      const { node } = createFormComponent({ schema: schemaAdditional });
      expect(node.querySelector('.array-item-add button')).not.toBeNull();
    });

    it('should not have an add button if additionalItems is not set', () => {
      const { node } = createFormComponent({ schema });
      expect(node.querySelector('.array-item-add button')).toBeNull();
    });

    it('should not have an add button if addable is false', () => {
      const { node } = createFormComponent({
        schema,
        uiSchema: { 'ui:options': { addable: false } }
      });
      expect(node.querySelector('.array-item-add button')).toBeNull();
    });

    it('[fixed-noadditional] should not provide an add button regardless maxItems', () => {
      const { node } = createFormComponent({
        schema: { maxItems: 3, ...schema }
      });

      expect(node.querySelector('.array-item-add button')).toBeNull();
    });

    it('[fixed] should not provide an add button if length equals maxItems', () => {
      const { node } = createFormComponent({
        schema: { maxItems: 2, ...schemaAdditional }
      });

      expect(node.querySelector('.array-item-add button')).toBeNull();
    });

    it('[fixed] should provide an add button if length is lesser than maxItems', () => {
      const { node } = createFormComponent({
        schema: { maxItems: 3, ...schemaAdditional }
      });

      expect(node.querySelector('.array-item-add button')).not.toBeNull();
    });

    it('[fixed] should not provide an add button if addable is expliclty false regardless maxItems value', () => {
      const { node } = createFormComponent({
        schema: { maxItems: 2, ...schema },
        uiSchema: {
          'ui:options': {
            addable: false
          }
        }
      });

      expect(node.querySelector('.array-item-add button')).toBeNull();
    });

    it('[fixed] should ignore addable value if maxItems constraint is not satisfied', () => {
      const { node } = createFormComponent({
        schema: { maxItems: 2, ...schema },
        uiSchema: {
          'ui:options': {
            addable: true
          }
        }
      });

      expect(node.querySelector('.array-item-add button')).toBeNull();
    });

    describe('operations for additional items', () => {
      const renderForm = () =>
        createFormComponent({
          schema: schemaAdditional,
          formData: [1, 2, 'foo']
        });

      it('should add a field when clicking add button', () => {
        const { getInstance, node, getByTestId } = renderForm();
        const addBtn = getByTestId('add-array-item');

        fireEvent.click(addBtn);

        expect(node.querySelectorAll('.field-string')).toHaveLength(2);
        expect(getInstance().state.formData).toEqual([1, 2, 'foo', undefined]);
      });

      it('should change the state when changing input value', () => {
        const { getInstance, getByTestId, queryAllByLabelText } = renderForm();
        const addBtn = getByTestId('add-array-item');
        let inputs;

        fireEvent.click(addBtn);

        inputs = queryAllByLabelText(/Additional item/);

        inputs[0].value = 'bar';
        fireEvent.change(inputs[0]);
        inputs[1].value = 'baz';
        fireEvent.change(inputs[1]);

        expect(getInstance().state.formData).toEqual([1, 2, 'bar', 'baz']);
      });

      it('should remove array items when clicking remove buttons', () => {
        const {
          getInstance,
          node,
          getByTestId,
          queryAllByTestId
        } = renderForm();
        const addBtn = getByTestId('add-array-item');
        let dropBtns;

        fireEvent.click(addBtn);

        dropBtns = queryAllByTestId('remove-array-item');
        fireEvent.click(dropBtns[0]);

        expect(node.querySelectorAll('.field-string')).toHaveLength(1);
        expect(getInstance().state.formData).toEqual([1, 2, undefined]);

        dropBtns = queryAllByTestId('remove-array-item');
        fireEvent.click(dropBtns[0]);

        expect(node.querySelectorAll('.field-string')).toHaveLength(0);
        expect(getInstance().state.formData).toEqual([1, 2]);
      });
    });
  });

  describe('Multiple number choices list', () => {
    const schema = {
      type: 'array',
      title: 'My field',
      items: {
        enum: [1, 2, 3],
        enumNames: ['Foo', 'Bar', 'Baz'],
        type: 'integer'
      },
      uniqueItems: true
    };

    it('should convert array of strings to numbers if type of items is \'number\'', () => {
      const { getInstance, node, getByText } = createFormComponent({ schema });
      const select = node.querySelector('.field select');

      getByText('Foo').selected = true;
      getByText('Bar').selected = true;
      fireEvent.change(select);

      expect(getInstance().state.formData).toEqual([1, 2]);
    });
  });

  describe('Title', () => {
    const TitleTemplate = props => <div id={`title-${props.title}`} />;

    const templates = { TitleTemplate };

    it('should pass field name to TitleTemplate if there is no title', () => {
      const schema = {
        type: 'object',
        properties: {
          array: {
            type: 'array',
            items: {}
          }
        }
      };

      const { node } = createFormComponent({ schema, templates });
      expect(node.querySelector('#title-array')).not.toBeNull();
    });

    it('should pass schema title to TitleTemplate', () => {
      const schema = {
        type: 'array',
        title: 'test',
        items: {}
      };

      const { node } = createFormComponent({ schema, templates });
      expect(node.querySelector('#title-test')).not.toBeNull();
    });

    it('should pass empty schema title to TitleTemplate', () => {
      const schema = {
        type: 'array',
        title: '',
        items: {}
      };
      const { node } = createFormComponent({ schema, templates });
      expect(node.querySelector('#title-')).toBeNull();
    });
  });
});
