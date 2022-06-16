import { ValidatorType } from '@rjsf/utils';
import { CustomValidatorOptionsType } from './types';
import AJV6Validator from 'validator';

export default function customizeValidator<T = any>(options: CustomValidatorOptionsType): ValidatorType {
  return new AJV6Validator<T>(options);
}
