import { PureComponent } from 'react';
import { ArrayFieldTemplateProps, ArrayFieldItemTemplateProps, RJSFSchema, getUiOptions } from '@rjsf/utils';
import { fireEvent } from '@testing-library/react';

import { createFormComponent } from './testUtils';

const formData = ['one', 'two', 'three'];

describe('ArrayFieldTemplate', () => {
  describe('Custom ArrayFieldTemplate of string array', () => {
    function ArrayFieldTemplate(props: ArrayFieldTemplateProps) {
      const { classNames } = getUiOptions(props.uiSchema);
      return (
        <div className={classNames}>
          {props.canAdd && <button className='custom-array-add' />}
          {props.items}
        </div>
      );
    }
    function ArrayFieldItemTemplate(props: ArrayFieldItemTemplateProps) {
      return (
        <div className='custom-array-item'>
          {props.buttonsProps.hasMoveUp && <button className='custom-array-item-move-up' />}
          {props.buttonsProps.hasMoveDown && <button className='custom-array-item-move-down' />}

          {props.children}
        </div>
      );
    }

    describe('Stateful ArrayFieldTemplate', () => {
      class ArrayFieldTemplate extends PureComponent<ArrayFieldTemplateProps> {
        render() {
          return <div className='field-content'>{this.props.items}</div>;
        }
      }

      class ArrayFieldItemTemplate extends PureComponent<ArrayFieldItemTemplateProps> {
        render() {
          return <div>this.props.children</div>;
        }
      }

      describe('with template globally configured', () => {
        it('should render a stateful custom component', () => {
          const { node } = createFormComponent({
            schema: { type: 'array', items: { type: 'string' } },
            formData,
            templates: { ArrayFieldTemplate, ArrayFieldItemTemplate },
          });

          expect(node.querySelectorAll('.rjsf-field-array .field-content div')).toHaveLength(3);
        });
      });
      describe('with template configured in ui:ArrayFieldTemplate', () => {
        it('should render a stateful custom component', () => {
          const { node } = createFormComponent({
            schema: { type: 'array', items: { type: 'string' } },
            formData,
            uiSchema: {
              'ui:ArrayFieldTemplate': ArrayFieldTemplate,
              'ui:ArrayFieldItemTemplate': ArrayFieldItemTemplate,
            },
          });

          expect(node.querySelectorAll('.rjsf-field-array .field-content div')).toHaveLength(3);
        });
      });
      describe('with template configured globally being overriden in ui:ArrayFieldTemplate', () => {
        it('should render a stateful custom component', () => {
          const { node } = createFormComponent({
            schema: { type: 'array', items: { type: 'string' } },
            formData,
            uiSchema: {
              'ui:ArrayFieldTemplate': ArrayFieldTemplate,
              'ui:ArrayFieldItemTemplate': ArrayFieldItemTemplate,
            },
            // Empty field template for proof that we're doing overrides
            templates: { ArrayFieldTemplate: () => <div /> },
          });

          expect(node.querySelectorAll('.rjsf-field-array .field-content div')).toHaveLength(3);
        });
      });
    });

    describe('not fixed items', () => {
      const schema: RJSFSchema = {
        type: 'array',
        title: 'my list',
        description: 'my description',
        items: { type: 'string' },
      };

      let node: Element;

      describe('with template globally configured', () => {
        const uiSchema = {
          'ui:classNames': 'custom-array',
        };

        beforeEach(() => {
          node = createFormComponent({
            templates: { ArrayFieldTemplate, ArrayFieldItemTemplate },
            formData,
            schema,
            uiSchema,
          }).node;
        });

        sharedIts();
      });
      describe('with template configured in ui:ArrayFieldTemplate', () => {
        const uiSchema = {
          'ui:classNames': 'custom-array',
          'ui:ArrayFieldTemplate': ArrayFieldTemplate,
          'ui:ArrayFieldItemTemplate': ArrayFieldItemTemplate,
        };

        beforeEach(() => {
          node = createFormComponent({
            formData,
            schema,
            uiSchema,
          }).node;
        });
        sharedIts();
      });
      describe('with template configured globally being overridden in ui:ArrayFieldTemplate', () => {
        const uiSchema = {
          'ui:classNames': 'custom-array',
          'ui:ArrayFieldTemplate': ArrayFieldTemplate,
          'ui:ArrayFieldItemTemplate': ArrayFieldItemTemplate,
        };

        beforeEach(() => {
          node = createFormComponent({
            formData,
            schema,
            uiSchema,
            // Empty field template for proof that we're doing overrides
            templates: { ArrayFieldTemplate: () => <div /> },
          }).node;
        });
        sharedIts();
      });
      function sharedIts() {
        it('should render one root element for the array', () => {
          expect(node.querySelectorAll('.custom-array')).toHaveLength(1);
        });

        it('should render one add button', () => {
          expect(node.querySelectorAll('.custom-array-add')).toHaveLength(1);
        });

        it('should render one child for each array item', () => {
          expect(node.querySelectorAll('.custom-array-item')).toHaveLength(formData.length);
        });

        it('should render text input for each array item', () => {
          expect(node.querySelectorAll('.custom-array-item .rjsf-field input[type=text]')).toHaveLength(
            formData.length,
          );
        });

        it('should render move up button for all but one array items', () => {
          expect(node.querySelectorAll('.custom-array-item-move-up')).toHaveLength(formData.length - 1);
        });

        it('should render move down button for all but one array items', () => {
          expect(node.querySelectorAll('.custom-array-item-move-down')).toHaveLength(formData.length - 1);
        });
      }
    });

    describe('fixed items', () => {
      const schema: RJSFSchema = {
        type: 'array',
        title: 'my list',
        description: 'my description',
        items: [{ type: 'string' }, { type: 'string' }, { type: 'string' }],
      };

      let node: Element;

      describe('with template globally configured', () => {
        const uiSchema = {
          'ui:classNames': 'custom-array',
        };
        beforeEach(() => {
          node = createFormComponent({
            formData,
            schema,
            uiSchema,
            templates: { ArrayFieldTemplate, ArrayFieldItemTemplate },
          }).node;
        });
        sharedIts();
      });

      describe('with template configured in ui:ArrayFieldTemplate', () => {
        const uiSchema = {
          'ui:classNames': 'custom-array',
          'ui:ArrayFieldTemplate': ArrayFieldTemplate,
          'ui:ArrayFieldItemTemplate': ArrayFieldItemTemplate,
        };
        beforeEach(() => {
          node = createFormComponent({
            formData,
            schema,
            uiSchema,
          }).node;
        });
        sharedIts();
      });
      describe('with template configured globally being overriden in ui:ArrayFieldTemplate', () => {
        const uiSchema = {
          'ui:classNames': 'custom-array',
          'ui:ArrayFieldTemplate': ArrayFieldTemplate,
          'ui:ArrayFieldItemTemplate': ArrayFieldItemTemplate,
        };
        beforeEach(() => {
          node = createFormComponent({
            formData,
            schema,
            uiSchema,
            // Empty field template for proof that we're doing overrides
            templates: { ArrayFieldTemplate: () => <div /> },
          }).node;
        });
        sharedIts();
      });
      function sharedIts() {
        it('should render one root element for the array', () => {
          expect(node.querySelectorAll('.custom-array')).toHaveLength(1);
        });

        it('should not render an add button', () => {
          expect(node.querySelectorAll('.custom-array-add')).toHaveLength(0);
        });

        it('should render one child for each array item', () => {
          expect(node.querySelectorAll('.custom-array-item')).toHaveLength(formData.length);
        });

        it('should render text input for each array item', () => {
          expect(node.querySelectorAll('.custom-array-item .rjsf-field input[type=text]')).toHaveLength(
            formData.length,
          );
        });

        it('should not render any move up buttons', () => {
          expect(node.querySelectorAll('.custom-array-item-move-up')).toHaveLength(0);
        });

        it('should not render any move down buttons', () => {
          expect(node.querySelectorAll('.custom-array-item-move-down')).toHaveLength(0);
        });
      }
    });
  });

  describe('Stateful ArrayFieldTemplate', () => {
    class ArrayFieldTemplate extends PureComponent<ArrayFieldTemplateProps> {
      render() {
        return <div className='field-content'>{this.props.items}</div>;
      }
    }

    class ArrayFieldItemTemplate extends PureComponent<ArrayFieldItemTemplateProps> {
      render() {
        return <div>this.props.children</div>;
      }
    }

    it('should render a stateful custom component', () => {
      const { node } = createFormComponent({
        schema: { type: 'array', items: { type: 'string' } },
        formData,
        templates: { ArrayFieldTemplate, ArrayFieldItemTemplate },
      });
      expect(node.querySelectorAll('.rjsf-field-array .field-content div')).toHaveLength(3);
    });
  });

  describe('pass right props to ArrayFieldTemplate', () => {
    it('should pass registry prop', () => {
      const ArrayFieldTemplate = ({ registry }: ArrayFieldTemplateProps) => {
        if (!registry) {
          throw 'Error';
        }
        return null;
      };
      createFormComponent({
        schema: { type: 'array', items: { type: 'string' } },
        formData,
        templates: { ArrayFieldTemplate },
      });
    });

    it('should pass formData so it is in sync with items', () => {
      const ArrayFieldTemplate = ({ formData, items, onAddClick }: ArrayFieldTemplateProps) => {
        if (formData.length !== items.length) {
          throw 'Error';
        }
        return (
          <div>
            {items.map((_, i) => (
              <span key={i} className='test-data'>
                {formData[i]}
              </span>
            ))}
            <button className='rjsf-array-item-add' onClick={onAddClick} />
          </div>
        );
      };
      const { node } = createFormComponent({
        schema: { type: 'array', items: { type: 'string' } },
        formData,
        templates: { ArrayFieldTemplate },
      });
      let data = node.querySelectorAll('.test-data');
      expect(data).toHaveLength(formData.length);
      const button = node.querySelector('.rjsf-array-item-add');
      expect(button).toBeInTheDocument();
      fireEvent.click(button!);
      data = node.querySelectorAll('.test-data');
      expect(data).toHaveLength(formData.length + 1);
    });
  });
});
