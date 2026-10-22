import { selectedOptionDescriptionTests } from '@rjsf/snapshot-tests';

import NativeSelectWidget from '../src/NativeSelectWidget/NativeSelectWidget.tsx';
import WrappedForm from './WrappedForm.tsx';

describe.each([
  ['SelectWidget', {}],
  ['NativeSelectWidget', { SelectWidget: NativeSelectWidget }],
])('chakra-ui %s', (_, widgets) => selectedOptionDescriptionTests(WrappedForm, widgets));
