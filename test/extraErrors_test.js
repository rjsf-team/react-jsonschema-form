import { createSandbox } from "./test_utils";

describe("extraErrors", () => {
  let sandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should not render extra errors if the prop is not present", () => {
    // TODO
  });

  it("should errors if the prop is present", () => {
    // TODO
  });
});
