import getTestValidator from './testUtils/getTestValidator';
import {
  getDefaultFormStateTest,
  getDisplayLabelTest,
  getMatchingOptionTest,
  isFilesArrayTest,
  isMultiSelectTest,
  isSelectTest,
  retrieveSchemaTest,
  stubExistingAdditionalPropertiesTest,
  toIdSchemaTest,
  toPathSchemaTest,
} from './schema';

const testValidator = getTestValidator({});

getDefaultFormStateTest(testValidator);
getDisplayLabelTest(testValidator);
getMatchingOptionTest(testValidator);
isFilesArrayTest(testValidator);
isMultiSelectTest(testValidator);
isSelectTest(testValidator);
retrieveSchemaTest(testValidator);
stubExistingAdditionalPropertiesTest(testValidator);
toIdSchemaTest(testValidator);
toPathSchemaTest(testValidator);
