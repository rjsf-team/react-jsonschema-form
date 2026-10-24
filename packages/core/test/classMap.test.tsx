import type { RJSFSchema } from '@rjsf/utils';
import { createSchemaUtils } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

import { buildRegistry } from '../src/index.ts';
import { createFormComponent } from './testUtils.tsx';

describe('classMap', () => {
  it('lands a Form classMap entry in registry.classMap, an empty one as undefined', () => {
    const schema: RJSFSchema = { type: 'string' };
    const registry = buildRegistry(
      { schema, validator, classMap: { input: 'theme-input', textarea: '' } },
      schema,
      createSchemaUtils({ validator }, schema),
    );

    expect(registry.classMap).toEqual(expect.objectContaining({ input: 'theme-input', textarea: undefined }));
  });

  it('renders a mapped class in place of the default and keeps the marker and state classes beside it', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        list: { type: 'array', items: { type: 'string' } },
        flag: { type: 'boolean', description: 'a flag' },
        file: { type: 'string', format: 'data-url' },
        level: { type: 'number' },
        volume: { type: 'number' },
        choice: { type: 'string', enum: ['a', 'b'] },
      },
    };
    const { node } = createFormComponent({
      schema,
      uiSchema: {
        flag: { 'ui:disabled': true },
        level: { 'ui:widget': 'range' },
        volume: { 'ui:options': { inputType: 'range' } },
        choice: { 'ui:widget': 'radio' },
      },
      initialFormData: { list: ['a'] },
      classMap: {
        input: 'theme-input',
        fileInput: 'theme-file',
        rangeInput: 'theme-range',
        rangeWrapper: 'theme-range-wrapper',
        arrayFieldset: 'theme-array',
        arrayItemList: 'theme-list',
        arrayItem: 'theme-item',
        arrayItemToolbox: 'theme-toolbox',
        objectFieldset: 'theme-object',
        checkboxLabel: 'theme-checkbox-label',
        checkboxInput: 'theme-checkbox',
        radioLabel: 'theme-radio-label',
        radioInput: 'theme-radio',
        fieldDescription: 'theme-description',
        disabled: 'theme-disabled',
      },
    });

    expect(node.querySelector('input[type="text"]')).toHaveClass('theme-input');
    expect(node.querySelector('input[type="file"]')).toHaveClass('theme-file');
    const [range, rangeByInputType] = node.querySelectorAll('input[type="range"]');
    expect(range).toHaveClass('theme-range');
    expect(rangeByInputType).toHaveClass('theme-range');
    expect(range?.closest('.rjsf-field-range-wrapper')).toHaveClass('theme-range-wrapper');
    expect(node.querySelector('fieldset.rjsf-field-array')).toHaveClass('theme-array');
    expect(node.querySelector('.rjsf-array-item-list')).toHaveClass('theme-list');
    expect(node.querySelector('.rjsf-array-item')).toHaveClass('theme-item');
    expect(node.querySelector('.rjsf-array-item-toolbox')).toHaveClass('theme-toolbox');
    expect(node.querySelector('fieldset#root')).toHaveClass('theme-object');
    const checkbox = node.querySelector('input[type="checkbox"]');
    expect(checkbox).toHaveClass('theme-checkbox');
    expect(checkbox?.closest('label')).toHaveClass('theme-checkbox-label');
    expect(checkbox?.closest('div')).toHaveClass('rjsf-checkbox', 'theme-disabled');
    const radio = node.querySelector('input[type="radio"]');
    expect(radio).toHaveClass('theme-radio');
    expect(radio?.closest('label')).toHaveClass('theme-radio-label');
    expect(node.querySelector('.rjsf-field-description')).toHaveClass('theme-description');
  });

  it('adds the error keys to the label, description and help of a field showing errors only', () => {
    const { node } = createFormComponent({
      schema: {
        type: 'object',
        properties: {
          bad: { type: 'string', title: 'Bad', description: 'bad description' },
          good: { type: 'string', title: 'Good', description: 'good description' },
        },
      },
      uiSchema: { bad: { 'ui:help': 'bad help' }, good: { 'ui:help': 'good help' } },
      extraErrors: { bad: { __errors: ['wrong'] } },
      classMap: {
        labelError: 'theme-label-error',
        descriptionError: 'theme-description-error',
        helpError: 'theme-help-error',
      },
    });

    expect(node.querySelector('label[for="root_bad"]')).toHaveClass('theme-label-error');
    expect(node.querySelector('#root_bad__description')).toHaveClass('theme-description-error');
    expect(node.querySelector('#root_bad__help')).toHaveClass('theme-help-error');
    expect(node.querySelector('label[for="root_good"]')).not.toHaveClass('theme-label-error');
    expect(node.querySelector('#root_good__description')).not.toHaveClass('theme-description-error');
    expect(node.querySelector('#root_good__help')).not.toHaveClass('theme-help-error');
  });

  // An option's label follows its own errors and `ui:hideError`, as its wrapper's class and its help do, whatever the
  // field above does
  it.each([
    ['shows', true, false],
    ['hides', false, true],
  ])("adds labelError to an anyOf option's label by whether the option %s the errors", (_, aboveHides, optionHides) => {
    const { node } = createFormComponent({
      schema: { anyOf: [{ type: 'string', title: 'Text' }, { type: 'number' }] },
      uiSchema: { 'ui:hideError': aboveHides, anyOf: [{ 'ui:hideError': optionHides }, {}] },
      extraErrors: { __errors: ['wrong'] },
      classMap: { labelError: 'theme-label-error' },
    });

    const label = node.querySelector('label[for="root"]');
    expect(label).toHaveTextContent('Text');
    expect(label?.classList.contains('theme-label-error')).toBe(!optionHides);
  });
});
