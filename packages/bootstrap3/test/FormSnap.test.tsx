import { generateTemplates as coreTemplates, generateWidgets as coreWidgets } from '@rjsf/core';
import {
  checkboxLabelTests,
  fallbackDescriptionTests,
  formTests,
  submitPendingTests,
  themeTests,
} from '@rjsf/snapshot-tests';

import Form, { generateTemplates, generateTheme } from '../src/index.ts';

// oxlint-disable-next-line typescript/no-deprecated -- the deprecated package under test
formTests(Form);
// oxlint-disable-next-line typescript/no-deprecated -- the deprecated package under test
themeTests({ generateTemplates, generateTheme, generateWidgets: null });
// The checkbox and the field template this theme renders are core's
// oxlint-disable-next-line typescript/no-deprecated -- the deprecated package under test
checkboxLabelTests(Form, { generateTemplates: coreTemplates, generateWidgets: coreWidgets, descriptionBy: 'self' });
// oxlint-disable-next-line typescript/no-deprecated -- the deprecated package under test
fallbackDescriptionTests(Form, true);
// oxlint-disable-next-line typescript/no-deprecated -- the deprecated package under test
submitPendingTests(Form);
