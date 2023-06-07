import { schemaParser } from '../../src';
import {
  PROPERTY_DEPENDENCIES,
  RECURSIVE_REF,
  RECURSIVE_REF_ALLOF,
  SCHEMA_DEPENDENCIES,
  SCHEMA_WITH_ALLOF_CANNOT_MERGE,
  SCHEMA_AND_ONEOF_REF_DEPENDENCIES,
  SCHEMA_AND_REQUIRED_DEPENDENCIES,
  SCHEMA_WITH_ARRAY_CONDITION,
  SCHEMA_WITH_ONEOF_NESTED_DEPENDENCIES,
  SCHEMA_WITH_SINGLE_CONDITION,
  SCHEMA_WITH_MULTIPLE_CONDITIONS,
  SCHEMA_WITH_NESTED_CONDITIONS,
  SUPER_SCHEMA,
} from '../testUtils/testData';

describe('schemaParser()', () => {
  it('parses property dependencies properly', () => {
    const schemaMap = schemaParser(PROPERTY_DEPENDENCIES);
    expect(schemaMap).toMatchSnapshot();
  });
  it('parses recursive refs properly', () => {
    const schemaMap = schemaParser(RECURSIVE_REF);
    expect(schemaMap).toMatchSnapshot();
  });
  it('parses recursive refs in allOf properly', () => {
    const schemaMap = schemaParser(RECURSIVE_REF_ALLOF);
    expect(schemaMap).toMatchSnapshot();
  });
  it('parses schema dependencies properly', () => {
    const schemaMap = schemaParser(SCHEMA_DEPENDENCIES);
    expect(schemaMap).toMatchSnapshot();
  });
  it('parses schema dependencies with one of and refs properly', () => {
    const schemaMap = schemaParser(SCHEMA_AND_ONEOF_REF_DEPENDENCIES);
    expect(schemaMap).toMatchSnapshot();
  });
  it('parses schema and required dependencies properly', () => {
    const schemaMap = schemaParser(SCHEMA_AND_REQUIRED_DEPENDENCIES);
    expect(schemaMap).toMatchSnapshot();
  });
  it('parses schema with oneof and nested dependencies', () => {
    const schemaMap = schemaParser(SCHEMA_WITH_ONEOF_NESTED_DEPENDENCIES);
    expect(schemaMap).toMatchSnapshot();
  });
  it('parses schema with a single condition', () => {
    const schemaMap = schemaParser(SCHEMA_WITH_SINGLE_CONDITION);
    expect(schemaMap).toMatchSnapshot();
  });
  it('parses schema with multiple conditions', () => {
    const schemaMap = schemaParser(SCHEMA_WITH_MULTIPLE_CONDITIONS);
    expect(schemaMap).toMatchSnapshot();
  });
  it('parses schema with nested conditions', () => {
    const schemaMap = schemaParser(SCHEMA_WITH_NESTED_CONDITIONS);
    expect(schemaMap).toMatchSnapshot();
  });
  it('parses superSchema properly', () => {
    const schemaMap = schemaParser(SUPER_SCHEMA);
    expect(schemaMap).toMatchSnapshot();
  });
  it('parse schema with array condition', () => {
    const schemaMap = schemaParser(SCHEMA_WITH_ARRAY_CONDITION);
    expect(schemaMap).toMatchSnapshot();
  });
  it('parse schema with allof not able to merge', () => {
    const schemaMap = schemaParser(SCHEMA_WITH_ALLOF_CANNOT_MERGE);
    expect(schemaMap).toMatchSnapshot();
  });
});
