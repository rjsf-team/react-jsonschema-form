// With Lerna active, the test world has access to the test suite via the symlink
import Ajv2019 from "ajv/dist/2019";
import Ajv2020 from "ajv/dist/2020";
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

const testValidator2019 = getTestValidator({ AjvClass: Ajv2019 });

getDefaultFormStateTest(testValidator2019);
getDisplayLabelTest(testValidator2019);
getMatchingOptionTest(testValidator2019);
isFilesArrayTest(testValidator2019);
isMultiSelectTest(testValidator2019);
isSelectTest(testValidator2019);
mergeValidationDataTest(testValidator2019);
retrieveSchemaTest(testValidator2019);
toIdSchemaTest(testValidator2019);
toPathSchemaTest(testValidator2019);

const testValidator2020 = getTestValidator({ AjvClass: Ajv2020 });

getDefaultFormStateTest(testValidator2020);
getDisplayLabelTest(testValidator2020);
getMatchingOptionTest(testValidator2020);
isFilesArrayTest(testValidator2020);
isMultiSelectTest(testValidator2020);
isSelectTest(testValidator2020);
mergeValidationDataTest(testValidator2020);
retrieveSchemaTest(testValidator2020);
toIdSchemaTest(testValidator2020);
toPathSchemaTest(testValidator2020);
