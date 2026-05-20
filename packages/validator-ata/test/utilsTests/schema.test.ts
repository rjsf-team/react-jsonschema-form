// The test world has access to the test suite via the direct import from the utils package
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
toPathSchemaTest(testValidator);

const testValidatorDiscriminated = getTestValidator({
  ajvOptionsOverrides: { discriminator: true },
});

// NOTE: to restrict which tests to run, you can temporarily comment out any tests you aren't needing
findFieldInSchemaTest(testValidatorDiscriminated);
findSelectedOptionInXxxOfTest(testValidatorDiscriminated);
getDefaultFormStateTest(testValidatorDiscriminated);
getDisplayLabelTest(testValidatorDiscriminated);
getClosestMatchingOptionTest(testValidatorDiscriminated);
getFirstMatchingOptionTest(testValidatorDiscriminated);
getFromSchemaTest(testValidatorDiscriminated);
isFilesArrayTest(testValidatorDiscriminated);
isMultiSelectTest(testValidatorDiscriminated);
isSelectTest(testValidatorDiscriminated);
retrieveSchemaTest(testValidatorDiscriminated);
sanitizeDataForNewSchemaTest(testValidatorDiscriminated);
toPathSchemaTest(testValidatorDiscriminated);
