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
  toPathSchemaTest,
} from '../../../utils/test/schema';
import getTestValidator from './getTestValidator';

const testValidator = getTestValidator({});

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
toPathSchemaTest(testValidator);
