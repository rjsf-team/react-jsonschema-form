import { formTests } from '@rjsf/snapshot-tests';

import Form from '../src';

// Run the snapshot tests for the Form component
formTests(Form);

// Add theme-specific tests if needed in a describe block
// describe('USWDS specific tests', () => {
//   it('should render feature X', () => {
//     // test code
//   });
// });
