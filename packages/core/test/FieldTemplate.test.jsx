import { Children } from 'react';

import { expect } from 'chai';
import { createFormComponent, createSandbox } from './test_utils';

describe('FieldTemplate', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('FieldTemplate should only have one child', () => {
    function FieldTemplate(props) {
      if (Children.count(props.children) !== 1) {
        throw 'Got wrong number of children';
      }
      return null;
    }
    createFormComponent({
      schema: { type: 'string' },
      uiSchema: { 'ui:disabled': true },
      templates: { FieldTemplate },
    });
  });

  describe('Custom FieldTemplate for disabled property', () => {
    function FieldTemplate(props) {
      return <div className={props.disabled ? 'disabled' : 'foo'} />;
    }

    describe('with template globally configured', () => {
      it('should render with disabled when ui:disabled is truthy', () => {
        const { node } = createFormComponent({
          schema: { type: 'string' },
          uiSchema: { 'ui:disabled': true },
          templates: { FieldTemplate },
        });
        expect(node.querySelectorAll('.disabled')).to.have.length.of(1);
      });

      it('should render with disabled when ui:disabled is falsey', () => {
        const { node } = createFormComponent({
          schema: { type: 'string' },
          uiSchema: { 'ui:disabled': false },
          templates: { FieldTemplate },
        });
        expect(node.querySelectorAll('.disabled')).to.have.length.of(0);
      });
    });
    describe('with template configured in ui:FieldTemplate', () => {
      it('should render with disabled when ui:disabled is truthy', () => {
        const { node } = createFormComponent({
          schema: { type: 'string' },
          uiSchema: { 'ui:disabled': true, 'ui:FieldTemplate': FieldTemplate },
        });
        expect(node.querySelectorAll('.disabled')).to.have.length.of(1);
      });

      it('should render with disabled when ui:disabled is falsey', () => {
        const { node } = createFormComponent({
          schema: { type: 'string' },
          uiSchema: { 'ui:disabled': false, 'ui:FieldTemplate': FieldTemplate },
        });
        expect(node.querySelectorAll('.disabled')).to.have.length.of(0);
      });
    });
    describe('with template configured globally being overriden in ui:FieldTemplate', () => {
      it('should render with disabled when ui:disabled is truthy', () => {
        const { node } = createFormComponent({
          schema: { type: 'string' },
          uiSchema: { 'ui:disabled': true, 'ui:FieldTemplate': FieldTemplate },
          // Empty field template to prove that overides work
          templates: { FieldTemplate: () => <div /> },
        });
        expect(node.querySelectorAll('.disabled')).to.have.length.of(1);
      });

      it('should render with disabled when ui:disabled is falsey', () => {
        const { node } = createFormComponent({
          schema: { type: 'string' },
          uiSchema: { 'ui:disabled': false, 'ui:FieldTemplate': FieldTemplate },
          // Empty field template to prove that overides work
          templates: { FieldTemplate: () => <div /> },
        });
        expect(node.querySelectorAll('.disabled')).to.have.length.of(0);
      });
    });
  });

  describe('Custom FieldTemplate should have registry', () => {
    function FieldTemplate(props) {
      return (
        <div>
          Root Schema: <span id='root-schema'>{JSON.stringify(props.registry.rootSchema)}</span>
        </div>
      );
    }

    it('should allow access to root schema from registry', () => {
      const schema = {
        type: 'object',
        properties: { fooBarBaz: { type: 'string' } },
      };

      const { node } = createFormComponent({
        schema,
        templates: { FieldTemplate },
      });

      expect(node.querySelectorAll('#root-schema')).to.have.length.of(1);
      expect(node.querySelectorAll('#root-schema')[0].innerHTML).to.equal(JSON.stringify(schema));
    });
  });
});
