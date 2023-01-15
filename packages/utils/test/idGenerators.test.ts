import {
  IdSchema,
  ID_KEY,
  ariaDescribedByIds,
  descriptionId,
  errorId,
  helpId,
  titleId,
} from "../src";

const SIMPLE_ID = "simpleID";
const SCHEMA_ID = "test";
const ID_SCHEMA: IdSchema = { [ID_KEY]: SCHEMA_ID } as IdSchema;

describe("idGenerators", () => {
  it("description id is generated for simple id", () => {
    expect(descriptionId(SIMPLE_ID)).toEqual(`${SIMPLE_ID}__description`);
  });
  it("description id is generated for IdSchema", () => {
    expect(descriptionId(ID_SCHEMA)).toEqual(`${SCHEMA_ID}__description`);
  });
  it("error id is generated for simple id", () => {
    expect(errorId(SIMPLE_ID)).toEqual(`${SIMPLE_ID}__error`);
  });
  it("error id is generated for IdSchema", () => {
    expect(errorId(ID_SCHEMA)).toEqual(`${SCHEMA_ID}__error`);
  });
  it("help id is generated for simple id", () => {
    expect(helpId(SIMPLE_ID)).toEqual(`${SIMPLE_ID}__help`);
  });
  it("help id is generated for IdSchema", () => {
    expect(helpId(ID_SCHEMA)).toEqual(`${SCHEMA_ID}__help`);
  });
  it("title id is generated for simple id", () => {
    expect(titleId(SIMPLE_ID)).toEqual(`${SIMPLE_ID}__title`);
  });
  it("title id is generated for IdSchema", () => {
    expect(titleId(ID_SCHEMA)).toEqual(`${SCHEMA_ID}__title`);
  });
  it("ariaDescribedBy ids are generated for simple id", () => {
    expect(ariaDescribedByIds(SIMPLE_ID)).toEqual(
      `${SIMPLE_ID}__error ${SIMPLE_ID}__description ${SIMPLE_ID}__help`
    );
  });
  it("ariaDescribedBy ids are generated for IdSchema", () => {
    expect(ariaDescribedByIds(ID_SCHEMA)).toEqual(
      `${SCHEMA_ID}__error ${SCHEMA_ID}__description ${SCHEMA_ID}__help`
    );
  });
});
