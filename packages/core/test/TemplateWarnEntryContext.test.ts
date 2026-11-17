import { toFieldPath } from '@rjsf/utils';
import { renderHook } from '@testing-library/react';

import { useTemplateWarnEntry } from '../src/components/fields/TemplateWarnEntryContext.ts';
import type { DefinitionRecord } from '../src/components/fields/TemplateWarnEntryContext.ts';

const globalFormOptions = { idPrefix: 'root', idSeparator: '_' };
const fieldPath = toFieldPath('name');

describe('useTemplateWarnEntry', () => {
  it('keeps its entry for a record built again from the same entries, and builds a new one for other entries', () => {
    const local = { 'ui:title': 'Name' };
    const definition = { 'ui:FieldTemplate': 'Typo' };
    const { result, rerender } = renderHook(
      (record: DefinitionRecord) => useTemplateWarnEntry({}, fieldPath, globalFormOptions, record),
      { initialProps: { ref: '#/$defs/Name', local, definition } },
    );
    const first = result.current;

    // `resolveUiSchema()` records afresh each time it runs, as it does when the field's schema is retrieved again
    rerender({ ref: '#/$defs/Name', local, definition });
    expect(result.current).toBe(first);

    rerender({ ref: '#/$defs/Name', local: { ...local }, definition });
    expect(result.current).not.toBe(first);
  });
});
