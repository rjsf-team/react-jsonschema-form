import React from 'react';
import { withTheme } from '@rjsf/core';
import Theme from '../src/Theme';

// Create Form as a proper React component
const FormForTests = withTheme(Theme);

// Export as both default and named export
export default FormForTests;
export const Form = FormForTests;
