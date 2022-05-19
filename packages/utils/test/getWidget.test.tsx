import React from 'react';
import { JSONSchema7 } from 'json-schema';

import { GenericObjectType, getWidget } from '../src';

const subschema: JSONSchema7 = {
  type: 'boolean',
  default: true,
};

const schema: JSONSchema7 = {
  type: 'object',
  properties: {
    anObject: {
      type: 'object',
      properties: {
        array: {
          type: 'array',
          default: ['foo', 'bar'],
          items: {
            type: 'string',
          },
        },
        bool: subschema,
      },
    },
  },
};

describe('getWidget()', () => {
  it('should fail if widget has incorrect type', () => {
    const Widget = new Number(1);
    expect(() => getWidget(schema, Widget)).toThrowError(
      'Unsupported widget definition: object'
    );
  });

  it('should fail if widget has no type property', () => {
    const Widget = 'blabla';
    expect(() => getWidget(schema, Widget)).toThrowError(
      `No widget for type 'object'`
    );
  });

  it('should return `SelectWidget` for boolean type', () => {
    const Widget = (props: GenericObjectType) => <div {...props} />;
    const registry = { SelectWidget: Widget };
    const TheWidget = getWidget(subschema, 'select', registry);
    console.log({ TheWidget });
    expect(TheWidget({})).toEqual(<Widget options={{}} />);
  });

  it('should not fail on correct component', () => {
    const Widget = (props: GenericObjectType) => <div {...props} />;
    expect(getWidget(schema, Widget)({})).toEqual(<Widget options={{}} />);
  });

  it('should not fail on forwarded ref component', () => {
    const Widget = React.forwardRef((props: GenericObjectType, ref: React.ForwardedRef<any>) => (
      <div {...props} ref={ref} />
  ));
    expect(getWidget(schema, Widget)({})).toEqual(<Widget options={{}} />);
  });

  it('should not fail on memo component', () => {
    const Widget = React.memo((props: GenericObjectType) => <div {...props} />);
    expect(getWidget(schema, Widget)({})).toEqual(<Widget options={{}} />);
  });
});
