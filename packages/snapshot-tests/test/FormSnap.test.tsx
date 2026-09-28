import Form, { generateTemplates, generateTheme, generateWidgets } from '@rjsf/core';

import { formTests, themeTests } from '../src/index.ts';

formTests(Form);
themeTests({ generateTemplates, generateTheme, generateWidgets });
