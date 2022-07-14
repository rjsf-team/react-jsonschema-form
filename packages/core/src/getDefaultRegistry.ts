import { Registry, RegistryFieldsType, RegistryWidgetsType } from '@rjsf/utils';

import fields from './components/fields';
import widgets from './components/widgets';

export default function getDefaultRegistry<T = any, F = any>(): Partial<Registry<T, F>> {
  return {
    /** Until the fields have been converted to Typescript, force the cast here */
    fields: fields as unknown as RegistryFieldsType<T, F>,
    /** Until the widgets have been converted to Typescript, force the cast here */
    widgets: widgets as unknown as RegistryWidgetsType<T, F>,
    rootSchema: {},
    formContext: {} as F,
  };
}
