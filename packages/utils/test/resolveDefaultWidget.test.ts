import type { RJSFSchema, Widget } from '../src/index.ts';
import { createSchemaUtils, resolveDefaultWidget } from '../src/index.ts';
import getTestValidator from './testUtils/getTestValidator.ts';

const testValidator = getTestValidator({});

describe('resolveDefaultWidget()', () => {
  it('defaults to "text" with no enumOptions when the schema has no enumerable options or registered format', () => {
    const schema: RJSFSchema = { type: 'string' };
    const schemaUtils = createSchemaUtils({ validator: testValidator }, schema);

    expect(resolveDefaultWidget(schema, {}, schemaUtils)).toEqual({
      defaultWidget: 'text',
      enumOptions: undefined,
    });
  });

  it('defaults to "select" with enumOptions when the schema has enumerable options', () => {
    const schema: RJSFSchema = { type: 'string', enum: ['foo', 'bar'] };
    const schemaUtils = createSchemaUtils({ validator: testValidator }, schema);

    const { defaultWidget, enumOptions } = resolveDefaultWidget(schema, {}, schemaUtils);

    expect(defaultWidget).toEqual('select');
    expect(enumOptions).toEqual([
      { value: 'foo', label: 'foo' },
      { value: 'bar', label: 'bar' },
    ]);
  });

  it('uses the schema format as the default widget when a widget is registered for it', () => {
    const schema: RJSFSchema = { type: 'number', format: 'custom-format' };
    const schemaUtils = createSchemaUtils({ validator: testValidator }, schema);
    const registeredWidgets = { 'custom-format': (() => null) as unknown as Widget };

    expect(resolveDefaultWidget(schema, {}, schemaUtils, registeredWidgets)).toEqual({
      defaultWidget: 'custom-format',
      enumOptions: undefined,
    });
  });

  it('ignores the schema format when no widget is registered for it', () => {
    const schema: RJSFSchema = { type: 'number', format: 'custom-format' };
    const schemaUtils = createSchemaUtils({ validator: testValidator }, schema);

    expect(resolveDefaultWidget(schema, {}, schemaUtils)).toEqual({
      defaultWidget: 'text',
      enumOptions: undefined,
    });
  });

  it('defaults registeredWidgets to {} when omitted', () => {
    const schema: RJSFSchema = { type: 'number', format: 'custom-format' };
    const schemaUtils = createSchemaUtils({ validator: testValidator }, schema);

    expect(resolveDefaultWidget(schema, {}, schemaUtils).defaultWidget).toEqual('text');
  });
});
