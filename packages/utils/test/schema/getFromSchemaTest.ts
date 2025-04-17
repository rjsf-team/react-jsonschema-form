import get from 'lodash/get';

import { DEFINITIONS_KEY, PROPERTIES_KEY, RJSFSchema, createSchemaUtils } from '../../src';
import { TestValidatorType } from './types';

const rawSchema = {
  title: 'Test Schema',
  type: 'object',
  properties: {
    patient: { title: 'Patient', $ref: '#/definitions/Patient' },
  },
  definitions: {
    Phone: {
      type: 'object',
      properties: {
        number: {
          title: 'Phone Number',
          type: 'string',
        },
        is_cell: { title: 'This is a mobile number', type: 'boolean' },
      },
      required: ['number', 'is_cell'],
    },
    PatientTelecom: {
      type: 'object',
      properties: {
        phone: {
          title: 'Patient Phone Number',
          $ref: '#/definitions/Phone',
        },
        email: {
          title: 'Email Address',
          type: 'string',
          format: 'email',
        },
      },
    },
    Patient: {
      type: 'object',
      properties: {
        birth_date: {
          title: 'Date of Birth',
          type: 'string',
          format: 'date',
        },
        telecom: {
          title: 'Telecom',
          $ref: '#/definitions/PatientTelecom',
        },
      },
      required: ['name', 'birth_date', 'telecom'],
    },
  },
  required: ['patient'],
};
// Adding `& typeof rawSchema` allows us to directly access into the actual object for PATIENT_SCHEMA
const testSchema = rawSchema as RJSFSchema & typeof rawSchema;

const SCHEMA_DEFINITIONS = rawSchema[DEFINITIONS_KEY];

const PATIENT_SCHEMA = SCHEMA_DEFINITIONS.Patient as RJSFSchema;

export default function getFromSchemaTest(testValidator: TestValidatorType) {
  const schemaUtils = createSchemaUtils(testValidator, testSchema);
  describe('getFromSchema', () => {
    it('performs a simple `get` for a path without $ref values', () => {
      const fieldPath = [PROPERTIES_KEY, 'birth_date'];
      const field = schemaUtils.getFromSchema(PATIENT_SCHEMA, fieldPath, undefined);
      expect(field).toEqual(get(PATIENT_SCHEMA, fieldPath));
    });
    it('returns the expected field with the $refs retrieved for a path with a $ref', () => {
      const field = schemaUtils.getFromSchema(testSchema, [PROPERTIES_KEY, 'patient'], undefined);
      expect(field).toEqual({
        title: testSchema[PROPERTIES_KEY].patient.title,
        ...schemaUtils.retrieveSchema(get(testSchema, [PROPERTIES_KEY, 'patient'])),
      });
    });
    it('returns the expected field with the $refs retrieved for a path with nested $refs, string path', () => {
      const field = schemaUtils.getFromSchema(
        testSchema,
        [PROPERTIES_KEY, 'patient', PROPERTIES_KEY, 'telecom', PROPERTIES_KEY, 'phone', PROPERTIES_KEY, 'number'].join(
          '.',
        ),
        undefined,
      );
      expect(field).toEqual(SCHEMA_DEFINITIONS.Phone[PROPERTIES_KEY].number);
    });
    it('returns the default data value when passed an invalid path', () => {
      const defaultValue = 'DEFAULT';
      const field = schemaUtils.getFromSchema(testSchema, [PROPERTIES_KEY, 'patient', 'telecom'], defaultValue);
      expect(field).toEqual(defaultValue);
    });
    it('returns the default schema value when passed an invalid path', () => {
      const defaultValue = { title: 'nothing' } as RJSFSchema;
      const field = schemaUtils.getFromSchema(testSchema, [PROPERTIES_KEY, 'patient', 'telecom'], defaultValue);
      expect(field).toEqual(defaultValue);
    });
  });
}
