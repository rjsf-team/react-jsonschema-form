// The test world has access to the test suite via the direct import from the utils package
import {
  getDefaultFormStateTest,
  getDisplayLabelTest,
  getClosestMatchingOptionTest,
  getFirstMatchingOptionTest,
  isFilesArrayTest,
  isMultiSelectTest,
  isSelectTest,
  mergeValidationDataTest,
  retrieveSchemaTest,
  sanitizeDataForNewSchemaTest,
  toIdSchemaTest,
  toPathSchemaTest,
} from '../../../utils/test/schema';
import getTestValidator from './getTestValidator';

const testValidator = getTestValidator({});

// NOTE: to restrict which tests to run, you can temporarily comment out any tests you aren't needing
getDefaultFormStateTest(testValidator);
getDisplayLabelTest(testValidator);
getClosestMatchingOptionTest(testValidator);
getFirstMatchingOptionTest(testValidator);
isFilesArrayTest(testValidator);
isMultiSelectTest(testValidator);
isSelectTest(testValidator);
mergeValidationDataTest(testValidator);
retrieveSchemaTest(testValidator);
sanitizeDataForNewSchemaTest(testValidator);
toIdSchemaTest(testValidator);
toPathSchemaTest(testValidator);
