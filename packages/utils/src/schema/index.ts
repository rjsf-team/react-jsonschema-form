import findFieldInSchema from './findFieldInSchema.ts';
import findSelectedOptionInXxxOf from './findSelectedOptionInXxxOf.ts';
import getClosestMatchingOption from './getClosestMatchingOption.ts';
import getDefaultFormState from './getDefaultFormState.ts';
import getDisplayLabel from './getDisplayLabel.ts';
import getFirstMatchingOption from './getFirstMatchingOption.ts';
import getFromSchema from './getFromSchema.ts';
import isFilesArray from './isFilesArray.ts';
import isMultiSelect from './isMultiSelect.ts';
import isSelect from './isSelect.ts';
import omitExtraData, { getUsedFormData, getFieldNames, isValueEmpty } from './omitExtraData.ts';
import retrieveSchema, { relaxOptionsForScoring } from './retrieveSchema.ts';
import sanitizeDataForNewSchema from './sanitizeDataForNewSchema.ts';
import toPathSchema from './toPathSchema.ts';

export {
  findFieldInSchema,
  findSelectedOptionInXxxOf,
  getDefaultFormState,
  getDisplayLabel,
  // oxlint-disable-next-line typescript/no-deprecated
  getFieldNames, // Exported only to prevent breaking change in core
  getClosestMatchingOption,
  getFirstMatchingOption,
  getFromSchema,
  // oxlint-disable-next-line typescript/no-deprecated
  getUsedFormData, // Exported only to prevent breaking change in core
  isFilesArray,
  isMultiSelect,
  isSelect,
  isValueEmpty,
  omitExtraData,
  relaxOptionsForScoring,
  retrieveSchema,
  sanitizeDataForNewSchema,
  // oxlint-disable-next-line typescript/no-deprecated
  toPathSchema,
};
