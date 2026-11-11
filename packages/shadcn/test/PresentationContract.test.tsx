import { presentationContractTests } from '@rjsf/snapshot-tests';

import Form, { generateWidgets } from '../src/index.ts';

// cmdk always draws a hidden label, naming an input a single select mounts only while its popover is open, and one a
// multiple select never renders (#5802)
presentationContractTests(Form, generateWidgets(), {}, 'label[cmdk-label]');
