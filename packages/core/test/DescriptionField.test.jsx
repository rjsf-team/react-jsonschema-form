import { Component } from 'react';
import { expect } from 'chai';

import DescriptionField from '../src/components/templates/DescriptionField';
import { createSandbox, createComponent } from './test_utils';

describe('DescriptionField', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  // For some reason, stateless components needs to be wrapped into a stateful
  // one to be rendered into the document.
  class DescriptionFieldWrapper extends Component {
    constructor(props) {
      super(props);
    }
    render() {
      return <DescriptionField {...this.props} />;
    }
  }

  it('should return a div for a custom component', () => {
    const props = {
      description: <em>description</em>,
    };
    const { node } = createComponent(DescriptionFieldWrapper, props);

    expect(node.tagName).to.equal('DIV');
  });

  it('should return a p for a description text', () => {
    const props = {
      description: 'description',
    };
    const { node } = createComponent(DescriptionFieldWrapper, props);

    expect(node.tagName).to.equal('P');
  });

  it('should have the expected id', () => {
    const props = {
      description: 'Field description',
      id: 'sample_id',
    };
    const { node } = createComponent(DescriptionFieldWrapper, props);

    expect(node.id).to.equal('sample_id');
  });
});
