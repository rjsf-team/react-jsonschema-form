import type { MockInstance } from 'vitest';

import type { GenericObjectType, GlobalUISchemaOptions } from '../src/index.ts';
import { noop, pickGlobalUiOptions, resetLogOnce } from '../src/index.ts';

describe('pickGlobalUiOptions()', () => {
  let consoleWarnSpy: MockInstance;
  beforeEach(() => {
    resetLogOnce();
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(noop);
  });
  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  // Untyped, as a JSON uiSchema is, so it can hold options RJSF reads only per field
  const globalOptions: GenericObjectType = { label: false, widget: 'textarea', placeholder: 'Global', density: 1 };

  it('keeps only the options RJSF reads from ui:globalOptions', () => {
    expect(pickGlobalUiOptions(globalOptions)).toEqual({ label: false });
  });
  it('keeps the extension keys it is given, where the options hold them', () => {
    expect(pickGlobalUiOptions(globalOptions, ['density', 'absent'])).toEqual({ label: false, density: 1 });
  });
  it('drops an extension key that is an option RJSF reads per field, and warns once', () => {
    expect(pickGlobalUiOptions(globalOptions, ['widget'])).toEqual({ label: false });
    pickGlobalUiOptions(globalOptions, ['widget']);

    expect(consoleWarnSpy).toHaveBeenCalledExactlyOnceWith(
      'globalUiOptionsKeys names widget, an option RJSF reads per field, so it is not read from ui:globalOptions.',
    );
  });
  it('drops an extension key naming a template that ui:options does not declare, since getTemplates() reads it', () => {
    const withTemplate: GenericObjectType = { MarkdownTemplate: 'Custom' };

    expect(pickGlobalUiOptions(withTemplate, ['MarkdownTemplate'])).toEqual({});
    expect(consoleWarnSpy).toHaveBeenCalledExactlyOnceWith(
      'globalUiOptionsKeys names MarkdownTemplate, an option RJSF reads per field, so it is not read from ui:globalOptions.',
    );
  });
  it("drops an extension key naming an option RJSF's widgets read that ui:options doesn't declare", () => {
    const withFormat: GenericObjectType = { format: 'MDY' };

    expect(pickGlobalUiOptions(withFormat, ['format'])).toEqual({});
    expect(consoleWarnSpy).toHaveBeenCalledExactlyOnceWith(
      'globalUiOptionsKeys names format, an option RJSF reads per field, so it is not read from ui:globalOptions.',
    );
  });
  it('takes an extension key that is one of the options RJSF reads there without a warning', () => {
    expect(pickGlobalUiOptions(globalOptions, ['label'])).toEqual({ label: false });
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });
  it('returns undefined for options that are not an object, as a JSON uiSchema can give', () => {
    expect(pickGlobalUiOptions(undefined)).toBeUndefined();
    expect(pickGlobalUiOptions(null as unknown as GlobalUISchemaOptions)).toBeUndefined();
    expect(pickGlobalUiOptions('label')).toBeUndefined();
  });
});
