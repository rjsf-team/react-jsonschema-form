import { CustomValidatorOptionsType } from './types';
import AJV6Validator from 'validator';

export default function customizeValidator(options: CustomValidatorOptionsType) {
  return new AJV6Validator(options);
}
