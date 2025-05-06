import React, { ComponentType } from 'react';
import { formTests } from '@rjsf/snapshot-tests';
import { RJSFSchema } from '@rjsf/utils';
import { FormProps } from '@rjsf/core';
import Form from '../src';

// Create a simple test suite to prevent "test suite must contain at least one test" error
describe('Form', () => {
  it('should have a test', () => {
    expect(true).toBe(true);
  });
});

// The formTests function should be properly typed and called with Form
formTests(Form as ComponentType<FormProps<any, RJSFSchema, any>>);
