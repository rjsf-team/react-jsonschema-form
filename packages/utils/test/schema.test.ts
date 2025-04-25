import getTestValidator from './testUtils/getTestValidator';
import {
  findFieldInSchemaTest,
  findSelectedOptionInXxxOfTest,
  getDefaultFormStateTest,
  getDisplayLabelTest,
  getClosestMatchingOptionTest,
  getFirstMatchingOptionTest,
  getFromSchemaTest,
  isFilesArrayTest,
  isMultiSelectTest,
  isSelectTest,
  retrieveSchemaTest,
  sanitizeDataForNewSchemaTest,
  toIdSchemaTest,
  toPathSchemaTest,
} from './schema';

const testValidator = getTestValidator({});

// NOTE: to restrict which tests to run, you can temporarily comment out any tests you aren't needing
findFieldInSchemaTest(testValidator);
findSelectedOptionInXxxOfTest(testValidator);
getDefaultFormStateTest(testValidator);
getDisplayLabelTest(testValidator);
getClosestMatchingOptionTest(testValidator);
getFirstMatchingOptionTest(testValidator);
getFromSchemaTest(testValidator);
isFilesArrayTest(testValidator);
isMultiSelectTest(testValidator);
isSelectTest(testValidator);
retrieveSchemaTest(testValidator);
sanitizeDataForNewSchemaTest(testValidator);
toIdSchemaTest(testValidator);
toPathSchemaTest(testValidator);
