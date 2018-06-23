import React from 'react';
import { cleanup } from 'react-testing-library';

import TitleTemplate from 'react-jsonschema-form-bootstrap/src/components/templates/TitleTemplate';

import { createComponent } from './test_utils';

describe('TitleTemplate', () => {
  afterEach(cleanup);

  // For some reason, stateless components needs to be wrapped into a stateful
  // one to be rendered into the document.
  class TitleTemplateWrapper extends React.Component {
    constructor(props) {
      super(props);
    }
    render() {
      return <TitleTemplate {...this.props} />;
    }
  }

  it('should return a legend', () => {
    const props = {
      title: 'Field title',
      required: true
    };
    const { node } = createComponent(TitleTemplateWrapper, props);

    expect(node.tagName).toBe('LEGEND');
  });

  it('should have the expected id', () => {
    const props = {
      title: 'Field title',
      required: true,
      id: 'sample_id'
    };
    const { node } = createComponent(TitleTemplateWrapper, props);

    expect(node.id).toBe('sample_id');
  });

  it('should include only title, when field is not required', () => {
    const props = {
      title: 'Field title',
      required: false
    };
    const { node } = createComponent(TitleTemplateWrapper, props);

    expect(node.textContent).toBe(props.title);
  });

  it('should add an asterisk to the title, when field is required', () => {
    const props = {
      title: 'Field title',
      required: true
    };
    const { node } = createComponent(TitleTemplateWrapper, props);

    expect(node.textContent).toBe(props.title + '*');
  });
});
