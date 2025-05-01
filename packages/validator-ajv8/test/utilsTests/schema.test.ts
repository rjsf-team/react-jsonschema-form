import Ajv2019 from 'ajv/dist/2019';
import Ajv2020 from 'ajv/dist/2020';
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
  toIdSchemaTest,
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
toIdSchemaTest(testValidator);
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
toIdSchemaTest(testValidatorDiscriminated);
toPathSchemaTest(testValidatorDiscriminated);

const testValidator2019 = getTestValidator({ AjvClass: Ajv2019 });

// NOTE: to restrict which tests to run, you can temporarily comment out any tests you aren't needing
findFieldInSchemaTest(testValidator2019);
findSelectedOptionInXxxOfTest(testValidator2019);
getDefaultFormStateTest(testValidator2019);
getDisplayLabelTest(testValidator2019);
getClosestMatchingOptionTest(testValidator2019);
getFirstMatchingOptionTest(testValidator2019);
getFromSchemaTest(testValidator2019);
isFilesArrayTest(testValidator2019);
isMultiSelectTest(testValidator2019);
isSelectTest(testValidator2019);
retrieveSchemaTest(testValidator2019);
sanitizeDataForNewSchemaTest(testValidator2019);
toIdSchemaTest(testValidator2019);
toPathSchemaTest(testValidator2019);

const testValidator2020 = getTestValidator({ AjvClass: Ajv2020 });

// NOTE: to restrict which tests to run, you can temporarily comment out any tests you aren't needing
findFieldInSchemaTest(testValidator2020);
findSelectedOptionInXxxOfTest(testValidator2020);
getDefaultFormStateTest(testValidator2020);
getDisplayLabelTest(testValidator2020);
getClosestMatchingOptionTest(testValidator2020);
getFirstMatchingOptionTest(testValidator2020);
getFromSchemaTest(testValidator2020);
isFilesArrayTest(testValidator2020);
isMultiSelectTest(testValidator2020);
isSelectTest(testValidator2020);
retrieveSchemaTest(testValidator2020);
retrieveSchemaTest(testValidator2020);
toIdSchemaTest(testValidator2020);
toPathSchemaTest(testValidator2020);
