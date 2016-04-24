import { expect } from "chai";

import { createFormComponent } from "./test_utils";


describe("Custom validation", () => {
  it("should validate a simple string value", () => {
    const schema = {type: "string"};
    const formData = "a";

    function validate(string) {
      if (string.getValue() !== "hello") {
        string.addError("Invalid");
      }
    }

    const {comp} = createFormComponent({schema, validate, liveValidate: true});
    comp.componentWillReceiveProps({formData});

    expect(comp.state.errorSchema).eql({
      __errors: ["Invalid"],
    });
  });

  it("should validate a simple object", () => {
    const schema = {
      type: "object",
      properties: {
        pass1: {type: "string", minLength: 3},
        pass2: {type: "string", minLength: 3},
      }
    };

    const formData = {pass1: "aaa", pass2: "b"};

    function validate({pass1, pass2}) {
      if (pass1.getValue() !== pass2.getValue()) {
        pass2.addError("Passwords don't match");
      }
    }

    const {comp} = createFormComponent({schema, validate, liveValidate: true});
    comp.componentWillReceiveProps({formData});

    expect(comp.state.errorSchema).eql({
      pass1: {
        __errors: [],
      },
      pass2: {
        __errors: [
          "does not meet minimum length of 3",
          "Passwords don't match",
        ]
      }
    });
  });

  it("should validate a simple array", () => {
    const schema = {
      type: "array",
      items: {
        type: "string"
      }
    };

    const formData = ["aaa", "bbb", "ccc"];

    function validate(array) {
      if (array.getValue().indexOf("bbb") !== -1) {
        array.addError("Forbidden value: bbb");
      }
    }

    const {comp} = createFormComponent({schema, validate, liveValidate: true});
    comp.componentWillReceiveProps({formData});

    expect(comp.state.errorSchema).eql({
      __errors: ["Forbidden value: bbb"],
    });
  });
});