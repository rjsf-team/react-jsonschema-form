import getTestValidator from './getTestValidator';
// YES, this is ugly and breaks the "lerna wall" but it works
import {
  getDefaultFormStateTest,
  getDisplayLabelTest,
  getMatchingOptionTest,
  isFilesArrayTest,
  isMultiSelectTest,
  isSelectTest,
  retrieveSchemaTest,
  stubExistingAdditionalPropertiesTest,
  toIdSchemaTest, toPathSchemaTest
} from '../../../utils/test/schema';

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
