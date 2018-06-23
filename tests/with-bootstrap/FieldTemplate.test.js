import React from 'react';
import { cleanup } from 'react-testing-library';

import { createFormComponent } from './test_utils';

describe('FieldTemplate', () => {
  afterEach(cleanup);

  describe('Custom FieldTemplate for disabled property', () => {
    function FieldTemplate(props) {
      return <div className={props.disabled ? 'disabled' : 'foo'} />;
    }

    it('should render with disabled when ui:disabled is truthy', () => {
      const { node } = createFormComponent({
        schema: { type: 'string' },
        uiSchema: { 'ui:disabled': true },
        templates: { FieldTemplate }
      });
      expect(node.querySelectorAll('.disabled')).toHaveLength(1);
    });

    it('should render with disabled when ui:disabled is falsey', () => {
      const { node } = createFormComponent({
        schema: { type: 'string' },
        uiSchema: { 'ui:disabled': false },
        templates: { FieldTemplate }
      });
      expect(node.querySelectorAll('.disabled')).toHaveLength(0);
    });
  });
});
