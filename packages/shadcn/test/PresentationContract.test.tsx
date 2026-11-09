import { presentationContractTests } from '@rjsf/snapshot-tests';

import Form, { generateWidgets } from '../src/index.ts';

// cmdk always draws its label, naming an input it mounts only while its popover is open (#5478)
presentationContractTests(Form, generateWidgets(), {}, 'label[cmdk-label]');
