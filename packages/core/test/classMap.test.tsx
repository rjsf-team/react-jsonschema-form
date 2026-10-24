import type { RJSFSchema } from '@rjsf/utils';
import { createSchemaUtils } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';

import { buildRegistry, withTheme } from '../src/index.ts';
import { mergeClassMaps } from '../src/Theme.ts';
import { createFormComponent } from './testUtils.tsx';

describe('classMap', () => {
  it("layers the Form's classMap over core's, key by key, keeping core's under an entry left undefined and none under ''", () => {
    const schema: RJSFSchema = { type: 'string' };
    const registry = buildRegistry(
      { schema, validator, classMap: { input: 'theme-input', select: undefined, textarea: '' } },
      schema,
      createSchemaUtils({ validator }, schema),
    );

    expect(registry.classMap.input).toBe('theme-input');
    expect(registry.classMap.select).toBe('form-control');
    expect(registry.classMap.textarea).toBe('');
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
    expect(range?.closest('.field-range-wrapper')).toHaveClass('theme-range-wrapper');
    expect(node.querySelector('fieldset.rjsf-field-array')).toHaveClass('theme-array');
    expect(node.querySelector('.array-item-list')).toHaveClass('theme-list');
    expect(node.querySelector('.rjsf-array-item')).toHaveClass('theme-item');
    expect(node.querySelector('.array-item-toolbox')).toHaveClass('theme-toolbox');
    expect(node.querySelector('fieldset#root')).toHaveClass('theme-object');
    const checkbox = node.querySelector('input[type="checkbox"]');
    expect(checkbox).toHaveClass('theme-checkbox');
    expect(checkbox?.closest('label')).toHaveClass('theme-checkbox-label');
    expect(checkbox?.closest('div')).toHaveClass('checkbox', 'theme-disabled');
    const radio = node.querySelector('input[type="radio"]');
    expect(radio).toHaveClass('theme-radio');
    expect(radio?.closest('label')).toHaveClass('theme-radio-label');
    expect(node.querySelector('.field-description')).toHaveClass('theme-description');
  });

  it("calls a Form entry that is a function with the theme's class, composing one over another", () => {
    const schema: RJSFSchema = { type: 'string' };
    const registry = buildRegistry(
      {
        schema,
        validator,
        classMap: mergeClassMaps(
          { input: (base) => `${base} theme-input`, select: 'theme-select' },
          { input: (base) => `${base} form-input`, select: (base) => `${base} form-select` },
        ),
      },
      schema,
      createSchemaUtils({ validator }, schema),
    );

    expect(registry.classMap.input).toBe('form-control theme-input form-input');
    expect(registry.classMap.select).toBe('theme-select form-select');
  });

  it('extends the class a theme gives an element with a function on the Form', () => {
    const ThemedForm = withTheme({ classMap: { input: 'theme-input' } });
    render(
      <ThemedForm schema={{ type: 'string' }} validator={validator} classMap={{ input: (base) => `${base} wide` }} />,
    );

    expect(screen.getByRole('textbox')).toHaveClass('theme-input', 'wide');
    expect(screen.getByRole('textbox')).not.toHaveClass('form-control');
  });
});
