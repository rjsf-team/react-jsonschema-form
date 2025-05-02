import { formTests } from '@rjsf/snapshot-tests';

import Theme from '../src'; // Import the theme

// Run the snapshot tests for the Form component using the theme and directory context
formTests(Theme, __dirname);

// Add theme-specific tests if needed in a describe block
// describe('USWDS specific tests', () => {
//   it('should render feature X', () => {
//     // test code
//   });
// });
