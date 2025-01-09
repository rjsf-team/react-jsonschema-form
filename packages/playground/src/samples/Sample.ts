import { FormProps } from '@rjsf/core';

export interface Sample extends Omit<FormProps, 'validator'> {
  validator: string;
}
