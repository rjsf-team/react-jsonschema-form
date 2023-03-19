// With Lerna active, the test world has access to the test suite via the symlink
import Ajv2019 from 'ajv/dist/2019';
import Ajv2020 from 'ajv/dist/2020';
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
} from '@rjsf/utils/test/schema';
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

const testValidator2019 = getTestValidator({ AjvClass: Ajv2019 });

// NOTE: to restrict which tests to run, you can temporarily comment out any tests you aren't needing
getDefaultFormStateTest(testValidator2019);
getDisplayLabelTest(testValidator2019);
getClosestMatchingOptionTest(testValidator2019);
getFirstMatchingOptionTest(testValidator2019);
isFilesArrayTest(testValidator2019);
isMultiSelectTest(testValidator2019);
isSelectTest(testValidator2019);
mergeValidationDataTest(testValidator2019);
retrieveSchemaTest(testValidator2019);
sanitizeDataForNewSchemaTest(testValidator2019);
toIdSchemaTest(testValidator2019);
toPathSchemaTest(testValidator2019);

const testValidator2020 = getTestValidator({ AjvClass: Ajv2020 });

// NOTE: to restrict which tests to run, you can temporarily comment out any tests you aren't needing
getDefaultFormStateTest(testValidator2020);
getDisplayLabelTest(testValidator2020);
getClosestMatchingOptionTest(testValidator2020);
getFirstMatchingOptionTest(testValidator2020);
isFilesArrayTest(testValidator2020);
isMultiSelectTest(testValidator2020);
isSelectTest(testValidator2020);
mergeValidationDataTest(testValidator2020);
retrieveSchemaTest(testValidator2020);
retrieveSchemaTest(testValidator2020);
toIdSchemaTest(testValidator2020);
toPathSchemaTest(testValidator2020);
