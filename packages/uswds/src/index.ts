import React from 'react'; // Import React for createElement
import {
  RJSFSchema,
  GenericObjectType,
} from '@rjsf/utils';

import Theme from './Theme';
import Templates from './Templates';
import Widgets from './Widgets';

export { Theme, Templates, Widgets };

export function generateForm<T = any, S extends RJSFSchema = RJSFSchema, F extends GenericObjectType = any>() {
  console.warn('withTheme not found in generateForm.');
  return (props: any) => React.createElement('form', props, 'Form Placeholder (withTheme unavailable)');
}

const Form = generateForm();

export default Form;
