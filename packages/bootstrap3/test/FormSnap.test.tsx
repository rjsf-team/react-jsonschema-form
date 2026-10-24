import { generateTemplates as coreTemplates, generateWidgets as coreWidgets } from '@rjsf/core';
import {
  checkboxLabelTests,
  fallbackDescriptionTests,
  formTests,
  submitPendingTests,
  themeTests,
} from '@rjsf/snapshot-tests';

import Form, { generateTemplates, generateTheme } from '../src/index.ts';

formTests(Form);
themeTests({ generateTemplates, generateTheme });
// The checkbox and the field template this theme renders are core's
checkboxLabelTests(Form, { generateTemplates: coreTemplates, generateWidgets: coreWidgets, descriptionBy: 'self' });
fallbackDescriptionTests(Form, true);
// oxlint-disable-next-line typescript/no-deprecated -- the deprecated package under test
submitPendingTests(Form);
