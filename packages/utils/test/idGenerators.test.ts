import {
  IdSchema,
  ID_KEY,
  ariaDescribedByIds,
  buttonId,
  descriptionId,
  errorId,
  examplesId,
  helpId,
  optionId,
  titleId,
} from '../src';

const SIMPLE_ID = 'simpleID';
const SCHEMA_ID = 'test';
const ID_SCHEMA: IdSchema = { [ID_KEY]: SCHEMA_ID } as IdSchema;

describe('idGenerators', () => {
  it('description id is generated for simple id', () => {
    expect(descriptionId(SIMPLE_ID)).toEqual(`${SIMPLE_ID}__description`);
  });
  it('description id is generated for IdSchema', () => {
    expect(descriptionId(ID_SCHEMA)).toEqual(`${SCHEMA_ID}__description`);
  });
  it('error id is generated for simple id', () => {
    expect(errorId(SIMPLE_ID)).toEqual(`${SIMPLE_ID}__error`);
  });
  it('error id is generated for IdSchema', () => {
    expect(errorId(ID_SCHEMA)).toEqual(`${SCHEMA_ID}__error`);
  });
  it('examples id is generated for simple id', () => {
    expect(examplesId(SIMPLE_ID)).toEqual(`${SIMPLE_ID}__examples`);
  });
  it('examples id is generated for IdSchema', () => {
    expect(examplesId(ID_SCHEMA)).toEqual(`${SCHEMA_ID}__examples`);
  });
  it('help id is generated for simple id', () => {
    expect(helpId(SIMPLE_ID)).toEqual(`${SIMPLE_ID}__help`);
  });
  it('help id is generated for IdSchema', () => {
    expect(helpId(ID_SCHEMA)).toEqual(`${SCHEMA_ID}__help`);
  });
  it('title id is generated for simple id', () => {
    expect(titleId(SIMPLE_ID)).toEqual(`${SIMPLE_ID}__title`);
  });
  it('title id is generated for IdSchema', () => {
    expect(titleId(ID_SCHEMA)).toEqual(`${SCHEMA_ID}__title`);
  });
  it('ariaDescribedBy ids are generated for simple id', () => {
    expect(ariaDescribedByIds(SIMPLE_ID)).toEqual(`${SIMPLE_ID}__error ${SIMPLE_ID}__description ${SIMPLE_ID}__help`);
  });
  it('ariaDescribedBy ids are generated for IdSchema', () => {
    expect(ariaDescribedByIds(ID_SCHEMA)).toEqual(`${SCHEMA_ID}__error ${SCHEMA_ID}__description ${SCHEMA_ID}__help`);
  });
  it('ariaDescribedBy ids are generated for simple id with examples', () => {
    expect(ariaDescribedByIds(SIMPLE_ID, true)).toEqual(
      `${SIMPLE_ID}__error ${SIMPLE_ID}__description ${SIMPLE_ID}__help ${SIMPLE_ID}__examples`,
    );
  });
  it('ariaDescribedBy ids are generated for IdSchema with examples', () => {
    expect(ariaDescribedByIds(ID_SCHEMA, true)).toEqual(
      `${SCHEMA_ID}__error ${SCHEMA_ID}__description ${SCHEMA_ID}__help ${SCHEMA_ID}__examples`,
    );
  });
  it('optionId generates the proper id for an option', () => {
    expect(optionId(SIMPLE_ID, 1)).toEqual(`${SIMPLE_ID}-${1}`);
  });
  it('button ids of an add button are generated for simple id', () => {
    expect(buttonId(SIMPLE_ID, 'add')).toEqual(`${SIMPLE_ID}__add`);
  });
  it('button ids of an copy button are generated for simple id', () => {
    expect(buttonId(SIMPLE_ID, 'copy')).toEqual(`${SIMPLE_ID}__copy`);
  });
  it('button ids of an move down button are generated for IdSchema ', () => {
    expect(buttonId(ID_SCHEMA, 'moveDown')).toEqual(`${SCHEMA_ID}__moveDown`);
  });
  it('button ids of an move up button are generated for IdSchema ', () => {
    expect(buttonId(ID_SCHEMA, 'moveUp')).toEqual(`${SCHEMA_ID}__moveUp`);
  });
  it('button ids of an remove button are generated for simple id', () => {
    expect(buttonId(SIMPLE_ID, 'remove')).toEqual(`${SIMPLE_ID}__remove`);
  });
});
