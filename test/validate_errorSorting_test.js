import { expect } from "chai";

import validateFormData from "../src/validate";

describe("Validation Error Sorting", () => {
  describe("validate.validateFormData()", () => {
    describe("error sorting", () => {
      const expectOrder = (sortedErrors, expectedOrder) => {
        if (sortedErrors.length !== expectedOrder.length) {
          throw new Error(
            `The amount of sored errors (${
              sortedErrors.length
            }) does not match the expected ones (${expectedOrder.length})`
          );
        }

        expectedOrder.forEach((err, index) => {
          expect(sortedErrors[index].property).to.eql(err);
        });
      };

      it("should return an empty array when there are no errors", () => {
        const schema = {
          type: "object",
          properties: {
            bar: {
              type: "string",
              minLength: 1,
            },
            foo: {
              type: "string",
              minLength: 1,
            },
          },
        };
        const uiSchema = {};
        const formData = {
          foo: "bar",
          bar: "foo",
        };
        const result = validateFormData(
          formData,
          schema,
          null,
          null,
          null,
          null,
          uiSchema
        );
        expectOrder(result.errors, []);
      });

      describe("without ui:orders in an uiSchema", () => {
        it("should have the default order how they appear in the schema (bar - wibble - wobble)", () => {
          const schema = {
            type: "object",
            properties: {
              bar: {
                type: "string",
                minLength: 1,
              },
              foo: {
                type: "object",
                properties: {
                  wibble: {
                    type: "string",
                    minLength: 1,
                  },
                  wobble: {
                    type: "string",
                    minLength: 1,
                  },
                },
              },
            },
          };
          const uiSchema = {};
          const formData = {
            foo: {
              wibble: "",
              wobble: "",
            },
            bar: "",
          };
          const result = validateFormData(
            formData,
            schema,
            null,
            null,
            null,
            null,
            uiSchema
          );
          expectOrder(result.errors, [".bar", ".foo.wibble", ".foo.wobble"]);
        });
      });

      describe("with nested ui:orders in an uiSchema", () => {
        it("should only consider the nested ui:order and sort the rest how they appear (bar - wibble - wobble)", () => {
          const schema = {
            type: "object",
            properties: {
              bar: {
                type: "string",
                minLength: 1,
              },
              foo: {
                type: "object",
                properties: {
                  wobble: {
                    type: "string",
                    minLength: 1,
                  },
                  wibble: {
                    type: "string",
                    minLength: 1,
                  },
                },
              },
            },
          };
          const uiSchema = {
            foo: {
              "ui:order": ["wibble", "wobble"],
            },
          };
          const formData = {
            foo: {
              wibble: "",
              wobble: "",
            },
            bar: "",
          };
          const result = validateFormData(
            formData,
            schema,
            null,
            null,
            null,
            null,
            uiSchema
          );
          expectOrder(result.errors, [".bar", ".foo.wibble", ".foo.wobble"]);
        });
      });

      describe("with one level of schema", () => {
        it("should have the order foo - bar - qux", () => {
          const schema = {
            type: "object",
            properties: {
              bar: {
                type: "string",
                minLength: 1,
              },
              foo: {
                type: "string",
                minLength: 1,
              },
              qux: {
                type: "string",
                minLength: 1,
              },
            },
          };
          const uiSchema = {
            "ui:order": ["foo", "bar", "qux"],
          };
          const formData = {
            foo: "",
            bar: "",
            qux: "",
          };
          const result = validateFormData(
            formData,
            schema,
            null,
            null,
            null,
            null,
            uiSchema
          );
          expectOrder(result.errors, [".foo", ".bar", ".qux"]);
        });
      });

      describe("with nested objects", () => {
        it("should have the order wibble - wobble - bar", () => {
          const schema = {
            type: "object",
            properties: {
              bar: {
                type: "string",
                minLength: 1,
              },
              foo: {
                type: "object",
                properties: {
                  wibble: {
                    type: "string",
                    minLength: 1,
                  },
                  wobble: {
                    type: "string",
                    minLength: 1,
                  },
                },
              },
            },
          };
          const uiSchema = {
            "ui:order": ["foo", "bar"],
            foo: {
              "ui:order": ["wibble", "wobble"],
            },
          };
          const formData = {
            foo: {
              wibble: "",
              wobble: "",
            },
            bar: "",
          };
          const result = validateFormData(
            formData,
            schema,
            null,
            null,
            null,
            null,
            uiSchema
          );
          expectOrder(result.errors, [".foo.wibble", ".foo.wobble", ".bar"]);
        });

        it("should be able to deal with properties on the same level which names start alike", () => {
          const schema = {
            type: "object",
            properties: {
              bar: {
                type: "string",
                minLength: 1,
              },
              foo: {
                type: "object",
                properties: {
                  wibble: {
                    type: "object",
                    required: ["quux", "qux"],
                    properties: {
                      quux: {
                        type: "string",
                      },
                      qux: {
                        type: "string",
                      },
                    },
                  },
                  wibblewobble: {
                    type: "object",
                    required: ["fred", "thud", "waldo"],
                    properties: {
                      fred: {
                        type: "string",
                      },
                      thud: {
                        type: "string",
                      },
                      waldo: {
                        type: "string",
                      },
                    },
                  },
                },
              },
            },
          };
          const uiSchema = {
            "ui:order": ["foo", "bar"],
            foo: {
              "ui:order": ["wibble", "wibblewobble"],
              wibble: {},
              wibblewobble: {
                "ui:order": ["waldo", "fred", "*"],
              },
            },
          };
          const formData = {
            foo: {
              wibble: {},
              wibblewobble: {},
            },
            bar: "",
          };
          const result = validateFormData(
            formData,
            schema,
            null,
            null,
            null,
            null,
            uiSchema
          );
          expectOrder(result.errors, [
            ".foo.wibble.quux",
            ".foo.wibble.qux",
            ".foo.wibblewobble.waldo",
            ".foo.wibblewobble.fred",
            ".foo.wibblewobble.thud",
            ".bar",
          ]);
        });
      });

      describe("with enums", () => {
        it("should have the order foo - bar", () => {
          const schema = {
            type: "object",
            properties: {
              bar: {
                type: "string",
                minLength: 1,
              },
              foo: {
                type: "string",
                enum: ["valueA", "valueB"],
              },
            },
          };
          const uiSchema = {
            "ui:order": ["foo", "bar"],
          };
          const formData = {
            foo: "",
            bar: "",
          };
          const result = validateFormData(
            formData,
            schema,
            null,
            null,
            null,
            null,
            uiSchema
          );
          expectOrder(result.errors, [".foo", ".bar"]);
        });
      });

      describe("with multiple errors for one error", () => {
        it("should have the order foo - bar", () => {
          const schema = {
            type: "object",
            properties: {
              bar: {
                type: "string",
                minLength: 1,
              },
              foo: {
                type: "string",
                minLength: 1,
                enum: ["valueA", "valueB"],
              },
            },
          };
          const uiSchema = {
            "ui:order": ["foo", "bar"],
          };
          const formData = {
            foo: "",
            bar: "",
          };
          const result = validateFormData(
            formData,
            schema,
            null,
            null,
            null,
            null,
            uiSchema
          );
          expectOrder(result.errors, [".foo", ".foo", ".bar"]);
        });
      });

      describe("with arrays", () => {
        describe("containing strings", () => {
          it("should have the order wibble - bar", () => {
            const schema = {
              type: "object",
              properties: {
                bar: {
                  type: "string",
                  minLength: 1,
                },
                foo: {
                  type: "object",
                  properties: {
                    wibble: {
                      type: "array",
                      items: {
                        type: "string",
                        minLength: 6,
                      },
                    },
                  },
                },
              },
            };
            const uiSchema = {
              "ui:order": ["foo", "bar"],
              foo: {
                "ui:order": ["wibble"],
              },
            };
            const formData = {
              foo: {
                wibble: ["short"],
              },
              bar: "",
            };
            const result = validateFormData(
              formData,
              schema,
              null,
              null,
              null,
              null,
              uiSchema
            );
            expectOrder(result.errors, [".foo.wibble[0]", ".bar"]);
          });
        });
        describe("containing objects", () => {
          it("should have the order wibble - wobble - bar when only the array elements hav validationerrors", () => {
            const schema = {
              type: "object",
              properties: {
                bar: {
                  type: "string",
                  minLength: 1,
                },
                foo: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      wobble: {
                        type: "string",
                        minLength: 1,
                      },
                      wibble: {
                        type: "string",
                        minLength: 1,
                      },
                    },
                  },
                },
              },
            };
            const uiSchema = {
              "ui:order": ["foo", "bar"],
              foo: {
                "ui:order": ["wibble", "wobble"],
              },
            };
            const formData = {
              foo: [
                {
                  wobble: "",
                  wibble: "val a",
                },
                {
                  wobble: "",
                  wibble: "",
                },
                {
                  wobble: "val b",
                  wibble: "",
                },
              ],
              bar: "",
            };
            const result = validateFormData(
              formData,
              schema,
              null,
              null,
              null,
              null,
              uiSchema
            );
            expectOrder(result.errors, [
              ".foo[0].wobble",
              ".foo[1].wibble",
              ".foo[1].wobble",
              ".foo[2].wibble",
              ".bar",
            ]);
          });
          it("should have the order foo - wibble - wobble - bar when the array itself has validationerrors", () => {
            const schema = {
              type: "object",
              properties: {
                bar: {
                  type: "string",
                  minLength: 1,
                },
                foo: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      wobble: {
                        type: "string",
                        minLength: 1,
                      },
                      wibble: {
                        type: "string",
                        minLength: 1,
                      },
                    },
                  },
                  minItems: 5,
                },
              },
            };
            const uiSchema = {
              "ui:order": ["foo", "bar"],
              foo: {
                "ui:order": ["wibble", "wobble"],
              },
            };
            const formData = {
              foo: [
                {
                  wobble: "",
                  wibble: "val a",
                },
                {
                  wobble: "",
                  wibble: "",
                },
                {
                  wobble: "val b",
                  wibble: "",
                },
              ],
              bar: "",
            };
            const result = validateFormData(
              formData,
              schema,
              null,
              null,
              null,
              null,
              uiSchema
            );
            expectOrder(result.errors, [
              ".foo",
              ".foo[0].wobble",
              ".foo[1].wibble",
              ".foo[1].wobble",
              ".foo[2].wibble",
              ".bar",
            ]);
          });
        });
        describe("containing nested objects", () => {
          it("should have the order foo - wibble - plugh - garply - grault - wobble - bar", () => {
            const schema = {
              type: "object",
              properties: {
                bar: {
                  type: "string",
                  minLength: 1,
                },
                foo: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      wobble: {
                        type: "string",
                        minLength: 1,
                      },
                      wibble: {
                        type: "string",
                        minLength: 1,
                      },
                      plugh: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            grault: {
                              type: "string",
                              minLength: 1,
                            },
                            garply: {
                              type: "string",
                              minLength: 1,
                            },
                          },
                        },
                        minItems: 2,
                      },
                    },
                  },
                  minItems: 5,
                },
              },
            };
            const uiSchema = {
              "ui:order": ["foo", "bar"],
              foo: {
                "ui:order": ["wibble", "plugh", "wobble"],
                plugh: {
                  "ui:order": ["garply", "grault"],
                },
              },
            };
            const formData = {
              foo: [
                {
                  wobble: "",
                  wibble: "val a",
                  plugh: [
                    {
                      grault: "",
                      garply: "nested value b",
                    },
                  ],
                },
                {
                  wobble: "",
                  wibble: "",
                  plugh: [
                    {
                      grault: "",
                      garply: "",
                    },
                    {
                      grault: "",
                      garply: "",
                    },
                  ],
                },
                {
                  wobble: "val b",
                  wibble: "",
                  plugh: [
                    {
                      grault: "nested value a",
                      garply: "",
                    },
                  ],
                },
              ],
              bar: "",
            };
            const result = validateFormData(
              formData,
              schema,
              null,
              null,
              null,
              null,
              uiSchema
            );
            expectOrder(result.errors, [
              ".foo",
              ".foo[0].plugh",
              ".foo[0].plugh[0].grault",
              ".foo[0].wobble",
              ".foo[1].wibble",
              ".foo[1].plugh[0].garply",
              ".foo[1].plugh[0].grault",
              ".foo[1].plugh[1].garply",
              ".foo[1].plugh[1].grault",
              ".foo[1].wobble",
              ".foo[2].wibble",
              ".foo[2].plugh",
              ".foo[2].plugh[0].garply",
              ".bar",
            ]);
          });
        });
      });

      describe("with wildcards", () => {
        describe("one level", () => {
          it("should have the order foo - qux - quuz - bar", () => {
            const schema = {
              type: "object",
              properties: {
                bar: {
                  type: "string",
                  minLength: 1,
                },
                foo: {
                  type: "string",
                  minLength: 1,
                },
                qux: {
                  type: "string",
                  minLength: 1,
                },
                quuz: {
                  type: "string",
                  minLength: 1,
                },
              },
            };
            const uiSchema = {
              "ui:order": ["foo", "*", "bar"],
            };
            const formData = {
              foo: "",
              bar: "",
              qux: "",
              quuz: "",
            };
            const result = validateFormData(
              formData,
              schema,
              null,
              null,
              null,
              null,
              uiSchema
            );
            expectOrder(result.errors, [".foo", ".qux", ".quuz", ".bar"]);
          });
          it("should have the order qux - quuz - foo - bar", () => {
            const schema = {
              type: "object",
              properties: {
                bar: {
                  type: "string",
                  minLength: 1,
                },
                foo: {
                  type: "string",
                  minLength: 1,
                },
                qux: {
                  type: "string",
                  minLength: 1,
                },
                quuz: {
                  type: "string",
                  minLength: 1,
                },
              },
            };
            const uiSchema = {
              "ui:order": ["*", "foo", "bar"],
            };
            const formData = {
              foo: "",
              bar: "",
              qux: "",
              quuz: "",
            };
            const result = validateFormData(
              formData,
              schema,
              null,
              null,
              null,
              null,
              uiSchema
            );
            expectOrder(result.errors, [".qux", ".quuz", ".foo", ".bar"]);
          });
        });

        describe("comined with arrays", () => {
          it("should order active at the top and the array at the bottom", () => {
            const schema = {
              title: "Contextualized errors",
              type: "object",
              properties: {
                firstName: {
                  type: "string",
                  title: "First name",
                  minLength: 8,
                  pattern: "\\d+",
                },
                active: {
                  type: "boolean",
                  title: "Active",
                },
                skills: {
                  type: "array",
                  items: {
                    type: "string",
                    minLength: 5,
                  },
                },
                multipleChoicesList: {
                  type: "array",
                  title: "Pick max two items",
                  uniqueItems: true,
                  maxItems: 2,
                  items: {
                    type: "string",
                    enum: ["foo", "bar", "fuzz"],
                  },
                },
              },
            };
            const uiSchema = {
              "ui:order": ["active", "*", "skills"],
            };
            const formData = {
              firstName: "Chuck",
              active: "wrong",
              skills: ["karate", "budo", "aikido"],
              multipleChoicesList: ["foo", "bar", "fuzz"],
            };
            const result = validateFormData(
              formData,
              schema,
              null,
              null,
              null,
              null,
              uiSchema
            );
            expectOrder(result.errors, [
              ".active",
              ".firstName",
              ".firstName",
              ".multipleChoicesList",
              ".skills[1]",
            ]);
          });

          it("should order wildcard in an array", () => {
            const schema = {
              title: "Contextualized errors",
              type: "object",
              required: ["foo"],
              properties: {
                bar: {
                  type: "boolean",
                  title: "Active",
                },
                foo: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      wobble: {
                        type: "string",
                        minLength: 1,
                      },
                      qux: {
                        type: "string",
                        minLength: 1,
                      },
                      quux: {
                        type: "string",
                        minLength: 1,
                      },
                      wibble: {
                        type: "string",
                        minLength: 1,
                      },
                    },
                  },
                },
              },
            };
            const uiSchema = {
              foo: {
                "ui:order": ["wibble", "*", "wobble"],
              },
            };
            const formData = {
              bar: "wrong",
              foo: [
                {
                  wobble: "val a",
                  qux: "a val",
                  quux: "",
                  wibble: "",
                },
                {
                  wobble: "",
                  qux: "",
                  quux: "",
                  wibble: "",
                },
                {
                  wobble: "",
                  qux: "",
                  quux: "b val",
                  wibble: "val b",
                },
              ],
            };
            const result = validateFormData(
              formData,
              schema,
              null,
              null,
              null,
              null,
              uiSchema
            );
            expectOrder(result.errors, [
              ".bar",
              ".foo[0].wibble",
              ".foo[0].quux",
              ".foo[1].wibble",
              ".foo[1].qux",
              ".foo[1].quux",
              ".foo[1].wobble",
              ".foo[2].qux",
              ".foo[2].wobble",
            ]);
          });

          it("should order wildcard in nested arrays", () => {
            const schema = {
              title: "Contextualized errors",
              type: "object",
              required: ["foo"],
              properties: {
                bar: {
                  type: "boolean",
                  title: "Active",
                },
                foo: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      wobble: {
                        type: "string",
                        minLength: 1,
                      },
                      qux: {
                        type: "string",
                        minLength: 1,
                      },
                      quux: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            grault: {
                              type: "string",
                              minLength: 1,
                            },
                            garply: {
                              type: "string",
                              minLength: 1,
                            },
                          },
                        },
                        minItems: 2,
                      },
                      wibble: {
                        type: "string",
                        minLength: 1,
                      },
                    },
                  },
                },
              },
            };
            const uiSchema = {
              foo: {
                "ui:order": ["wibble", "*", "wobble"],
                quux: {
                  "ui:order": ["garply", "*"],
                },
              },
            };
            const formData = {
              bar: "wrong",
              foo: [
                {
                  wobble: "val a",
                  qux: "a val",
                  quux: [
                    {
                      grault: "",
                      garply: "",
                    },
                    {
                      grault: "grault [0]",
                      garply: "",
                    },
                  ],
                  wibble: "",
                },
                {
                  wobble: "",
                  qux: "",
                  quux: [
                    {
                      grault: "",
                      garply: "",
                    },
                  ],
                  wibble: "",
                },
                {
                  wobble: "",
                  qux: "",
                  quux: [
                    {
                      grault: "",
                      garply: "grault [2]",
                    },
                    {
                      grault: "",
                      garply: "",
                    },
                  ],
                  wibble: "val b",
                },
              ],
            };
            const result = validateFormData(
              formData,
              schema,
              null,
              null,
              null,
              null,
              uiSchema
            );

            expectOrder(result.errors, [
              ".bar",
              ".foo[0].wibble",
              ".foo[0].quux[0].garply",
              ".foo[0].quux[0].grault",
              ".foo[0].quux[1].garply",
              ".foo[1].wibble",
              ".foo[1].qux",
              ".foo[1].quux",
              ".foo[1].quux[0].garply",
              ".foo[1].quux[0].grault",
              ".foo[1].wobble",
              ".foo[2].qux",
              ".foo[2].quux[0].grault",
              ".foo[2].quux[1].garply",
              ".foo[2].quux[1].grault",
              ".foo[2].wobble",
            ]);
          });

          it("should order item-related errors before it's children", () => {
            const schema = {
              title: "Contextualized errors",
              type: "object",
              properties: {
                active: {
                  type: "boolean",
                },
                firstName: {
                  type: "string",
                  minLength: 1,
                },
                skills: {
                  type: "array",
                  items: {
                    type: "string",
                    minLength: 6,
                  },
                  maxItems: 5,
                },
              },
            };
            const uiSchema = {
              "ui:order": ["active", "*", "skills"],
            };
            const formData = {
              active: "wrong",
              firstName: "",
              skills: [
                "trumpet",
                "sleep",
                "juggling",
                "eating",
                "loving",
                1337,
                "work",
              ],
            };
            const result = validateFormData(
              formData,
              schema,
              null,
              null,
              null,
              null,
              uiSchema
            );
            expectOrder(result.errors, [
              ".active",
              ".firstName",
              ".skills",
              ".skills[1]",
              ".skills[5]",
              ".skills[6]",
            ]);
          });
        });

        describe("nested wildcard", () => {
          describe("* in the middle of uiOrders", () => {
            it("should have the order foo - quux - quuz - bar when all question orders are defined", () => {
              const schema = {
                type: "object",
                properties: {
                  bar: {
                    type: "string",
                    minLength: 1,
                  },
                  foo: {
                    type: "string",
                    minLength: 1,
                  },
                  qux: {
                    type: "object",
                    properties: {
                      quuz: {
                        type: "string",
                        minLength: 1,
                      },
                      quux: {
                        type: "string",
                        minLength: 1,
                      },
                    },
                  },
                },
              };
              const uiSchema = {
                "ui:order": ["foo", "*", "bar"],
                qux: {
                  "ui:order": ["quux", "quuz"],
                },
              };
              const formData = {
                foo: "",
                bar: "",
                qux: {
                  quux: "",
                  quuz: "",
                },
              };
              const result = validateFormData(
                formData,
                schema,
                null,
                null,
                null,
                null,
                uiSchema
              );
              expectOrder(result.errors, [
                ".foo",
                ".qux.quux",
                ".qux.quuz",
                ".bar",
              ]);
            });
            it("should have the order foo - quux - quuz - bar when some question orders are defined", () => {
              const schema = {
                type: "object",
                properties: {
                  bar: {
                    type: "string",
                    minLength: 1,
                  },
                  wibble: {
                    type: "object",
                    properties: {
                      wubble: {
                        type: "string",
                        minLength: 1,
                      },
                      wobble: {
                        type: "string",
                        minLength: 1,
                      },
                    },
                  },
                  foo: {
                    type: "string",
                    minLength: 1,
                  },
                  qux: {
                    type: "object",
                    properties: {
                      quuz: {
                        type: "string",
                        minLength: 1,
                      },
                      quux: {
                        type: "string",
                        minLength: 1,
                      },
                      corge: {
                        type: "string",
                        minLength: 1,
                      },
                    },
                  },
                },
              };
              const uiSchema = {
                "ui:order": ["foo", "*", "bar"],
                qux: {
                  "ui:order": ["quux", "*"],
                },
              };
              const formData = {
                foo: "",
                wibble: {
                  wobble: "",
                  wubble: "",
                },
                bar: "",
                qux: {
                  quux: "",
                  quuz: "",
                  corge: "",
                },
              };
              const result = validateFormData(
                formData,
                schema,
                null,
                null,
                null,
                null,
                uiSchema
              );
              expectOrder(result.errors, [
                ".foo",
                ".wibble.wubble",
                ".wibble.wobble",
                ".qux.quux",
                ".qux.quuz",
                ".qux.corge",
                ".bar",
              ]);
            });
          });
          describe("* at the last instance of a object property", () => {
            it("should have the order foo - quux - quuz - bar when all question orders are defined", () => {
              const schema = {
                type: "object",
                properties: {
                  bar: {
                    type: "string",
                    minLength: 1,
                  },
                  foo: {
                    type: "object",
                    properties: {
                      qux: {
                        type: "object",
                        properties: {
                          quuz: {
                            type: "string",
                            minLength: 1,
                          },
                          quux: {
                            type: "string",
                            minLength: 1,
                          },
                        },
                      },
                    },
                  },
                },
              };
              const uiSchema = {
                foo: {
                  qux: {
                    "ui:order": ["*"],
                  },
                },
              };
              const formData = {
                foo: {
                  qux: {
                    quux: "",
                    quuz: "",
                  },
                },
                bar: "",
              };
              const result = validateFormData(
                formData,
                schema,
                null,
                null,
                null,
                null,
                uiSchema
              );
              expectOrder(result.errors, [
                ".bar",
                ".foo.qux.quuz",
                ".foo.qux.quux",
              ]);
            });
          });
        });

        describe("properties in uiSchema without their own uiOrder", () => {
          it("should only consider first ui:order and sort the rest how they appear (wobble - wibble - bar)", () => {
            const schema = {
              type: "object",
              properties: {
                bar: {
                  type: "string",
                  minLength: 1,
                },
                foo: {
                  type: "object",
                  properties: {
                    wobble: {
                      type: "string",
                      minLength: 1,
                    },
                    wibble: {
                      type: "string",
                      minLength: 1,
                    },
                  },
                },
              },
            };
            const uiSchema = {
              "ui:order": ["foo", "bar"],
              foo: {
                wibble: {
                  "ui:description": "Some other non-related ui:order prop",
                },
              },
            };
            const formData = {
              foo: {
                wobble: "",
                wibble: "",
              },
              bar: "",
            };
            const result = validateFormData(
              formData,
              schema,
              null,
              null,
              null,
              null,
              uiSchema
            );
            expectOrder(result.errors, [".foo.wobble", ".foo.wibble", ".bar"]);
          });
        });
      });

      describe("with oneOfs", () => {
        it(
          "should have the order in which the properties appear in the schema (foo.wibble - foo.wobble - foo - bar.wibble - bar.wobble - bar -" +
            " oneOfError) with two oneOfs",
          () => {
            const schema = {
              type: "object",
              required: ["foo", "bar"],
              properties: {
                foo: {
                  type: "object",
                  oneOf: [
                    {
                      properties: {
                        wibble: {
                          type: "string",
                        },
                      },
                      required: ["wibble"],
                    },
                    {
                      properties: {
                        wobble: {
                          type: "string",
                        },
                      },
                      required: ["wobble"],
                    },
                  ],
                },
                bar: {
                  type: "object",
                  oneOf: [
                    {
                      properties: {
                        wibble: {
                          type: "string",
                        },
                      },
                      required: ["wibble"],
                    },
                    {
                      properties: {
                        wobble: {
                          type: "string",
                        },
                      },
                      required: ["wobble"],
                    },
                  ],
                },
              },
            };
            const uiSchema = {};
            const formData = {
              foo: {},
              bar: {},
            };
            const result = validateFormData(
              formData,
              schema,
              null,
              null,
              null,
              null,
              uiSchema
            );
            expectOrder(result.errors, [
              ".foo.wibble",
              ".foo.wobble",
              ".foo",
              ".bar.wibble",
              ".bar.wobble",
              ".bar",
            ]);
          }
        );

        it("should be ordered by the uiSchema", () => {
          const schema = {
            type: "object",
            oneOf: [
              {
                properties: {
                  bar: {
                    type: "string",
                  },
                },
                required: ["bar"],
              },
              {
                properties: {
                  foo: {
                    type: "string",
                    minimum: 1,
                  },
                  wobble: {
                    type: "string",
                    minimum: 1,
                  },
                  wibble: {
                    type: "string",
                    minimum: 1,
                  },
                },
                required: ["foo", "wobble", "wibble"],
              },
            ],
          };
          const uiSchema = {
            "ui:order": ["foo", "wibble", "wobble", "bar"],
          };
          const formData = {};
          const result = validateFormData(
            formData,
            schema,
            null,
            null,
            null,
            null,
            uiSchema
          );
          expectOrder(result.errors, [
            ".foo",
            ".wibble",
            ".wobble",
            ".bar",
            "",
          ]);
        });
        it("should have the order in which the properties appear in the schema (foo - bar - oneOfError)", () => {
          const schema = {
            type: "object",
            oneOf: [
              {
                properties: {
                  foo: {
                    type: "string",
                  },
                },
                required: ["foo"],
              },
              {
                properties: {
                  bar: {
                    type: "string",
                  },
                },
                required: ["bar"],
              },
            ],
          };
          const uiSchema = {};
          const formData = {};
          const result = validateFormData(
            formData,
            schema,
            null,
            null,
            null,
            null,
            uiSchema
          );
          expectOrder(result.errors, [".foo", ".bar", ""]);
        });
      });
    });
  });
});
