import React from 'react';
import renderer from 'react-test-renderer';

import '../__mocks__/matchMedia.mock';
import Form from '../src';

const { describe, expect, test } = global;

describe("array fields", () => {
  test("has errors", () => {
    const schema = {
      type: 'object',
        properties: {
          name: {
            type: 'string',
          }
        }
    };
    const tree = renderer
      .create(<Form schema={schema} extraErrors={{ name: { __errors: ["Bad input"] } }} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("no errors", () => {
    const schema = {
      type: 'object',
        properties: {
          name: {
            type: 'string',
          }
        }
    };
    const tree = renderer
      .create(<Form schema={schema} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("empty errors array", () => {
    const schema = {
      type: 'object',
        properties: {
          name: {
            type: 'string',
          }
        }
    };
    const tree = renderer
      .create(<Form schema={schema} extraErrors={{ name: { __errors: [] } }} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});
