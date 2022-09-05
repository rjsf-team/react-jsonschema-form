// With Lerna active, the test world has access to the test suite via the symlink
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
} from "@rjsf/utils/test/schema";
import getTestValidator from "./getTestValidator";

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
