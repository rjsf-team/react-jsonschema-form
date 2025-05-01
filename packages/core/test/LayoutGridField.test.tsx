import { ChangeEvent, FocusEvent, ReactElement } from 'react';
import {
  DEFINITIONS_KEY,
  DISCRIMINATOR_PATH,
  ErrorSchemaBuilder,
  FieldProps,
  GenericObjectType,
  getUiOptions,
  ID_KEY,
  IdSchema,
  LOOKUP_MAP_NAME,
  ONE_OF_KEY,
  PROPERTIES_KEY,
  Registry,
  retrieveSchema,
  RJSFSchema,
  sortedJSONStringify,
  toIdSchema,
  UI_OPTIONS_KEY,
  UiSchema,
} from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { get, has, omit, pick } from 'lodash';

import LayoutGridField, {
  GridType,
  LAYOUT_GRID_OPTION,
  LayoutGridFieldProps,
  Operators,
  UI_GLOBAL_OPTIONS,
} from '../src/components/fields/LayoutGridField';
import { SAMPLE_SCHEMA, sampleUISchema, SIMPLE_ONEOF, SIMPLE_ONEOF_OPTIONS } from './testData/layoutData';
import getTestRegistry from './testData/getTestRegistry';

const ColumnWidth3 = 'col-xs-3';
const ColumnWidth4 = 'col-xs-4';
const ColumnWidth6 = 'col-xs-6';
const ColumnWidth9 = 'col-xs-9';
const ColumnWidthAll = 'col-xs-12';

const readonlySchema: RJSFSchema = {
  title: 'Readonly fields in schema',
  type: 'object',
  properties: {
    roString: {
      type: 'string',
      readOnly: true,
    },
    string: {
      type: 'string',
    },
    stringSelect: {
      type: 'string',
      oneOf: [
        {
          const: '1',
          title: 'One',
        },
        {
          const: '2',
          title: 'Two',
        },
      ],
    },
    nested: {
      type: 'object',
      readOnly: true,
      properties: {
        roNumber: {
          type: 'number',
        },
        number: {
          type: 'number',
          readOnly: false,
        },
      },
      required: ['number'],
    },
  },
  required: ['string'],
};
const readonlyUISchema: UiSchema = {
  'ui:field': 'LayoutGridField',
  'ui:layoutGrid': {
    'ui:row': {
      children: [
        {
          'ui:col': {
            className: ColumnWidth4,
            children: ['roString', 'stringSelect', 'nested.roNumber'],
          },
        },
        {
          'ui:col': {
            className: ColumnWidth6,
            children: ['string', 'nested.number'],
          },
        },
      ],
    },
  },
  roString: {
    'ui:readonly': false,
  },
  string: {
    'ui:readonly': true,
  },
};

const gridFormSchema = {
  type: 'object',
  properties: {
    person: { title: 'Person', $ref: '#/definitions/Person' },
    employment: {
      title: 'Employment',
      discriminator: {
        propertyName: 'job_type',
      },
      oneOf: [{ $ref: '#/definitions/Company' }, { $ref: '#/definitions/Education' }, { $ref: '#/definitions/Other' }],
    },
  },
  definitions: {
    PersonName: {
      type: 'object',
      properties: {
        first: {
          title: 'First Name',
          minLength: 1,
          maxLength: 200,
          type: 'string',
        },
        middle: {
          title: 'Middle',
          minLength: 1,
          maxLength: 200,
          type: 'string',
        },
        last: {
          title: 'Last Name',
          minLength: 1,
          maxLength: 1000,
          type: 'string',
        },
      },
      required: ['first', 'last'],
    },
    Race: {
      title: 'Race',
      type: 'array',
      items: {
        type: 'string',
        oneOf: [
          {
            const: 'native_american',
            title: 'American Indian / Alaska Native',
          },
          {
            const: 'asian',
            title: 'Asian',
          },
          {
            const: 'black',
            title: 'Black / African American',
          },
          {
            const: 'pacific_islander',
            title: 'Native Hawaiian / Other Pacific Islander',
          },
          {
            const: 'white',
            title: 'White',
          },
        ],
      },
      uniqueItems: true,
    },
    Person: {
      type: 'object',
      properties: {
        name: { $ref: '#/definitions/PersonName' },
        birth_date: {
          title: 'Date of Birth',
          type: 'string',
          format: 'date',
        },
        race: {
          title: 'Race',
          description: '(Check all that apply)',
          $ref: '#/definitions/Race',
        },
        address: {
          title: 'Address',
          $ref: '#/definitions/Address',
        },
      },
      required: ['name', 'birth_date', 'race', 'address'],
    },
    StateAbrv: {
      title: 'StateAbrv',
      enum: [
        'AL',
        'AK',
        'AS',
        'AZ',
        'AR',
        'CA',
        'CO',
        'CT',
        'DE',
        'DC',
        'FL',
        'GA',
        'GU',
        'HI',
        'ID',
        'IL',
        'IN',
        'IA',
        'KS',
        'KY',
        'LA',
        'ME',
        'MD',
        'MA',
        'MI',
        'MN',
        'MS',
        'MO',
        'MT',
        'NE',
        'NV',
        'NH',
        'NJ',
        'NM',
        'NY',
        'NC',
        'ND',
        'MP',
        'OH',
        'OK',
        'OR',
        'PA',
        'PR',
        'RI',
        'SC',
        'SD',
        'TN',
        'TX',
        'UT',
        'VT',
        'VA',
        'VI',
        'WA',
        'WV',
        'WI',
        'WY',
      ],
      type: 'string',
    },
    Address: {
      type: 'object',
      properties: {
        line_1: {
          title: 'Address',
          minLength: 1,
          maxLength: 200,
          type: 'string',
        },
        line_2: {
          title: 'Address 2',
          minLength: 1,
          maxLength: 200,
          type: 'string',
        },
        city: {
          title: 'City',
          minLength: 1,
          maxLength: 50,
          type: 'string',
        },
        state: { title: 'State', $ref: '#/definitions/StateAbrv' },
        postal_code: {
          title: 'ZIP Code',
          pattern: '^\\d{5}(?:[-\\s]\\d{4})?$',
          type: 'string',
        },
      },
      required: ['line_1', 'city', 'state', 'postal_code'],
    },
    Location: {
      type: 'object',
      properties: {
        city: {
          type: 'string',
          title: 'City',
        },
        state: {
          $ref: '#/definitions/StateAbrv',
        },
      },
      required: ['city', 'state'],
    },
    Company: {
      type: 'object',
      properties: {
        job_type: {
          title: 'Company',
          default: 'company',
          enum: ['company'],
          type: 'string',
        },
        business: {
          title: 'Company Name',
          type: 'string',
        },
        title: {
          title: 'Job Title',
          type: 'string',
        },
        location: {
          $ref: '#/definitions/Location',
        },
      },
      required: ['job_type', 'business', 'location'],
    },
    Education: {
      type: 'object',
      properties: {
        job_type: {
          title: 'Education',
          default: 'education',
          enum: ['education'],
          type: 'string',
        },
        district: {
          title: 'District Name',
          type: 'string',
        },
        school: {
          title: 'School Name',
          type: 'string',
        },
        title: {
          title: 'Job Title',
          type: 'string',
        },
        location: {
          $ref: '#/definitions/Location',
        },
      },
      required: ['job_type', 'school', 'location'],
    },
    Other: {
      type: 'object',
      properties: {
        job_type: {
          title: 'Other',
          default: 'other',
          enum: ['other'],
          type: 'string',
        },
        description: {
          title: 'Describe your job',
          type: 'string',
        },
      },
      required: ['job_type', 'description'],
    },
  },
} as RJSFSchema;

const gridFormUISchema: UiSchema = {
  'ui:field': 'LayoutGridForm',
  'ui:layoutGrid': {
    'ui:row': [
      {
        'ui:row': {
          children: [
            {
              'ui:columns': {
                className: ColumnWidth3,
                children: ['person.name.first', 'person.name.middle', 'person.name.last'],
              },
            },
          ],
        },
      },
      {
        'ui:row': {
          children: [
            {
              'ui:col': {
                className: ColumnWidth3,
                children: [
                  {
                    name: 'person.birth_date',
                    placeholder: '$lookup=PlaceholderText',
                  },
                ],
              },
            },
            {
              'ui:col': {
                className: ColumnWidth6,
                children: ['person.race'],
              },
            },
          ],
        },
      },
      {
        'ui:row': {
          children: [
            {
              'ui:columns': {
                className: ColumnWidth6,
                children: ['patient.address', 'patient.employment'],
              },
            },
          ],
        },
      },
    ],
  },
  person: {
    race: {
      'ui:options': {
        widget: 'checkboxes',
      },
    },
    address: {
      'ui:field': 'LayoutGridField',
      'ui:layoutGrid': {
        'ui:row': {
          children: [
            {
              'ui:columns': {
                className: ColumnWidthAll,
                children: ['line_1', 'line_2', 'city'],
              },
            },
            {
              'ui:row': {
                children: [
                  {
                    'ui:columns': {
                      className: ColumnWidth6,
                      children: ['state', 'postal_code'],
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      state: {
        'ui:widget': 'dropdown',
      },
    },
  },
  employment: {
    'ui:field': 'LayoutGridField',
    'ui:layoutGrid': {
      'ui:row': {
        children: [
          {
            'ui:col': {
              className: ColumnWidth6,
              children: ['job_type'],
            },
          },
          {
            'ui:condition': {
              field: 'job_type',
              value: 'company',
              operator: 'all',
              children: [
                {
                  'ui:columns': {
                    className: ColumnWidthAll,
                    children: ['business', 'title'],
                  },
                },
                {
                  'ui:col': {
                    className: ColumnWidth9,
                    children: ['location.city'],
                  },
                },
                {
                  'ui:col': {
                    className: ColumnWidth3,
                    children: ['location.state'],
                  },
                },
              ],
            },
          },
          {
            'ui:condition': {
              field: 'job_type',
              value: 'education',
              operator: 'all',
              children: [
                {
                  'ui:columns': {
                    className: ColumnWidthAll,
                    children: ['district', 'school', 'title'],
                  },
                },
                {
                  'ui:col': {
                    className: ColumnWidth9,
                    children: ['location.city'],
                  },
                },
                {
                  'ui:col': {
                    className: ColumnWidth3,
                    children: ['location.state'],
                  },
                },
              ],
            },
          },
          {
            'ui:condition': {
              field: 'job_type',
              value: 'other',
              operator: 'all',
              children: [
                {
                  'ui:columns': {
                    className: ColumnWidthAll,
                    children: [
                      {
                        name: 'description',
                        rows: 3,
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    job_type: {
      'ui:options': {
        widget: 'radio',
      },
    },
    location: {
      state: {
        'ui:widget': 'dropdown',
      },
    },
    description: {
      'ui:widget': 'textarea',
    },
  },
};

const ERRORS = ['error'];
const EXTRA_ERROR = new ErrorSchemaBuilder().addErrors(ERRORS).ErrorSchema;
const DEFAULT_ID = 'test-id';

const ID_SCHEMA = { [ID_KEY]: DEFAULT_ID } as IdSchema;

// Stringify the FieldProps, minus the registry, hasFormData and optionalObjectNode in the uiSchema
// The registry causes an infinite loop and hasFormData & optionalObjectNode are tested elsewhere
function stringifyProps(props: Partial<FieldProps>) {
  // eslint-disable-next-line no-unused-vars
  const { uiSchema, registry, ...otherProps } = props;
  const { ...otherUIOptions } = getUiOptions(uiSchema);
  return sortedJSONStringify({ ...otherProps, otherUIOptions: otherUIOptions });
}

// Render a strong with the props stringified
function TestRenderer({ 'data-testid': testId, ...props }: Readonly<FieldProps>) {
  return <strong data-testid={testId}>{stringifyProps(props)}</strong>;
}

// Render a div with the props stringified in a span, also render an input to test the onXXXX callbacks
function FakeSchemaField({ 'data-testid': testId, ...props }: Readonly<FieldProps>) {
  const { idSchema, formData, onChange, onBlur, onFocus, uiSchema } = props;
  const { [ID_KEY]: id } = idSchema;
  // Special test case that will pass an error schema into on change to allow coverage
  const error = has(uiSchema, UI_GLOBAL_OPTIONS) ? EXTRA_ERROR : undefined;
  const onTextChange = ({ target: { value: val } }: ChangeEvent<HTMLInputElement>) => {
    onChange(val, error, id);
  };
  const onTextBlur = ({ target: { value: val } }: FocusEvent<HTMLInputElement>) => onBlur(id, val);
  const onTextFocus = ({ target: { value: val } }: FocusEvent<HTMLInputElement>) => onFocus(id, val);
  return (
    <div data-testid={testId}>
      <span id={id}>{stringifyProps(props)}</span>
      <input value={formData} onChange={onTextChange} onBlur={onTextBlur} onFocus={onTextFocus} />
    </div>
  );
}

// eslint-disable-next-line no-unused-vars
const LOOKUP_MAP: { [index: string]: string | ((props: FieldProps) => ReactElement) } = {
  FooClass: 'Foo',
  BarClass: 'Bar',
  TestRenderer,
  PlaceholderText: 'looked up Placeholder',
};

const REGISTRY_FIELDS = { SchemaField: FakeSchemaField, LayoutMultiSchemaField: FakeSchemaField };
const REGISTRY_FORM_CONTEXT = { [LOOKUP_MAP_NAME]: LOOKUP_MAP };

const TEST_LAYOUT_GRID_CHILDREN = {
  [GridType.ROW]: [{ [GridType.COLUMN]: ['column1'] }, { [GridType.COLUMN]: ['column2'] }],
  [GridType.COLUMN]: {
    className: 'FooClass',
    children: ['column1'],
  },
  [GridType.CONDITION]: {
    operator: Operators.ALL,
    field: 'column2',
    value: 'blah',
    className: 'FooClass BarClass',
    children: [],
  },
};

const GRID_FORM_SCHEMA = gridFormSchema as RJSFSchema;
const NO_SCHEMA_OR_OPTIONS = {
  schema: undefined,
  isRequired: false,
  isReadonly: undefined,
  optionsInfo: undefined,
  idSchema: ID_SCHEMA,
};

const simpleOneOfRegistry = getTestRegistry(SIMPLE_ONEOF, REGISTRY_FIELDS, {}, {}, REGISTRY_FORM_CONTEXT);
const gridFormSchemaRegistry = getTestRegistry(GRID_FORM_SCHEMA, REGISTRY_FIELDS, {}, {}, REGISTRY_FORM_CONTEXT);
const sampleSchemaRegistry = getTestRegistry(SAMPLE_SCHEMA, REGISTRY_FIELDS, {}, {}, REGISTRY_FORM_CONTEXT);
const readonlySchemaRegistry = getTestRegistry(readonlySchema, REGISTRY_FIELDS, {}, {}, REGISTRY_FORM_CONTEXT);
const GRID_FORM_ID_SCHEMA = gridFormSchemaRegistry.schemaUtils.toIdSchema(GRID_FORM_SCHEMA);
const SAMPLE_SCHEMA_ID_SCHEMA = sampleSchemaRegistry.schemaUtils.toIdSchema(SAMPLE_SCHEMA);
const READONLY_ID_SCHEMA = readonlySchemaRegistry.schemaUtils.toIdSchema(readonlySchema);

/** Simple mock idSchema generator that will take a dotted path string, and return the path joined by the `idSeparator`
 * and appended to `root` (default idPrefix in `toIdSchema`)
 * ex. testGetIdSchema('billing.payer.address', '-') // returns "root-billing-payer-address"
 */
const testGetIdSchema = (path: string, idSeparator = '_') => ({ $id: ['root', ...path.split('.')].join(idSeparator) });

/** The list of props that will always be forwarded to fields
 */
const FORWARDED_PROPS = ['disabled', 'autofocus', 'readonly', 'formContext'];

/** Children for rows and columns
 */
const GRID_CHILDREN = ['simpleString', 'simpleInt'];

/** Function used to transform `props` the `field` additional `otherProps` and `otherUiProps` into a set of
 * props that match the expected props from the `LayoutGridField`
 *
 * @param props - The props passed to the component
 * @param field - The fieldName being rendered
 * @param otherProps - Any other props that may be added by the `LayoutGridField`
 * @param otherUiProps - Any other uiSchema props that may be added by the `LayoutGridField`
 */
function getExpectedPropsForField(
  props: Partial<FieldProps>,
  field: string,
  otherProps: GenericObjectType = {},
  otherUiProps: GenericObjectType = {},
) {
  const { schemaUtils } = props.registry!;
  let { required } = props;
  // Drill down, with schema retrieval, to the field name, also tracking whether the field is required
  const schema = field.split('.').reduce((result, name) => {
    const schema1 = schemaUtils.retrieveSchema(get(result, [PROPERTIES_KEY, name]) as RJSFSchema, props.schema);
    required = result?.required?.includes(name) || false;
    return schema1;
  }, props.schema);
  // Get the readonly options from the schema, if any
  const readonly = get(schema, 'readOnly');
  // Get the options from the schema's oneOf, if any
  const options = get(schema, ONE_OF_KEY);
  // Drill down in the uiSchema, errorSchema, idSchema and formData to the field
  const uiSchema = get(props.uiSchema, field);
  const errorSchema = get(props.errorSchema, field);
  const idSchema = get(props.idSchema, field)!;
  const formData = get(props.formData, field);
  // Also extract any global props
  const global = get(props.uiSchema, [UI_GLOBAL_OPTIONS]);
  const fieldUISchema = get(props.uiSchema, field);
  const { readonly: uiReadonly } = getUiOptions(fieldUISchema);
  // The expected props are the FORWARDED_PROPS, the field name, sub-schema, sub-uiSchema and sub-idSchema
  return {
    ...pick(props, FORWARDED_PROPS),
    ...otherProps,
    required,
    readonly: uiReadonly ?? readonly,
    options,
    formData,
    name: field,
    schema,
    uiSchema: {
      ...uiSchema,
      [UI_OPTIONS_KEY]: { ...global, ...otherUiProps }, // spread the global and other ui keys into the ui:options
      ...(global ? { [UI_GLOBAL_OPTIONS]: global } : {}), // ensure the globals are maintained
    },
    idSchema,
    errorSchema,
  };
}

describe('LayoutGridField', () => {
  function getProps(overrideProps: Partial<LayoutGridFieldProps> = {}): LayoutGridFieldProps {
    const {
      formData,
      schema = {},
      errorSchema = {},
      uiSchema = {},
      disabled = false,
      layoutGridSchema,
      registry = getTestRegistry(schema, REGISTRY_FIELDS, {}, {}, REGISTRY_FORM_CONTEXT),
    } = overrideProps;
    return {
      // required FieldProps stubbed
      autofocus: false,
      name: '',
      readonly: false,
      required: false,
      // end required FieldProps
      layoutGridSchema,
      disabled,
      formData,
      errorSchema,
      idSchema: schema ? registry.schemaUtils.toIdSchema(schema) : ID_SCHEMA,
      formContext: registry.formContext,
      registry,
      schema,
      uiSchema,
      onBlur: jest.fn(),
      onChange: jest.fn(),
      onFocus: jest.fn(),
    };
  }

  let registry: Registry;
  let retrieveSchemaSpy: jest.SpyInstance;
  let toIdSchemaSpy: jest.SpyInstance;
  let findSelectedOptionInXxxOf: jest.SpyInstance;
  beforeAll(() => {
    registry = getTestRegistry({}, REGISTRY_FIELDS, {}, {}, REGISTRY_FORM_CONTEXT);
  });
  describe('LayoutGridField.conditionMatches()', () => {
    test('returns false when no operator is passed', () => {
      expect(LayoutGridField.conditionMatches()).toBe(false);
    });
    test('returns false for ALL operator and values !== data, non-arrays', () => {
      expect(LayoutGridField.conditionMatches(Operators.ALL, '5', '6')).toBe(false);
    });
    test('returns false for ALL operator and values !== data, arrays', () => {
      expect(LayoutGridField.conditionMatches(Operators.ALL, ['5', '6'], ['6'])).toBe(false);
    });
    test('returns false for ALL operator and values !== data, mixed non-array and array', () => {
      expect(LayoutGridField.conditionMatches(Operators.ALL, ['5', '6'], '6')).toBe(false);
    });
    test('returns true for ALL operator and values === data, non-arrays', () => {
      expect(LayoutGridField.conditionMatches(Operators.ALL, '6', '6')).toBe(true);
    });
    test('returns true for ALL operator and values === data, arrays', () => {
      expect(LayoutGridField.conditionMatches(Operators.ALL, ['6', '7'], ['7', '6'])).toBe(true);
    });
    test('returns false for SOME operator and values !∩ data, non-arrays', () => {
      expect(LayoutGridField.conditionMatches(Operators.SOME, '6', '7')).toBe(false);
    });
    test('returns false for SOME operator and values !∩ data, arrays', () => {
      expect(LayoutGridField.conditionMatches(Operators.SOME, ['6'], ['7', '8'])).toBe(false);
    });
    test('returns true for SOME operator and values ∩ data, non-array', () => {
      expect(LayoutGridField.conditionMatches(Operators.SOME, '6', '6')).toBe(true);
    });
    test('returns true for SOME operator and values ∩ data, array', () => {
      expect(LayoutGridField.conditionMatches(Operators.SOME, ['6', '7'], ['6', '8'])).toBe(true);
    });
    test('returns true for SOME operator and values ∩ data, mixed non-array and array', () => {
      expect(LayoutGridField.conditionMatches(Operators.SOME, '6', ['6', '8'])).toBe(true);
    });
    test('returns false for NONE operator and values ∩ data, non-array', () => {
      expect(LayoutGridField.conditionMatches(Operators.NONE, '6', '6')).toBe(false);
    });
    test('returns false for NONE operator and values ∩ data, array', () => {
      expect(LayoutGridField.conditionMatches(Operators.NONE, ['6', '7'], ['6', '8'])).toBe(false);
    });
    test('returns false for NONE operator and values ∩ data, mixed non-array and array', () => {
      expect(LayoutGridField.conditionMatches(Operators.NONE, '6', ['6', '8'])).toBe(false);
    });
    test('returns true for NONE operator and values !∩ data, non-arrays', () => {
      expect(LayoutGridField.conditionMatches(Operators.NONE, '6', '7')).toBe(true);
    });
    test('returns true for NONE operator and values !∩ data, arrays', () => {
      expect(LayoutGridField.conditionMatches(Operators.NONE, ['6'], ['7', '8'])).toBe(true);
    });
  });
  describe('LayoutGridField.findChildrenAndProps()', () => {
    test('throws TypeError when children is not an array', () => {
      expect(() => LayoutGridField.findChildrenAndProps({}, GridType.ROW, registry)).toThrow(
        new TypeError('Expected array for "ui:row" in {}'),
      );
    });
    test('returns the children array and empty grid props for the row', () => {
      expect(LayoutGridField.findChildrenAndProps(TEST_LAYOUT_GRID_CHILDREN, GridType.ROW, registry)).toEqual({
        children: TEST_LAYOUT_GRID_CHILDREN[GridType.ROW],
        gridProps: {},
      });
    });
    test('returns the children array and looked up className in grid props for the column', () => {
      const expectedResult = {
        children: TEST_LAYOUT_GRID_CHILDREN[GridType.COLUMN].children,
        gridProps: { className: LOOKUP_MAP[TEST_LAYOUT_GRID_CHILDREN[GridType.COLUMN].className] },
      };
      expect(LayoutGridField.findChildrenAndProps(TEST_LAYOUT_GRID_CHILDREN, GridType.COLUMN, registry)).toEqual(
        expectedResult,
      );
    });
    test('returns the children array and expected looked up className values in grid props for the condition', () => {
      const classNames: string[] = TEST_LAYOUT_GRID_CHILDREN[GridType.CONDITION].className.split(' ');
      const className: string = classNames.map((ele: string) => LOOKUP_MAP[ele]).join(' ');
      const expectedResult = {
        children: TEST_LAYOUT_GRID_CHILDREN[GridType.CONDITION].children,
        gridProps: { ...omit(TEST_LAYOUT_GRID_CHILDREN[GridType.CONDITION], ['children']), className },
      };
      expect(LayoutGridField.findChildrenAndProps(TEST_LAYOUT_GRID_CHILDREN, GridType.CONDITION, registry)).toEqual(
        expectedResult,
      );
    });
  });
  describe('LayoutGridField.getIdSchema()', () => {
    test('deals with unspecified schema', () => {
      const { schemaUtils } = simpleOneOfRegistry;
      expect(LayoutGridField.getIdSchema(schemaUtils, ID_SCHEMA, {})).toEqual(ID_SCHEMA);
    });
  });
  describe('LayoutGridField.getSchemaDetailsForField(), blank schema', () => {
    beforeAll(() => {
      retrieveSchemaSpy = jest.spyOn(registry.schemaUtils, 'retrieveSchema');
      toIdSchemaSpy = jest.spyOn(registry.schemaUtils, 'toIdSchema');
      findSelectedOptionInXxxOf = jest.spyOn(registry.schemaUtils, 'findSelectedOptionInXxxOf');
    });
    afterEach(() => {
      findSelectedOptionInXxxOf.mockClear();
      retrieveSchemaSpy.mockClear();
      toIdSchemaSpy.mockClear();
    });
    afterAll(() => {
      retrieveSchemaSpy.mockRestore();
      toIdSchemaSpy.mockRestore();
    });
    test('returns no schema or options when name is empty string', () => {
      expect(LayoutGridField.getSchemaDetailsForField(registry.schemaUtils, '', {}, {}, ID_SCHEMA)).toEqual(
        NO_SCHEMA_OR_OPTIONS,
      );
      expect(retrieveSchemaSpy).toHaveBeenCalledTimes(1);
      expect(toIdSchemaSpy).not.toHaveBeenCalled();
    });
    test('returns no schema or options when schema is empty', () => {
      expect(LayoutGridField.getSchemaDetailsForField(registry.schemaUtils, 'name', {}, {}, ID_SCHEMA)).toEqual(
        NO_SCHEMA_OR_OPTIONS,
      );
      expect(retrieveSchemaSpy).toHaveBeenCalledTimes(1);
      expect(toIdSchemaSpy).not.toHaveBeenCalled();
    });
  });
  describe('LayoutGridField.getSchemaDetailsForField(), sampleSchema', () => {
    beforeAll(() => {
      retrieveSchemaSpy = jest.spyOn(sampleSchemaRegistry.schemaUtils, 'retrieveSchema');
      toIdSchemaSpy = jest.spyOn(sampleSchemaRegistry.schemaUtils, 'toIdSchema');
      findSelectedOptionInXxxOf = jest.spyOn(sampleSchemaRegistry.schemaUtils, 'findSelectedOptionInXxxOf');
    });
    afterEach(() => {
      findSelectedOptionInXxxOf.mockClear();
      retrieveSchemaSpy.mockClear();
      toIdSchemaSpy.mockClear();
    });
    afterAll(() => {
      retrieveSchemaSpy.mockRestore();
      toIdSchemaSpy.mockRestore();
    });
    test('returns no schema or options when schema is missing the leaf field', () => {
      expect(
        LayoutGridField.getSchemaDetailsForField(
          sampleSchemaRegistry.schemaUtils,
          'path.is.bad', // Need two bad paths, plus a bad leaf for test coverage
          SAMPLE_SCHEMA,
          {},
          SAMPLE_SCHEMA_ID_SCHEMA,
        ),
      ).toEqual({ ...NO_SCHEMA_OR_OPTIONS, idSchema: {} }); // `path` digs into `idSchema`
      expect(retrieveSchemaSpy).toHaveBeenCalledTimes(3);
      expect(toIdSchemaSpy).not.toHaveBeenCalled();
    });
    test('returns no schema or options when leaf field is not found in the schema', () => {
      expect(
        LayoutGridField.getSchemaDetailsForField(
          sampleSchemaRegistry.schemaUtils,
          'ignored',
          SAMPLE_SCHEMA,
          {},
          SAMPLE_SCHEMA_ID_SCHEMA,
        ),
      ).toEqual({ ...NO_SCHEMA_OR_OPTIONS, idSchema: {} }); // `path` digs into `idSchema`
      expect(retrieveSchemaSpy).toHaveBeenCalledTimes(1);
      expect(toIdSchemaSpy).not.toHaveBeenCalled();
    });
    test('returns schema, isRequired: true, isReadonly: undefined, options: undefined, and idSchema when simple schema is used', () => {
      const path = 'ranges';
      const schema = retrieveSchema(
        validator,
        get(SAMPLE_SCHEMA, [PROPERTIES_KEY, path]) as RJSFSchema,
        SAMPLE_SCHEMA,
        {},
      );
      expect(
        LayoutGridField.getSchemaDetailsForField(
          sampleSchemaRegistry.schemaUtils,
          path,
          SAMPLE_SCHEMA,
          {},
          SAMPLE_SCHEMA_ID_SCHEMA,
        ),
      ).toEqual({
        schema,
        isRequired: true,
        isReadonly: undefined,
        optionsInfo: undefined,
        idSchema: get(SAMPLE_SCHEMA_ID_SCHEMA, path),
      });
      expect(retrieveSchemaSpy).toHaveBeenCalledTimes(2);
      expect(toIdSchemaSpy).not.toHaveBeenCalled();
    });
  });
  describe('LayoutGridField.getSchemaDetailsForField(), simpleOneOfSchema', () => {
    beforeAll(() => {
      retrieveSchemaSpy = jest.spyOn(simpleOneOfRegistry.schemaUtils, 'retrieveSchema');
      toIdSchemaSpy = jest.spyOn(simpleOneOfRegistry.schemaUtils, 'toIdSchema');
      findSelectedOptionInXxxOf = jest.spyOn(simpleOneOfRegistry.schemaUtils, 'findSelectedOptionInXxxOf');
    });
    afterEach(() => {
      findSelectedOptionInXxxOf.mockClear();
      retrieveSchemaSpy.mockClear();
      toIdSchemaSpy.mockClear();
    });
    afterAll(() => {
      retrieveSchemaSpy.mockRestore();
      toIdSchemaSpy.mockRestore();
    });
    test('returns schema, isRequired: false, isReadonly: true, options: undefined when oneOf schema is used, passed idSeparator', () => {
      const path = get(SIMPLE_ONEOF, DISCRIMINATOR_PATH);
      const selectedSchema = get(SIMPLE_ONEOF, [ONE_OF_KEY, 1]);
      const schema = get(selectedSchema, [PROPERTIES_KEY, path]);
      const initialIdSchema = toIdSchema(validator, SIMPLE_ONEOF, null, SIMPLE_ONEOF);
      const formData = { [path]: SIMPLE_ONEOF_OPTIONS[1].value };
      const idSeparator = '~';
      expect(
        LayoutGridField.getSchemaDetailsForField(
          simpleOneOfRegistry.schemaUtils,
          path,
          SIMPLE_ONEOF,
          formData,
          initialIdSchema,
          idSeparator,
        ),
      ).toEqual({
        schema,
        isRequired: false,
        isReadonly: true,
        optionsInfo: undefined,
        idSchema: testGetIdSchema(path, idSeparator),
      });
      expect(findSelectedOptionInXxxOf).toHaveBeenCalledWith(SIMPLE_ONEOF, path, ONE_OF_KEY, formData);
      expect(toIdSchemaSpy).toHaveBeenCalledWith(
        selectedSchema,
        initialIdSchema[ID_KEY],
        formData,
        initialIdSchema[ID_KEY],
        idSeparator,
      );
    });
  });
  describe('LayoutGridField.getSchemaDetailsForField(), gridFormSchema', () => {
    beforeAll(() => {
      retrieveSchemaSpy = jest.spyOn(gridFormSchemaRegistry.schemaUtils, 'retrieveSchema');
      toIdSchemaSpy = jest.spyOn(gridFormSchemaRegistry.schemaUtils, 'toIdSchema');
      findSelectedOptionInXxxOf = jest.spyOn(gridFormSchemaRegistry.schemaUtils, 'findSelectedOptionInXxxOf');
    });
    afterEach(() => {
      findSelectedOptionInXxxOf.mockClear();
      retrieveSchemaSpy.mockClear();
      toIdSchemaSpy.mockClear();
    });
    afterAll(() => {
      retrieveSchemaSpy.mockRestore();
      toIdSchemaSpy.mockRestore();
    });
    test('returns schema, isRequired: true, isReadonly: undefined, options when oneOf schema is requested', () => {
      const path = 'employment';
      const { field: schema } = gridFormSchemaRegistry.schemaUtils.findFieldInSchema(GRID_FORM_SCHEMA, path);
      retrieveSchemaSpy.mockClear();
      expect(
        LayoutGridField.getSchemaDetailsForField(
          gridFormSchemaRegistry.schemaUtils,
          path,
          GRID_FORM_SCHEMA,
          {},
          GRID_FORM_ID_SCHEMA,
        ),
      ).toEqual({
        schema,
        isRequired: false,
        isReadonly: undefined,
        idSchema: testGetIdSchema(path),
        optionsInfo: { options: get(schema, [ONE_OF_KEY]), hasDiscriminator: true },
      });
      expect(retrieveSchemaSpy).toHaveBeenCalledTimes(2);
      expect(toIdSchemaSpy).not.toHaveBeenCalled();
    });
    test('returns schema, isRequired: true, isReadonly: undefined, options: undefined when drilling through oneOf schema to prop', () => {
      const path = 'employment.location.state';
      const formData = { employment: { job_type: 'company' } };
      const schema: RJSFSchema = gridFormSchemaRegistry.schemaUtils.getFromSchema(
        GRID_FORM_SCHEMA,
        [DEFINITIONS_KEY, 'Location', PROPERTIES_KEY, 'state'],
        {},
      );
      expect(
        LayoutGridField.getSchemaDetailsForField(
          gridFormSchemaRegistry.schemaUtils,
          path,
          GRID_FORM_SCHEMA,
          formData,
          GRID_FORM_ID_SCHEMA,
        ),
      ).toEqual({
        schema,
        isRequired: true,
        isReadonly: undefined,
        optionsInfo: undefined,
        idSchema: testGetIdSchema(path),
      });
      const subschemaSchema = gridFormSchemaRegistry.schemaUtils.getFromSchema(
        GRID_FORM_SCHEMA,
        [PROPERTIES_KEY, 'employment'],
        {},
      );
      expect(findSelectedOptionInXxxOf).toHaveBeenCalledWith(
        subschemaSchema,
        path.split('.')[1],
        ONE_OF_KEY,
        formData.employment,
      );
      expect(toIdSchemaSpy).toHaveBeenCalledTimes(1);
    });
  });
  describe('LayoutGridField.getSchemaDetailsForField(), readonlySchema', () => {
    beforeAll(() => {
      retrieveSchemaSpy = jest.spyOn(gridFormSchemaRegistry.schemaUtils, 'retrieveSchema');
      toIdSchemaSpy = jest.spyOn(gridFormSchemaRegistry.schemaUtils, 'toIdSchema');
      findSelectedOptionInXxxOf = jest.spyOn(gridFormSchemaRegistry.schemaUtils, 'findSelectedOptionInXxxOf');
    });
    afterEach(() => {
      findSelectedOptionInXxxOf.mockClear();
      retrieveSchemaSpy.mockClear();
      toIdSchemaSpy.mockClear();
    });
    afterAll(() => {
      retrieveSchemaSpy.mockRestore();
      toIdSchemaSpy.mockRestore();
    });
    test('returns schema, isRequired: false, isReadonly: undefined, options when oneOf schema is requested', () => {
      const path = 'stringSelect';
      const { field: schema } = readonlySchemaRegistry.schemaUtils.findFieldInSchema(readonlySchema, path);
      retrieveSchemaSpy.mockClear();
      expect(
        LayoutGridField.getSchemaDetailsForField(
          readonlySchemaRegistry.schemaUtils,
          path,
          readonlySchema,
          {},
          READONLY_ID_SCHEMA,
        ),
      ).toEqual({
        schema,
        isRequired: false,
        isReadonly: undefined,
        idSchema: testGetIdSchema(path),
        optionsInfo: { options: get(schema, [ONE_OF_KEY]), hasDiscriminator: false },
      });
      expect(retrieveSchemaSpy).not.toHaveBeenCalled();
      expect(toIdSchemaSpy).not.toHaveBeenCalled();
    });
    test('returns schema, isRequired: true, isReadonly: true, options: undefined when selecting readonly field', () => {
      const path = 'roString';
      const schema = readonlySchema.properties![path];
      expect(
        LayoutGridField.getSchemaDetailsForField(
          readonlySchemaRegistry.schemaUtils,
          path,
          readonlySchema,
          {},
          READONLY_ID_SCHEMA,
        ),
      ).toEqual({
        schema,
        isRequired: false,
        isReadonly: true,
        idSchema: testGetIdSchema(path),
        optionsInfo: undefined,
      });
      expect(retrieveSchemaSpy).not.toHaveBeenCalled();
      expect(toIdSchemaSpy).not.toHaveBeenCalled();
    });
    test('returns schema, isRequired: true, isReadonly: true, options: undefined when selecting field on readonly parent', () => {
      const path = 'nested.roNumber';
      const schema = get(readonlySchema, [PROPERTIES_KEY, 'nested', PROPERTIES_KEY, 'roNumber']);
      expect(
        LayoutGridField.getSchemaDetailsForField(
          readonlySchemaRegistry.schemaUtils,
          path,
          readonlySchema,
          {},
          READONLY_ID_SCHEMA,
        ),
      ).toEqual({
        schema,
        isRequired: false,
        isReadonly: true,
        idSchema: testGetIdSchema(path),
        optionsInfo: undefined,
      });
      expect(retrieveSchemaSpy).not.toHaveBeenCalled();
      expect(toIdSchemaSpy).not.toHaveBeenCalled();
    });
    test('returns schema, isRequired: true, isReadonly: false, options: undefined when selecting explicitly readonly false field', () => {
      const path = 'nested.number';
      const { field: schema } = readonlySchemaRegistry.schemaUtils.findFieldInSchema(readonlySchema, path);
      retrieveSchemaSpy.mockClear();
      expect(
        LayoutGridField.getSchemaDetailsForField(
          readonlySchemaRegistry.schemaUtils,
          path,
          readonlySchema,
          {},
          READONLY_ID_SCHEMA,
        ),
      ).toEqual({
        schema,
        isRequired: true,
        isReadonly: false,
        idSchema: testGetIdSchema(path),
        optionsInfo: undefined,
      });
      expect(retrieveSchemaSpy).not.toHaveBeenCalled();
      expect(toIdSchemaSpy).not.toHaveBeenCalled();
    });
  });
  describe('LayoutGridField.getCustomRenderComponent()', () => {
    test('returns null when render is not a string or function', () => {
      expect(LayoutGridField.getCustomRenderComponent({} as string, registry)).toBeNull();
    });
    test('returns null when render is a string without a lookup', () => {
      expect(LayoutGridField.getCustomRenderComponent('nonexistant', registry)).toBeNull();
    });
    test('returns the render function when render is a string with a lookup', () => {
      expect(LayoutGridField.getCustomRenderComponent('TestRenderer', registry)).toBe(TestRenderer);
    });
    test('returns the given function when render is a function', () => {
      expect(LayoutGridField.getCustomRenderComponent(TestRenderer, registry)).toBe(TestRenderer);
    });
  });
  describe('LayoutGridField.computeFieldUiSchema()', () => {
    test('field with empty uiProps', () => {
      const uiProps = {};
      expect(LayoutGridField.computeFieldUiSchema('foo', uiProps)).toEqual({
        fieldUiSchema: uiProps,
        uiReadonly: undefined,
      });
    });
    test('field with non-empty uiProps', () => {
      const uiProps = { fullWidth: true };
      expect(LayoutGridField.computeFieldUiSchema('foo', uiProps)).toEqual({
        fieldUiSchema: { [UI_OPTIONS_KEY]: uiProps },
        uiReadonly: undefined,
      });
    });
    test('field with empty uiProps, ui:options and uiSchema for the field', () => {
      const uiProps = {};
      const uiOptions = { classNames: 'baz' };
      const uiSchema = { foo: { 'ui:widget': 'bar', [UI_OPTIONS_KEY]: uiOptions } };
      expect(LayoutGridField.computeFieldUiSchema('foo', uiProps, uiSchema)).toEqual({
        fieldUiSchema: { ...uiSchema.foo, [UI_OPTIONS_KEY]: uiOptions },
        uiReadonly: undefined,
      });
    });
    test('field with uiProps and uiSchema with global options for the field', () => {
      const uiProps = { fullWidth: true };
      const globalOptions = { label: false };
      const uiSchema = { foo: { 'ui:widget': 'bar' }, [UI_GLOBAL_OPTIONS]: globalOptions };
      expect(LayoutGridField.computeFieldUiSchema('foo', uiProps, uiSchema)).toEqual({
        fieldUiSchema: {
          ...uiSchema.foo,
          [UI_OPTIONS_KEY]: { ...uiProps, ...globalOptions },
          [UI_GLOBAL_OPTIONS]: globalOptions,
        },
        uiReadonly: undefined,
      });
    });
    test('field with empty uiProps, uiSchema for the field and schemaReadonly true', () => {
      const uiSchema = { foo: { 'ui:widget': 'bar' } };
      expect(LayoutGridField.computeFieldUiSchema('foo', {}, uiSchema, true)).toEqual({
        fieldUiSchema: {
          ...uiSchema.foo,
          'ui:readonly': true,
        },
        uiReadonly: true,
      });
    });
    test('field with empty uiProps, uiSchema having readonly false in ui:options for the field and schemaReadonly true', () => {
      const uiOptions = { readonly: false };
      const uiSchema = { foo: { 'ui:widget': 'bar', [UI_OPTIONS_KEY]: uiOptions } };
      expect(LayoutGridField.computeFieldUiSchema('foo', {}, uiSchema, true)).toEqual({
        fieldUiSchema: {
          ...uiSchema.foo,
          [UI_OPTIONS_KEY]: { readonly: false },
        },
        uiReadonly: false,
      });
    });
    test('field with empty uiProps, uiSchema for the field and schemaReadonly false and forceReadonly true', () => {
      const uiSchema = { foo: { 'ui:widget': 'bar' } };
      expect(LayoutGridField.computeFieldUiSchema('foo', {}, uiSchema, false, true)).toEqual({
        fieldUiSchema: {
          ...uiSchema.foo,
          'ui:readonly': true,
        },
        uiReadonly: true,
      });
    });
    test('field with empty uiProps, uiSchema having readonly false in ui:options for the field and schemaReadonly unspecified and forceReadonly true', () => {
      const uiOptions = { readonly: false };
      const uiSchema = { foo: { 'ui:widget': 'bar', [UI_OPTIONS_KEY]: uiOptions } };
      expect(LayoutGridField.computeFieldUiSchema('foo', {}, uiSchema, undefined, true)).toEqual({
        fieldUiSchema: {
          ...uiSchema.foo,
          [UI_OPTIONS_KEY]: { readonly: true },
        },
        uiReadonly: true,
      });
    });
  });
  describe('LayoutGridField.computeUIComponentPropsFromGridSchema()', () => {
    test('gridSchema is undefined', () => {
      expect(LayoutGridField.computeUIComponentPropsFromGridSchema(registry)).toEqual({
        name: '',
        uiProps: {},
        UIComponent: null,
      });
    });
    test('gridSchema is a string', () => {
      expect(LayoutGridField.computeUIComponentPropsFromGridSchema(registry, 'foo')).toEqual({
        name: 'foo',
        uiProps: {},
        UIComponent: null,
      });
    });
    test('gridSchema contains name and looked up placeholder', () => {
      const gridSchema = { name: 'foo', placeholder: '$lookup=PlaceholderText' };
      expect(LayoutGridField.computeUIComponentPropsFromGridSchema(registry, gridSchema)).toEqual({
        name: 'foo',
        uiProps: {
          placeholder: LOOKUP_MAP.PlaceholderText,
        },
        UIComponent: null,
      });
    });
    test('gridSchema contains name, other props and a render', () => {
      const gridSchema = { name: 'foo', fullWidth: true, render: TestRenderer };
      expect(LayoutGridField.computeUIComponentPropsFromGridSchema(registry, gridSchema)).toEqual({
        name: 'foo',
        uiProps: {
          fullWidth: true,
        },
        UIComponent: TestRenderer,
      });
    });
    test('gridSchema contains name, other props and a render', () => {
      const gridSchema = { fullWidth: true, render: TestRenderer };
      expect(LayoutGridField.computeUIComponentPropsFromGridSchema(registry, gridSchema)).toEqual({
        uiProps: {
          fullWidth: true,
        },
        UIComponent: TestRenderer,
        // @ts-expect-error TS2740 because it is missing all of the FieldProps, which we don't need
        rendered: <TestRenderer data-testid={LayoutGridField.TEST_IDS.uiComponent} fullWidth />,
      });
    });
  });
  test('renders nothing when there is no uiSchema', () => {
    const props = getProps();
    render(<LayoutGridField {...props} />);

    // Check for all the possible things rendered by the grid
    const uiComponent = screen.queryByTestId(LayoutGridField.TEST_IDS.uiComponent);
    const field = screen.queryByTestId(LayoutGridField.TEST_IDS.field);
    const layoutMultiSchemaField = screen.queryByTestId(LayoutGridField.TEST_IDS.layoutMultiSchemaField);
    const row = screen.queryByTestId(LayoutGridField.TEST_IDS.uiComponent);
    const col = screen.queryByTestId(LayoutGridField.TEST_IDS.uiComponent);

    // and find none of them
    expect(uiComponent).not.toBeInTheDocument();
    expect(field).not.toBeInTheDocument();
    expect(layoutMultiSchemaField).not.toBeInTheDocument();
    expect(row).not.toBeInTheDocument();
    expect(col).not.toBeInTheDocument();
  });
  test('renderField with render=TestRenderer via LAYOUT_GRID_OPTION', () => {
    const options = { name: 'foo', myProp: true };
    const props = getProps({
      uiSchema: {
        [LAYOUT_GRID_OPTION]: { ...options, render: TestRenderer },
      },
    });
    render(<LayoutGridField {...props} />);
    // The props readonly flag is transformed to readOnly
    const expectedProps = { ...props, ...options, readOnly: props.readonly, readonly: undefined };
    // Renders the uiComponent with the props and options forwarded
    const uiComponent = screen.getByTestId(LayoutGridField.TEST_IDS.uiComponent);
    expect(uiComponent).toHaveTextContent(stringifyProps(expectedProps));
  });
  test('renderField with render=TestRenderer via LAYOUT_GRID_OPTION and name is not provided', () => {
    const options = { myProp: true };
    const props = getProps({
      uiSchema: {
        [LAYOUT_GRID_OPTION]: { ...options, render: TestRenderer },
      },
    });
    render(<LayoutGridField {...props} />);
    // Renders the uiComponent with only the options forwarded
    const uiComponent = screen.getByTestId(LayoutGridField.TEST_IDS.uiComponent);
    expect(uiComponent).toHaveTextContent(stringifyProps(options));
  });
  test('renderField via name explicit layoutGridSchema', async () => {
    const fieldName = 'simpleString';
    const props = getProps({
      schema: SAMPLE_SCHEMA,
      uiSchema: sampleUISchema,
      layoutGridSchema: fieldName,
      idSeparator: '.',
      registry: sampleSchemaRegistry,
    });
    const fieldId = get(props.idSchema, [fieldName, ID_KEY]);
    render(<LayoutGridField {...props} />);
    // Renders a field
    const field = screen.getByTestId(LayoutGridField.TEST_IDS.field);
    expect(field).toHaveTextContent(stringifyProps(getExpectedPropsForField(props, fieldName)));
    // Test onChange, onFocus, onBlur
    const input = within(field).getByRole('textbox');
    // Click on the input to cause the focus
    await userEvent.click(input);
    expect(props.onFocus).toHaveBeenCalledWith(fieldId, '');
    // Type to trigger the onChange
    await userEvent.type(input, 'foo');
    expect(props.onChange).toHaveBeenCalledWith({ [fieldName]: 'foo' }, props.errorSchema, fieldId);
    // Tab out of the input field to cause the blur
    await userEvent.tab();
    expect(props.onBlur).toHaveBeenCalledWith(fieldId, 'foo');
  });
  test('renderField via object explicit layoutGridSchema, otherProps', () => {
    const fieldName = 'employment';
    const globalUiOptions = { propToApplyToAllFields: 'foobar' };
    const otherProps = { hideError: true, name: 'value will be overridden by name from layoutGridSchema' };
    const otherUIProps = { inline: true };
    const props = getProps({
      schema: GRID_FORM_SCHEMA,
      uiSchema: { ...gridFormUISchema, [UI_GLOBAL_OPTIONS]: globalUiOptions },
      formData: {},
      errorSchema: { employment: {} },
      // IdSchema is weirdly recursive and it's easier to just ignore the error
      idSchema: { [ID_KEY]: 'root', employment: { [ID_KEY]: 'employment' } },
      idSeparator: '.',
      layoutGridSchema: {
        name: fieldName,
        ...otherUIProps,
      },
      registry: gridFormSchemaRegistry,
    });
    render(<LayoutGridField {...props} {...otherProps} />);
    const field = screen.getByTestId(LayoutGridField.TEST_IDS.layoutMultiSchemaField);
    expect(field).toHaveTextContent(
      stringifyProps(getExpectedPropsForField(props, fieldName, otherProps, otherUIProps)),
    );
  });
  test('renderField via object explicit readonlySchema, and uiSchema readonly override', () => {
    const fieldName = 'string';
    const props = getProps({
      schema: readonlySchema,
      uiSchema: readonlyUISchema,
      formData: {},
      errorSchema: { string: {} },
      // IdSchema is weirdly recursive and it's easier to just ignore the error
      idSchema: { [ID_KEY]: 'root', string: { [ID_KEY]: 'string' } },
      idSeparator: '.',
      layoutGridSchema: {
        name: fieldName,
      },
      registry: readonlySchemaRegistry,
    });
    render(<LayoutGridField {...props} />);
    const field = screen.getByTestId(LayoutGridField.TEST_IDS.field);
    expect(field).toHaveTextContent(stringifyProps(getExpectedPropsForField(props, fieldName)));
  });
  test('renderRow not nested', () => {
    const gridProps = { spacing: 2 };
    const props = getProps({
      schema: SAMPLE_SCHEMA,
      uiSchema: sampleUISchema,
      formData: {},
      layoutGridSchema: { [GridType.ROW]: { ...gridProps, children: GRID_CHILDREN } },
      registry: sampleSchemaRegistry,
    });
    render(<LayoutGridField {...props} />);
    // Renders an outer grid row
    const row = screen.getByTestId(LayoutGridField.TEST_IDS.row);
    expect(row).toBeInTheDocument();
    // Renders 2 fields in the row
    const fields = within(row).getAllByTestId(LayoutGridField.TEST_IDS.field);
    expect(fields).toHaveLength(GRID_CHILDREN.length);
    // First field as the first child
    expect(fields[0]).toHaveTextContent(stringifyProps(getExpectedPropsForField(props, GRID_CHILDREN[0])));
    // Second field as the second child
    expect(fields[1]).toHaveTextContent(stringifyProps(getExpectedPropsForField(props, GRID_CHILDREN[1])));
  });
  test('renderRow nested', () => {
    const props = getProps({
      schema: SAMPLE_SCHEMA,
      uiSchema: sampleUISchema,
      formData: {},
      layoutGridSchema: { [GridType.ROW]: { className: ColumnWidth6, children: GRID_CHILDREN } },
      isNested: true,
      registry: sampleSchemaRegistry,
    });
    render(<LayoutGridField {...props} />);
    // Renders an outer grid row item with width 6
    const row = screen.getByTestId(LayoutGridField.TEST_IDS.row);
    expect(row).toHaveClass(ColumnWidth6);
    // Renders 2 fields in the row
    const fields = within(row).getAllByTestId(LayoutGridField.TEST_IDS.field);
    expect(fields).toHaveLength(GRID_CHILDREN.length);
    // First field as the first child
    expect(fields[0]).toHaveTextContent(stringifyProps(getExpectedPropsForField(props, GRID_CHILDREN[0])));
    // Second field as the second child
    expect(fields[1]).toHaveTextContent(stringifyProps(getExpectedPropsForField(props, GRID_CHILDREN[1])));
  });
  test('renderCol', () => {
    const props = getProps({
      schema: SAMPLE_SCHEMA,
      uiSchema: sampleUISchema,
      formData: {},
      layoutGridSchema: { [GridType.COLUMN]: { className: ColumnWidth6, children: GRID_CHILDREN } },
      registry: sampleSchemaRegistry,
    });
    render(<LayoutGridField {...props} />);
    // Renders an outer grid item with width 6, but not a row
    const col = screen.getByTestId(LayoutGridField.TEST_IDS.col);
    expect(col).toHaveClass(ColumnWidth6);
    // Renders 2 fields in the column
    const fields = within(col).getAllByTestId(LayoutGridField.TEST_IDS.field);
    expect(fields).toHaveLength(GRID_CHILDREN.length);
    // First field as the first child
    expect(fields[0]).toHaveTextContent(stringifyProps(getExpectedPropsForField(props, GRID_CHILDREN[0])));
    // Second field as the second child
    expect(fields[1]).toHaveTextContent(stringifyProps(getExpectedPropsForField(props, GRID_CHILDREN[1])));
  });
  test('renderColumns', () => {
    const props = getProps({
      schema: SAMPLE_SCHEMA,
      uiSchema: sampleUISchema,
      formData: {},
      layoutGridSchema: { [GridType.COLUMNS]: { className: ColumnWidth6, children: GRID_CHILDREN } },
      registry: sampleSchemaRegistry,
    });
    render(<LayoutGridField {...props} />);
    // Renders two outer columns
    const cols = screen.getAllByTestId(LayoutGridField.TEST_IDS.col);
    expect(cols).toHaveLength(GRID_CHILDREN.length);
    // First column is a grid item with width 6
    expect(cols[0]).toHaveClass(ColumnWidth6);
    // Renders first field in the first column
    let field = within(cols[0]).getByTestId(LayoutGridField.TEST_IDS.field);
    expect(field).toHaveTextContent(stringifyProps(getExpectedPropsForField(props, GRID_CHILDREN[0])));
    // First column is a grid item with 6
    expect(cols[1]).toHaveClass(ColumnWidth6);
    // Renders second field in the second column
    field = within(cols[1]).getByTestId(LayoutGridField.TEST_IDS.field);
    expect(field).toHaveTextContent(stringifyProps(getExpectedPropsForField(props, GRID_CHILDREN[1])));
  });
  test('renderCondition, condition passes, field and empty value, NONE operator, has formData', async () => {
    const fieldName = 'simpleString';
    const gridProps = { operator: Operators.NONE, field: fieldName, value: null };
    const props = getProps({
      schema: SAMPLE_SCHEMA,
      uiSchema: { ...sampleUISchema, [UI_GLOBAL_OPTIONS]: { always: 'there' } },
      formData: { [fieldName]: 'foo' },
      layoutGridSchema: { [GridType.CONDITION]: { ...gridProps, children: GRID_CHILDREN } },
      registry: sampleSchemaRegistry,
    });
    const fieldId = get(props.idSchema, [fieldName, ID_KEY]);
    render(<LayoutGridField {...props} />);
    // Renders 2 fields
    const fields = screen.getAllByTestId(LayoutGridField.TEST_IDS.field);
    expect(fields).toHaveLength(GRID_CHILDREN.length);
    // First field as the first child
    expect(fields[0]).toHaveTextContent(stringifyProps(getExpectedPropsForField(props, GRID_CHILDREN[0])));
    // Second field as the second child
    expect(fields[1]).toHaveTextContent(stringifyProps(getExpectedPropsForField(props, GRID_CHILDREN[1])));
    // Test onChange and value in the input
    const input = within(fields[0]).getByRole('textbox');
    expect(input).toHaveValue(props.formData[fieldName]);
    await userEvent.type(input, '!');
    const expectedErrors = new ErrorSchemaBuilder().addErrors(ERRORS, fieldName).ErrorSchema;
    expect(props.onChange).toHaveBeenCalledWith({ [fieldName]: 'foo!' }, expectedErrors, fieldId);
  });
  test('renderCondition, condition fails, field and null value, NONE operator, no data', () => {
    const gridProps = { operator: Operators.NONE, field: 'simpleString', value: null };
    const props = getProps({
      schema: SAMPLE_SCHEMA,
      uiSchema: sampleUISchema,
      layoutGridSchema: { [GridType.CONDITION]: { ...gridProps, children: GRID_CHILDREN } },
      registry: sampleSchemaRegistry,
    });
    render(<LayoutGridField {...props} />);
    // Check for all the possible things rendered by the grid
    const uiComponent = screen.queryByTestId(LayoutGridField.TEST_IDS.uiComponent);
    const field = screen.queryByTestId(LayoutGridField.TEST_IDS.field);
    const layoutMultiSchemaField = screen.queryByTestId(LayoutGridField.TEST_IDS.layoutMultiSchemaField);
    const row = screen.queryByTestId(LayoutGridField.TEST_IDS.uiComponent);
    const col = screen.queryByTestId(LayoutGridField.TEST_IDS.uiComponent);
    // and find none of them
    expect(uiComponent).not.toBeInTheDocument();
    expect(field).not.toBeInTheDocument();
    expect(layoutMultiSchemaField).not.toBeInTheDocument();
    expect(row).not.toBeInTheDocument();
    expect(col).not.toBeInTheDocument();
  });
  test('renderCondition, condition fails, no field or value specified', () => {
    const gridProps = { operator: Operators.ALL };
    const props = getProps({
      schema: SAMPLE_SCHEMA,
      uiSchema: sampleUISchema,
      layoutGridSchema: { [GridType.CONDITION]: { ...gridProps, children: GRID_CHILDREN } },
      registry: sampleSchemaRegistry,
    });
    render(<LayoutGridField {...props} />);
    // Check for all the possible things rendered by the grid
    const uiComponent = screen.queryByTestId(LayoutGridField.TEST_IDS.uiComponent);
    const field = screen.queryByTestId(LayoutGridField.TEST_IDS.field);
    const layoutMultiSchemaField = screen.queryByTestId(LayoutGridField.TEST_IDS.layoutMultiSchemaField);
    const row = screen.queryByTestId(LayoutGridField.TEST_IDS.uiComponent);
    const col = screen.queryByTestId(LayoutGridField.TEST_IDS.uiComponent);
    // and find none of them
    expect(uiComponent).not.toBeInTheDocument();
    expect(field).not.toBeInTheDocument();
    expect(layoutMultiSchemaField).not.toBeInTheDocument();
    expect(row).not.toBeInTheDocument();
    expect(col).not.toBeInTheDocument();
  });
});
