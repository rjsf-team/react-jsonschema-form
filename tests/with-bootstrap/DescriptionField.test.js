import React from 'react';
import { cleanup } from 'react-testing-library';

import DescriptionField from 'react-jsonschema-form/src/components/fields/DescriptionField';

import { createComponent } from './test_utils';

describe('DescriptionField', () => {
  afterEach(cleanup);

  // For some reason, stateless components needs to be wrapped into a stateful
  // one to be rendered into the document.
  class DescriptionFieldWrapper extends React.Component {
    constructor(props) {
      super(props);
    }
    render() {
      return <DescriptionField {...this.props} />;
    }
  }

  it('should return a div for a custom component', () => {
    const props = {
      description: <em>description</em>
    };
    const { node } = createComponent(DescriptionFieldWrapper, props);

    expect(node.tagName).toBe('DIV');
  });

  it('should return a p for a description text', () => {
    const props = {
      description: 'description'
    };
    const { node } = createComponent(DescriptionFieldWrapper, props);

    expect(node.tagName).toBe('P');
  });

  it('should have the expected id', () => {
    const props = {
      description: 'Field description',
      id: 'sample_id'
    };
    const { node } = createComponent(DescriptionFieldWrapper, props);

    expect(node.id).toBe('sample_id');
  });
});
