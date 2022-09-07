import getTestValidator from "./testUtils/getTestValidator";
import {
  getDefaultFormStateTest,
  getDisplayLabelTest,
  getMatchingOptionTest,
  isFilesArrayTest,
  isMultiSelectTest,
  isSelectTest,
  mergeValidationDataTest,
  retrieveSchemaTest,
  toIdSchemaTest,
  toPathSchemaTest,
} from "./schema";

const testValidator = getTestValidator({});

getDefaultFormStateTest(testValidator);
getDisplayLabelTest(testValidator);
getMatchingOptionTest(testValidator);
isFilesArrayTest(testValidator);
isMultiSelectTest(testValidator);
isSelectTest(testValidator);
mergeValidationDataTest(testValidator);
retrieveSchemaTest(testValidator);
toIdSchemaTest(testValidator);
toPathSchemaTest(testValidator);
