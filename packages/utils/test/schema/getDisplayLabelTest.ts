import type { RJSFSchema } from '../../src/index.ts';
import { ADDITIONAL_PROPERTY_FLAG, createSchemaUtils, getDisplayLabel } from '../../src/index.ts';
import type { TestValidatorType } from './types.ts';

export default function getDisplayLabelTest(testValidator: TestValidatorType) {
  describe('getDisplayLabel()', () => {
    it('with global uiSchema "label" set to true', () => {
      expect(getDisplayLabel({ validator: testValidator }, { type: 'string' }, {}, undefined, { label: true })).toEqual(
        true,
      );
    });
    it('with global uiSchema "label" set to false', () => {
      const schema: RJSFSchema = { type: 'string' };
      const schemaUtils = createSchemaUtils({ validator: testValidator }, schema);
      expect(schemaUtils.getDisplayLabel(schema, {}, { label: false })).toEqual(false);
    });
    it('with local uiSchema "label" set to true', () => {
      expect(
        getDisplayLabel({ validator: testValidator }, { type: 'string' }, { 'ui:options': { label: true } }),
      ).toEqual(true);
    });
    it('with local uiSchema "label" set to false', () => {
      expect(getDisplayLabel({ validator: testValidator }, { type: 'string' }, { 'ui:label': false })).toEqual(false);
    });
    it('object type', () => {
      expect(getDisplayLabel({ validator: testValidator }, { type: 'object' })).toEqual(false);
    });
    it('object type from additionalProperty', () => {
      expect(
        getDisplayLabel({ validator: testValidator }, { type: 'object', [ADDITIONAL_PROPERTY_FLAG]: true }),
      ).toEqual(true);
    });
    it('boolean type without widget', () => {
      expect(getDisplayLabel({ validator: testValidator }, { type: 'boolean' })).toEqual(false);
    });
    it('boolean type with widget', () => {
      expect(getDisplayLabel({ validator: testValidator }, { type: 'boolean' }, { 'ui:widget': 'test' })).toEqual(true);
    });
    it('with ui:field', () => {
      const schema: RJSFSchema = { type: 'string' };
      const schemaUtils = createSchemaUtils({ validator: testValidator }, schema);
      expect(schemaUtils.getDisplayLabel(schema, { 'ui:field': 'test' })).toEqual(false);
    });
    describe('array type', () => {
      it('added by additionalProperty', () => {
        expect(
          getDisplayLabel({ validator: testValidator }, { type: 'array', [ADDITIONAL_PROPERTY_FLAG]: true }, {}),
        ).toEqual(true);
      });
      it('items', () => {
        expect(getDisplayLabel({ validator: testValidator }, { type: 'array', items: { type: 'string' } }, {})).toEqual(
          false,
        );
      });
      it('items enum', () => {
        expect(
          getDisplayLabel({ validator: testValidator }, { type: 'array', enum: ['NW', 'NE', 'SW', 'SE'] }, {}),
        ).toEqual(false);
      });
      it('files type', () => {
        expect(getDisplayLabel({ validator: testValidator }, { type: 'array' }, { 'ui:widget': 'files' })).toEqual(
          true,
        );
      });
      it('custom type', () => {
        expect(
          getDisplayLabel(
            { validator: testValidator },
            { type: 'array', title: 'myAwesomeTitle' },
            { 'ui:widget': 'MyAwesomeWidget' },
          ),
        ).toEqual(true);
      });
    });
  });
}
