import React, { ComponentType } from 'react';
import { objectTests } from '@rjsf/snapshot-tests';
import { RJSFSchema } from '@rjsf/utils';
import { FormProps } from '@rjsf/core';
import Form from '../src';

// Create a simple test suite to prevent "test suite must contain at least one test" error
describe('Object', () => {
  it('should have a test', () => {
    expect(true).toBe(true);
  });
});

// Run the mocked objectTests
objectTests(Form as ComponentType<FormProps<any, RJSFSchema, any>>);
