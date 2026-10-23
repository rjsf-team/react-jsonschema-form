import {
  additionalKeyId,
  ariaDescribedByIds,
  besideOptionsId,
  buttonId,
  dateElementId,
  expandButtonId,
  descriptionId,
  fallbackTypeSelectorId,
  errorId,
  examplesId,
  fieldLabelId,
  helpId,
  optionalControlsId,
  optionDescriptionId,
  optionHelpId,
  optionLabelId,
  optionId,
  optionSelectorId,
  partId,
  selectedOptionDescriptionId,
  titleId,
} from '../src/index.ts';

const SIMPLE_ID = 'simpleID';

describe('idGenerators', () => {
  it('part id joins the field id and the part name with `__`', () => {
    expect(partId(SIMPLE_ID, 'picker')).toEqual(`${SIMPLE_ID}__picker`);
  });
  it('additional key id is generated for simple id', () => {
    expect(additionalKeyId(SIMPLE_ID)).toEqual(`${SIMPLE_ID}__key`);
  });
  it('option selector id is generated per keyword, and numbered past the first nesting level', () => {
    expect(optionSelectorId(SIMPLE_ID, 'anyOf')).toEqual(`${SIMPLE_ID}__anyof_select`);
    expect(optionSelectorId(SIMPLE_ID, 'oneOf')).toEqual(`${SIMPLE_ID}__oneof_select`);
    expect(optionSelectorId(SIMPLE_ID, 'anyOf', 2)).toEqual(`${SIMPLE_ID}__anyof_select2`);
  });
  it('beside-options id is generated for simple id', () => {
    expect(besideOptionsId(SIMPLE_ID)).toEqual(`${SIMPLE_ID}__XxxOf`);
  });
  it('fallback type selector id is generated for simple id', () => {
    expect(fallbackTypeSelectorId(SIMPLE_ID)).toEqual(`${SIMPLE_ID}___internal_type_selector`);
  });
  it('description id is generated for simple id', () => {
    expect(descriptionId(SIMPLE_ID)).toEqual(`${SIMPLE_ID}__description`);
  });
  it('error id is generated for simple id', () => {
    expect(errorId(SIMPLE_ID)).toEqual(`${SIMPLE_ID}__error`);
  });
  it('examples id is generated for simple id', () => {
    expect(examplesId(SIMPLE_ID)).toEqual(`${SIMPLE_ID}__examples`);
  });
  it('help id is generated for simple id', () => {
    expect(helpId(SIMPLE_ID)).toEqual(`${SIMPLE_ID}__help`);
  });
  it('title id is generated for simple id', () => {
    expect(titleId(SIMPLE_ID)).toEqual(`${SIMPLE_ID}__title`);
  });
  it('field label id is generated for simple id', () => {
    expect(fieldLabelId(SIMPLE_ID)).toEqual(`${SIMPLE_ID}__label`);
  });
  it('date element id is generated for simple id', () => {
    expect(dateElementId(SIMPLE_ID, 'year')).toEqual(`${SIMPLE_ID}__year`);
  });
  it('ariaDescribedBy ids are generated for simple id', () => {
    expect(ariaDescribedByIds(SIMPLE_ID)).toEqual(`${SIMPLE_ID}__error ${SIMPLE_ID}__description ${SIMPLE_ID}__help`);
  });
  it('ariaDescribedBy ids are generated for simple id with examples', () => {
    expect(ariaDescribedByIds(SIMPLE_ID, true)).toEqual(
      `${SIMPLE_ID}__error ${SIMPLE_ID}__description ${SIMPLE_ID}__help ${SIMPLE_ID}__examples`,
    );
  });
  it('optionId generates the proper id for an option', () => {
    expect(optionId(SIMPLE_ID, 1)).toEqual(`${SIMPLE_ID}__1`);
  });
  it('button ids of an add button are generated for simple id', () => {
    expect(buttonId(SIMPLE_ID, 'add')).toEqual(`${SIMPLE_ID}__add`);
  });
  it('button ids of an copy button are generated for simple id', () => {
    expect(buttonId(SIMPLE_ID, 'copy')).toEqual(`${SIMPLE_ID}__copy`);
  });
  it('button ids of an remove button are generated for simple id', () => {
    expect(buttonId(SIMPLE_ID, 'remove')).toEqual(`${SIMPLE_ID}__remove`);
  });
  it('expand button ids of a cyclic schema are generated for simple id', () => {
    expect(expandButtonId(SIMPLE_ID)).toEqual(`${SIMPLE_ID}__expand`);
  });
  it('optional controls ids of an Add element are generated for simple id', () => {
    expect(optionalControlsId(SIMPLE_ID, 'Add')).toEqual(`${SIMPLE_ID}__optionalAdd`);
  });
  it('optional controls ids of a Remove element are generated for simple id', () => {
    expect(optionalControlsId(SIMPLE_ID, 'Remove')).toEqual(`${SIMPLE_ID}__optionalRemove`);
  });
  it('option description id is generated for simple id', () => {
    expect(optionDescriptionId(SIMPLE_ID)).toEqual(`${SIMPLE_ID}__optionDescription`);
  });
  it('option label id is generated for simple id, and numbered past the first nesting level', () => {
    expect(optionLabelId(SIMPLE_ID)).toEqual(`${SIMPLE_ID}__optionLabel`);
    expect(optionLabelId(SIMPLE_ID, 2)).toEqual(`${SIMPLE_ID}__optionLabel2`);
  });
  it('option help id is generated for simple id', () => {
    expect(optionHelpId(SIMPLE_ID)).toEqual(`${SIMPLE_ID}__optionHelp`);
  });
  it('option description and help ids are numbered past the first nesting level', () => {
    expect(optionDescriptionId(SIMPLE_ID, 1)).toEqual(`${SIMPLE_ID}__optionDescription`);
    expect(optionDescriptionId(SIMPLE_ID, 2)).toEqual(`${SIMPLE_ID}__optionDescription2`);
    expect(optionHelpId(SIMPLE_ID, 3)).toEqual(`${SIMPLE_ID}__optionHelp3`);
  });
  it('selected option description id is generated for simple id', () => {
    expect(selectedOptionDescriptionId(SIMPLE_ID)).toEqual(`${SIMPLE_ID}__selectedOptionDescription`);
  });
});
