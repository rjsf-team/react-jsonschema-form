import type { GenericObjectType, RJSFSchema } from '../../src/index.ts';
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
    it('coerces a non-boolean "ui:label" from untyped JSON to a boolean', () => {
      const uiSchemaFromJson = (label: unknown): GenericObjectType => ({ 'ui:label': label });
      expect(getDisplayLabel({ validator: testValidator }, { type: 'string' }, uiSchemaFromJson(0))).toBe(false);
      expect(getDisplayLabel({ validator: testValidator }, { type: 'string' }, uiSchemaFromJson(null))).toBe(false);
      expect(getDisplayLabel({ validator: testValidator }, { type: 'string' }, uiSchemaFromJson('yes'))).toBe(true);
    });
    it('object type', () => {
      expect(getDisplayLabel({ validator: testValidator }, { type: 'object' })).toEqual(false);
    });
    it('object type from additionalProperty', () => {
      expect(
        getDisplayLabel({ validator: testValidator }, { type: 'object', [ADDITIONAL_PROPERTY_FLAG]: true }),
      ).toEqual(true);
    });
    it('object type with constant options', () => {
      expect(
        getDisplayLabel(
          { validator: testValidator },
          { type: 'object', oneOf: [{ const: { a: 1 } }, { const: { a: 2 } }] },
        ),
      ).toEqual(true);
    });
    it('object type with an enum', () => {
      expect(getDisplayLabel({ validator: testValidator }, { type: 'object', enum: [{ a: 1 }, { a: 2 }] })).toEqual(
        true,
      );
    });
    it('object type with an empty list of options', () => {
      expect(
        getDisplayLabel(
          { validator: testValidator },
          { type: 'object', properties: { a: { type: 'string' } }, oneOf: [] },
        ),
      ).toEqual(false);
    });
    it('object type with non-constant options', () => {
      expect(
        getDisplayLabel(
          { validator: testValidator },
          { type: 'object', anyOf: [{ properties: { a: { type: 'string' } } }] },
        ),
      ).toEqual(false);
    });
    it('boolean type without widget', () => {
      expect(getDisplayLabel({ validator: testValidator }, { type: 'boolean' })).toEqual(false);
    });
    it('boolean type with widget', () => {
      expect(getDisplayLabel({ validator: testValidator }, { type: 'boolean' }, { 'ui:widget': 'test' })).toEqual(true);
    });
    it('boolean type with widget named through ui:options', () => {
      expect(
        getDisplayLabel({ validator: testValidator }, { type: 'boolean' }, { 'ui:options': { widget: 'test' } }),
      ).toEqual(true);
    });
    it.each([
      ['ui:widget', { 'ui:widget': 'CheckboxWidget' }],
      ['ui:options', { 'ui:options': { widget: 'CheckboxWidget' } }],
    ])('boolean type naming the checkbox it already resolves to, through %s', (_, uiSchema) => {
      expect(getDisplayLabel({ validator: testValidator }, { type: 'boolean' }, uiSchema)).toEqual(false);
    });
    it('boolean type naming the checkbox by its alias, which a FieldTemplate lays out itself', () => {
      expect(getDisplayLabel({ validator: testValidator }, { type: 'boolean' }, { 'ui:widget': 'checkbox' })).toEqual(
        true,
      );
    });
    it.each<[string, RJSFSchema['type'], boolean]>([
      ['textarea', ['null', 'object', 'string'], false],
      ['CheckboxWidget', ['number', 'boolean'], false],
      ['MyWidget', ['null', 'object', 'string'], false],
    ])('a %s on a %j follows the field of the type that renders it', (widget, type, expected) => {
      expect(getDisplayLabel({ validator: testValidator }, { type }, { 'ui:widget': widget })).toEqual(expected);
    });
    it('a select over a type list naming boolean first displays its label, since StringField renders it', () => {
      expect(
        getDisplayLabel({ validator: testValidator }, { type: ['null', 'boolean', 'string'], enum: [null, true, 'a'] }),
      ).toEqual(true);
    });
    it('a nullable type ignores the widget when choosing the type', () => {
      expect(
        getDisplayLabel({ validator: testValidator }, { type: ['null', 'object'] }, { 'ui:widget': 'textarea' }),
      ).toEqual(false);
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
      it('enum of whole array values', () => {
        expect(getDisplayLabel({ validator: testValidator }, { type: 'array', enum: [[1], [2]] }, {})).toEqual(true);
      });
      it('empty enum', () => {
        expect(
          getDisplayLabel({ validator: testValidator }, { type: 'array', items: { type: 'string' }, enum: [] }, {}),
        ).toEqual(false);
      });
      it('constant options', () => {
        expect(
          getDisplayLabel({ validator: testValidator }, { type: 'array', anyOf: [{ const: [1] }, { const: [2] }] }, {}),
        ).toEqual(true);
      });
      it('empty list of options', () => {
        expect(
          getDisplayLabel({ validator: testValidator }, { type: 'array', items: { type: 'string' }, anyOf: [] }, {}),
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
