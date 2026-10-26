import type { FormClassMap, RJSFSchema } from '@rjsf/utils';
import { createSchemaUtils, joinClassNames, mergeClassMaps } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';

import { buildRegistry, withTheme } from '../src/index.ts';
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

  // From JavaScript or a map read as JSON, a `null` or a conditional's `false` keeps the class beneath it too
  it('keeps the class beneath an entry that is neither a class nor a function', () => {
    const merged = mergeClassMaps({ input: 'theme-input', select: 'theme-select' }, {
      input: null,
      select: false,
    } as unknown as FormClassMap);

    expect(merged).toEqual({ input: 'theme-input', select: 'theme-select' });
  });

  it("keeps only core's keys, so a function under any other key never reaches registry.classMap", () => {
    const schema: RJSFSchema = { type: 'string' };
    const classMap = { inptu: (base: string) => `${base} x` } as unknown as FormClassMap;
    const registry = buildRegistry({ schema, validator, classMap }, schema, createSchemaUtils({ validator }, schema));

    expect(registry.classMap).not.toHaveProperty('inptu');
    expect(Object.values(registry.classMap).some((value) => typeof value === 'function')).toBe(false);
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

  it("calls a Form entry that is a function with the theme's class, composing one over another", () => {
    const schema: RJSFSchema = { type: 'string' };
    const registry = buildRegistry(
      {
        schema,
        validator,
        classMap: mergeClassMaps(
          { input: (base) => joinClassNames(base, 'theme-input'), select: 'theme-select' },
          {
            input: (base) => joinClassNames(base, 'form-input'),
            select: (base) => joinClassNames(base, 'form-select'),
          },
        ),
      },
      schema,
      createSchemaUtils({ validator }, schema),
    );

    expect(registry.classMap.input).toBe('theme-input form-input');
    expect(registry.classMap.select).toBe('theme-select form-select');
  });

  it('extends the class a theme gives an element with a function on the Form', () => {
    const ThemedForm = withTheme({ classMap: { input: 'theme-input' } });
    render(
      <ThemedForm schema={{ type: 'string' }} validator={validator} classMap={{ input: (base) => `${base} wide` }} />,
    );

    expect(screen.getByRole('textbox')).toHaveClass('theme-input', 'wide');
  });
});

describe('state attributes', () => {
  it('marks the wrapper, label, description and help of a field showing errors data-invalid, and no other', () => {
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
    });

    for (const selector of ['label[for="root_bad"]', '#root_bad__description', '#root_bad__help']) {
      expect(node.querySelector(selector)).toHaveAttribute('data-invalid', 'true');
    }
    expect(node.querySelector('label[for="root_bad"]')?.closest('.rjsf-field')).toHaveAttribute('data-invalid', 'true');
    for (const selector of ['label[for="root_good"]', '#root_good__description', '#root_good__help', '#root']) {
      expect(node.querySelector(selector)).not.toHaveAttribute('data-invalid');
    }
  });

  it("marks a container's and a checkbox's own description, and a checkbox's own label, data-invalid while they show errors", () => {
    createFormComponent({
      schema: {
        type: 'object',
        description: 'object description',
        properties: {
          list: { type: 'array', description: 'list description', items: { type: 'string' } },
          flag: { type: 'boolean', description: 'flag description' },
        },
      },
      extraErrors: { __errors: ['wrong'], list: { __errors: ['wrong'] }, flag: { __errors: ['wrong'] } },
    });

    for (const text of ['object description', 'list description', 'flag description']) {
      expect(screen.getByText(text).closest('.rjsf-field-description')).toHaveAttribute('data-invalid', 'true');
    }
    expect(screen.getByRole('checkbox').closest('label')).toHaveAttribute('data-invalid', 'true');
  });

  it("leaves a checkbox's own label unmarked while it shows no errors", () => {
    createFormComponent({ schema: { type: 'boolean', title: 'Flag' } });

    expect(screen.getByRole('checkbox').closest('label')).not.toHaveAttribute('data-invalid');
  });

  // An option's label follows its own errors and `ui:hideError`, as its wrapper's class and its help do, whatever the
  // field above does
  it.each([
    ['shows', true, false],
    ['hides', false, true],
  ])("marks an anyOf option's label by whether the option %s the errors", (_, aboveHides, optionHides) => {
    const { node } = createFormComponent({
      schema: { anyOf: [{ type: 'string', title: 'Text' }, { type: 'number' }] },
      uiSchema: { 'ui:hideError': aboveHides, anyOf: [{ 'ui:hideError': optionHides }, {}] },
      extraErrors: { __errors: ['wrong'] },
    });

    const label = node.querySelector('label[for="root"]');
    expect(label).toHaveTextContent('Text');
    expect(label?.getAttribute('data-invalid')).toBe(optionHides ? null : 'true');
  });

  it('marks a disabled or read-only option data-disabled, stacked or inline, and no enabled one', () => {
    const { node } = createFormComponent({
      schema: {
        type: 'object',
        properties: {
          flag: { type: 'boolean' },
          choice: { type: 'string', enum: ['a', 'b'] },
          inline: { type: 'string', enum: ['a', 'b'] },
          many: { type: 'array', items: { type: 'string', enum: ['a', 'b'] }, uniqueItems: true },
        },
      },
      uiSchema: {
        flag: { 'ui:readonly': true },
        choice: { 'ui:widget': 'radio', 'ui:enumDisabled': ['b'] },
        inline: { 'ui:widget': 'radio', 'ui:options': { inline: true }, 'ui:disabled': true },
        many: { 'ui:widget': 'checkboxes', 'ui:enumDisabled': ['a'] },
      },
    });

    expect(node.querySelector('#root_flag')?.closest('.rjsf-checkbox')).toHaveAttribute('data-disabled', 'true');
    const [choiceA, choiceB] = node.querySelectorAll('#root_choice .rjsf-radio');
    expect(choiceA).not.toHaveAttribute('data-disabled');
    expect(choiceB).toHaveAttribute('data-disabled', 'true');
    for (const label of node.querySelectorAll('.rjsf-radio-inline')) {
      expect(label).toHaveAttribute('data-disabled', 'true');
    }
    const [manyA, manyB] = node.querySelectorAll('.rjsf-checkboxes .rjsf-checkbox');
    expect(manyA).toHaveAttribute('data-disabled', 'true');
    expect(manyB).not.toHaveAttribute('data-disabled');
  });
});
