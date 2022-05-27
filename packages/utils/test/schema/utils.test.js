import { expect } from 'chai';
import React from 'react';

import {
  ADDITIONAL_PROPERTY_FLAG,
  getDefaultFormState,
  isFilesArray,
  isMultiSelect,
  retrieveSchema,
  toIdSchema,
  toPathSchema,
  getDisplayLabel,
  getMatchingOption,
} from '../src/utils';
import { createSandbox } from './test_utils';

describe('utils', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('isMultiSelect()', () => {
    describe('uniqueItems is true', () => {
      describe('schema items enum is an array', () => {
        it('should be true', () => {
          let schema = {
            items: { enum: ['foo', 'bar'] },
            uniqueItems: true,
          };
          expect(isMultiSelect(schema)).to.be.true;
        });
      });

      it('should be false if items is undefined', () => {
        const schema = {};
        expect(isMultiSelect(schema)).to.be.false;
      });

      describe('schema items enum is not an array', () => {
        const constantSchema = { type: 'string', enum: ['Foo'] };
        const notConstantSchema = { type: 'string' };

        it('should be false if oneOf/anyOf is not in items schema', () => {
          const schema = { items: {}, uniqueItems: true };
          expect(isMultiSelect(schema)).to.be.false;
        });

        it('should be false if oneOf/anyOf schemas are not all constants', () => {
          const schema = {
            items: { oneOf: [constantSchema, notConstantSchema] },
            uniqueItems: true,
          };
          expect(isMultiSelect(schema)).to.be.false;
        });

        it('should be true if oneOf/anyOf schemas are all constants', () => {
          const schema = {
            items: { oneOf: [constantSchema, constantSchema] },
            uniqueItems: true,
          };
          expect(isMultiSelect(schema)).to.be.true;
        });
      });

      it('should retrieve reference schema definitions', () => {
        const schema = {
          items: { $ref: '#/definitions/FooItem' },
          uniqueItems: true,
        };
        const definitions = {
          FooItem: { type: 'string', enum: ['foo'] },
        };
        expect(isMultiSelect(schema, { definitions })).to.be.true;
      });
    });

    it('should be false if uniqueItems is false', () => {
      const schema = {
        items: { enum: ['foo', 'bar'] },
        uniqueItems: false,
      };
      expect(isMultiSelect(schema)).to.be.false;
    });
  });

  describe('isFilesArray()', () => {
    it('should be true if items have data-url format', () => {
      const schema = { items: { type: 'string', format: 'data-url' } };
      const uiSchema = {};
      expect(isFilesArray(schema, uiSchema)).to.be.true;
    });

    it('should be false if items is undefined', () => {
      const schema = {};
      const uiSchema = {};
      expect(isFilesArray(schema, uiSchema)).to.be.false;
    });
  });

  describe('retrieveSchema()', () => {
    it('should `resolve` a schema which contains definitions', () => {
      const schema = { $ref: '#/definitions/address' };
      const address = {
        type: 'object',
        properties: {
          street_address: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
        },
        required: ['street_address', 'city', 'state'],
      };
      const definitions = { address };

      expect(retrieveSchema(schema, { definitions })).eql(address);
    });

    it('should `resolve` a schema which contains definitions not in `#/definitions`', () => {
      const address = {
        type: 'object',
        properties: {
          street_address: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
        },
        required: ['street_address', 'city', 'state'],
      };
      const schema = {
        $ref: '#/components/schemas/address',
        components: { schemas: { address } },
      };

      expect(retrieveSchema(schema, schema)).eql({
        components: { schemas: { address } },
        ...address,
      });
    });

    it('should give an error when JSON pointer is not in a URI encoded format', () => {
      const address = {
        type: 'object',
        properties: {
          street_address: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
        },
        required: ['street_address', 'city', 'state'],
      };
      const schema = {
        $ref: '/components/schemas/address',
        components: { schemas: { address } },
      };

      expect(() => retrieveSchema(schema, schema)).to.throw(
        'Could not find a definition'
      );
    });

    it('should give an error when JSON pointer does not point to anything', () => {
      const schema = {
        $ref: '#/components/schemas/address',
        components: { schemas: {} },
      };

      expect(() => retrieveSchema(schema, schema)).to.throw(
        'Could not find a definition'
      );
    });

    it('should `resolve` escaped JSON Pointers', () => {
      const schema = { $ref: '#/definitions/a~0complex~1name' };
      const address = { type: 'string' };
      const definitions = { 'a~complex/name': address };

      expect(retrieveSchema(schema, { definitions })).eql(address);
    });

    it('should `resolve` and stub out a schema which contains an `additionalProperties` with a definition', () => {
      const schema = {
        type: 'object',
        additionalProperties: {
          $ref: '#/definitions/components/schemas/address',
        },
      };

      const address = {
        type: 'object',
        properties: {
          street_address: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
        },
        required: ['street_address', 'city', 'state'],
      };

      const definitions = { components: { schemas: { address } } };
      const formData = { newKey: {} };

      expect(retrieveSchema(schema, { definitions }, formData)).eql({
        ...schema,
        properties: {
          newKey: {
            ...address,
            [ADDITIONAL_PROPERTY_FLAG]: true,
          },
        },
      });
    });

    it('should `resolve` and stub out a schema which contains an `additionalProperties` with a type and definition', () => {
      const schema = {
        type: 'string',
        additionalProperties: {
          $ref: '#/definitions/number',
        },
      };

      const number = {
        type: 'number',
      };

      const definitions = { number };
      const formData = { newKey: {} };

      expect(retrieveSchema(schema, { definitions }, formData)).eql({
        ...schema,
        properties: {
          newKey: {
            ...number,
            [ADDITIONAL_PROPERTY_FLAG]: true,
          },
        },
      });
    });

    it('should handle null formData for schema which contains additionalProperties', () => {
      const schema = {
        additionalProperties: {
          type: 'string',
        },
        type: 'object',
      };

      const formData = null;
      expect(retrieveSchema(schema, {}, formData)).eql({
        ...schema,
        properties: {},
      });
    });

    it('should priorize local definitions over foreign ones', () => {
      const schema = {
        $ref: '#/definitions/address',
        title: 'foo',
      };
      const address = {
        type: 'string',
        title: 'bar',
      };
      const definitions = { address };

      expect(retrieveSchema(schema, { definitions })).eql({
        ...address,
        title: 'foo',
      });
    });

    describe('property dependencies', () => {
      describe('false condition', () => {
        it('should not add required properties', () => {
          const schema = {
            type: 'object',
            properties: {
              a: { type: 'string' },
              b: { type: 'integer' },
            },
            required: ['a'],
            dependencies: {
              a: ['b'],
            },
          };
          const definitions = {};
          const formData = {};
          expect(retrieveSchema(schema, { definitions }, formData)).eql({
            type: 'object',
            properties: {
              a: { type: 'string' },
              b: { type: 'integer' },
            },
            required: ['a'],
          });
        });
      });

      describe('true condition', () => {
        describe('when required is not defined', () => {
          it('should define required properties', () => {
            const schema = {
              type: 'object',
              properties: {
                a: { type: 'string' },
                b: { type: 'integer' },
              },
              dependencies: {
                a: ['b'],
              },
            };
            const definitions = {};
            const formData = { a: '1' };
            expect(retrieveSchema(schema, { definitions }, formData)).eql({
              type: 'object',
              properties: {
                a: { type: 'string' },
                b: { type: 'integer' },
              },
              required: ['b'],
            });
          });
        });

        describe('when required is defined', () => {
          it('should concat required properties', () => {
            const schema = {
              type: 'object',
              properties: {
                a: { type: 'string' },
                b: { type: 'integer' },
              },
              required: ['a'],
              dependencies: {
                a: ['b'],
              },
            };
            const definitions = {};
            const formData = { a: '1' };
            expect(retrieveSchema(schema, { definitions }, formData)).eql({
              type: 'object',
              properties: {
                a: { type: 'string' },
                b: { type: 'integer' },
              },
              required: ['a', 'b'],
            });
          });
        });
      });
    });

    describe('schema dependencies', () => {
      describe('conditional', () => {
        describe('false condition', () => {
          it('should not modify properties', () => {
            const schema = {
              type: 'object',
              properties: {
                a: { type: 'string' },
              },
              dependencies: {
                a: {
                  properties: {
                    b: { type: 'integer' },
                  },
                },
              },
            };
            const definitions = {};
            const formData = {};
            expect(retrieveSchema(schema, { definitions }, formData)).eql({
              type: 'object',
              properties: {
                a: { type: 'string' },
              },
            });
          });
        });

        describe('true condition', () => {
          it('should add properties', () => {
            const schema = {
              type: 'object',
              properties: {
                a: { type: 'string' },
              },
              dependencies: {
                a: {
                  properties: {
                    b: { type: 'integer' },
                  },
                },
              },
            };
            const definitions = {};
            const formData = { a: '1' };
            expect(retrieveSchema(schema, { definitions }, formData)).eql({
              type: 'object',
              properties: {
                a: { type: 'string' },
                b: { type: 'integer' },
              },
            });
          });
          it('should concat required properties', () => {
            const schema = {
              type: 'object',
              properties: {
                a: { type: 'string' },
                b: { type: 'integer' },
              },
              required: ['a'],
              dependencies: {
                a: {
                  properties: {
                    a: { type: 'string' },
                  },
                  required: ['b'],
                },
              },
            };
            const definitions = {};
            const formData = { a: '1' };
            expect(retrieveSchema(schema, { definitions }, formData)).eql({
              type: 'object',
              properties: {
                a: { type: 'string' },
                b: { type: 'integer' },
              },
              required: ['a', 'b'],
            });
          });
          it('should not concat enum properties, but should concat `required` properties', () => {
            const schema = {
              type: 'object',
              properties: {
                a: { type: 'string', enum: ['FOO', 'BAR', 'BAZ'] },
                b: { type: 'string', enum: ['GREEN', 'BLUE', 'RED'] },
              },
              required: ['a'],
              dependencies: {
                a: {
                  properties: {
                    a: { enum: ['FOO'] },
                    b: { enum: ['BLUE'] },
                  },
                  required: ['a', 'b'],
                },
              },
            };
            const definitions = {};
            const formData = { a: 'FOO' };
            expect(retrieveSchema(schema, { definitions }, formData)).eql({
              type: 'object',
              properties: {
                a: { type: 'string', enum: ['FOO'] },
                b: { type: 'string', enum: ['BLUE'] },
              },
              required: ['a', 'b'],
            });
          });
        });

        describe('with $ref in dependency', () => {
          it('should retrieve referenced schema', () => {
            const schema = {
              type: 'object',
              properties: {
                a: { type: 'string' },
              },
              dependencies: {
                a: {
                  $ref: '#/definitions/needsB',
                },
              },
            };
            const definitions = {
              needsB: {
                properties: {
                  b: { type: 'integer' },
                },
              },
            };
            const formData = { a: '1' };
            expect(retrieveSchema(schema, { definitions }, formData)).eql({
              type: 'object',
              properties: {
                a: { type: 'string' },
                b: { type: 'integer' },
              },
            });
          });
        });

        describe('with $ref in oneOf', () => {
          it('should retrieve referenced schemas', () => {
            const schema = {
              type: 'object',
              properties: {
                a: { enum: ['typeA', 'typeB'] },
              },
              dependencies: {
                a: {
                  oneOf: [
                    { $ref: '#/definitions/needsA' },
                    { $ref: '#/definitions/needsB' },
                  ],
                },
              },
            };
            const definitions = {
              needsA: {
                properties: {
                  a: { enum: ['typeA'] },
                  b: { type: 'number' },
                },
              },
              needsB: {
                properties: {
                  a: { enum: ['typeB'] },
                  c: { type: 'boolean' },
                },
              },
            };
            const formData = { a: 'typeB' };
            expect(retrieveSchema(schema, { definitions }, formData)).eql({
              type: 'object',
              properties: {
                a: { enum: ['typeA', 'typeB'] },
                c: { type: 'boolean' },
              },
            });
          });
        });
      });

      describe('dynamic', () => {
        describe('false condition', () => {
          it('should not modify properties', () => {
            const schema = {
              type: 'object',
              properties: {
                a: { type: 'string' },
              },
              dependencies: {
                a: {
                  oneOf: [
                    {
                      properties: {
                        a: { enum: ['int'] },
                        b: { type: 'integer' },
                      },
                    },
                    {
                      properties: {
                        a: { enum: ['bool'] },
                        b: { type: 'boolean' },
                      },
                    },
                  ],
                },
              },
            };
            const definitions = {};
            const formData = {};
            expect(retrieveSchema(schema, { definitions }, formData)).eql({
              type: 'object',
              properties: {
                a: { type: 'string' },
              },
            });
          });
        });

        describe('true condition', () => {
          it('should add `first` properties given `first` data', () => {
            const schema = {
              type: 'object',
              properties: {
                a: { type: 'string', enum: ['int', 'bool'] },
              },
              dependencies: {
                a: {
                  oneOf: [
                    {
                      properties: {
                        a: { enum: ['int'] },
                        b: { type: 'integer' },
                      },
                    },
                    {
                      properties: {
                        a: { enum: ['bool'] },
                        b: { type: 'boolean' },
                      },
                    },
                  ],
                },
              },
            };
            const definitions = {};
            const formData = { a: 'int' };
            expect(retrieveSchema(schema, { definitions }, formData)).eql({
              type: 'object',
              properties: {
                a: { type: 'string', enum: ['int', 'bool'] },
                b: { type: 'integer' },
              },
            });
          });

          it('should add `second` properties given `second` data', () => {
            const schema = {
              type: 'object',
              properties: {
                a: { type: 'string', enum: ['int', 'bool'] },
              },
              dependencies: {
                a: {
                  oneOf: [
                    {
                      properties: {
                        a: { enum: ['int'] },
                        b: { type: 'integer' },
                      },
                    },
                    {
                      properties: {
                        a: { enum: ['bool'] },
                        b: { type: 'boolean' },
                      },
                    },
                  ],
                },
              },
            };
            const definitions = {};
            const formData = { a: 'bool' };
            expect(retrieveSchema(schema, { definitions }, formData)).eql({
              type: 'object',
              properties: {
                a: { type: 'string', enum: ['int', 'bool'] },
                b: { type: 'boolean' },
              },
            });
          });

          describe('showing/hiding nested dependencies', () => {
            const schema = {
              type: 'object',
              dependencies: {
                employee_accounts: {
                  oneOf: [
                    {
                      properties: {
                        employee_accounts: {
                          const: true,
                        },
                        update_absences: {
                          title: 'Update Absences',
                          type: 'string',
                          oneOf: [
                            {
                              title: 'Both',
                              const: 'BOTH',
                            },
                          ],
                        },
                      },
                    },
                  ],
                },
                update_absences: {
                  oneOf: [
                    {
                      properties: {
                        permitted_extension: {
                          title: 'Permitted Extension',
                          type: 'integer',
                        },
                        update_absences: {
                          const: 'BOTH',
                        },
                      },
                    },
                    {
                      properties: {
                        permitted_extension: {
                          title: 'Permitted Extension',
                          type: 'integer',
                        },
                        update_absences: {
                          const: 'MEDICAL_ONLY',
                        },
                      },
                    },
                    {
                      properties: {
                        permitted_extension: {
                          title: 'Permitted Extension',
                          type: 'integer',
                        },
                        update_absences: {
                          const: 'NON_MEDICAL_ONLY',
                        },
                      },
                    },
                  ],
                },
              },
              properties: {
                employee_accounts: {
                  type: 'boolean',
                  title: 'Employee Accounts',
                },
              },
            };
            const definitions = {};

            it('should not include nested dependencies that should be hidden', () => {
              const formData = {
                employee_accounts: false,
                update_absences: 'BOTH',
              };
              expect(retrieveSchema(schema, { definitions }, formData)).eql({
                type: 'object',
                properties: {
                  employee_accounts: {
                    type: 'boolean',
                    title: 'Employee Accounts',
                  },
                },
              });
            });

            it('should include nested dependencies that should not be hidden', () => {
              const formData = {
                employee_accounts: true,
                update_absences: 'BOTH',
              };
              expect(retrieveSchema(schema, { definitions }, formData)).eql({
                type: 'object',
                properties: {
                  employee_accounts: {
                    type: 'boolean',
                    title: 'Employee Accounts',
                  },
                  permitted_extension: {
                    title: 'Permitted Extension',
                    type: 'integer',
                  },
                  update_absences: {
                    title: 'Update Absences',
                    type: 'string',
                    oneOf: [
                      {
                        title: 'Both',
                        const: 'BOTH',
                      },
                    ],
                  },
                },
              });
            });
          });
        });

        describe('with $ref in dependency', () => {
          it('should retrieve the referenced schema', () => {
            const schema = {
              type: 'object',
              properties: {
                a: { type: 'string', enum: ['int', 'bool'] },
              },
              dependencies: {
                a: {
                  $ref: '#/definitions/typedInput',
                },
              },
            };
            const definitions = {
              typedInput: {
                oneOf: [
                  {
                    properties: {
                      a: { enum: ['int'] },
                      b: { type: 'integer' },
                    },
                  },
                  {
                    properties: {
                      a: { enum: ['bool'] },
                      b: { type: 'boolean' },
                    },
                  },
                ],
              },
            };
            const formData = { a: 'bool' };
            expect(retrieveSchema(schema, { definitions }, formData)).eql({
              type: 'object',
              properties: {
                a: { type: 'string', enum: ['int', 'bool'] },
                b: { type: 'boolean' },
              },
            });
          });
        });
      });
    });

    describe('allOf', () => {
      it('should merge types', () => {
        const schema = {
          allOf: [{ type: ['string', 'number', 'null'] }, { type: 'string' }],
        };
        const definitions = {};
        const formData = {};
        expect(retrieveSchema(schema, { definitions }, formData)).eql({
          type: 'string',
        });
      });
      it('should not merge incompatible types', () => {
        sandbox.stub(console, 'warn');
        const schema = {
          allOf: [{ type: 'string' }, { type: 'boolean' }],
        };
        const definitions = {};
        const formData = {};
        expect(retrieveSchema(schema, { definitions }, formData)).eql({});
        expect(
          console.warn.calledWithMatch(/could not merge subschemas in allOf/)
        ).to.be.true;
      });
      it('should merge types with $ref in them', () => {
        const schema = {
          allOf: [{ $ref: '#/definitions/1' }, { $ref: '#/definitions/2' }],
        };
        const definitions = {
          '1': { type: 'string' },
          '2': { minLength: 5 },
        };
        const formData = {};
        expect(retrieveSchema(schema, { definitions }, formData)).eql({
          type: 'string',
          minLength: 5,
        });
      });
      it('should properly merge schemas with nested allOf`s', () => {
        const schema = {
          allOf: [
            {
              type: 'string',
              allOf: [{ minLength: 2 }, { maxLength: 5 }],
            },
            {
              type: 'string',
              allOf: [{ default: 'hi' }, { minLength: 4 }],
            },
          ],
        };
        const definitions = {};
        const formData = {};
        expect(retrieveSchema(schema, { definitions }, formData)).eql({
          type: 'string',
          minLength: 4,
          maxLength: 5,
          default: 'hi',
        });
      });
    });

    describe('Conditional schemas (If, Then, Else)', () => {
      it('should resolve if, then', () => {
        const schema = {
          type: 'object',
          properties: {
            country: {
              default: 'United States of America',
              enum: ['United States of America', 'Canada'],
            },
          },
          if: {
            properties: { country: { const: 'United States of America' } },
          },
          then: {
            properties: { postal_code: { pattern: '[0-9]{5}(-[0-9]{4})?' } },
          },
          else: {
            properties: {
              postal_code: { pattern: '[A-Z][0-9][A-Z] [0-9][A-Z][0-9]' },
            },
          },
        };
        const definitions = {};
        const formData = {
          country: 'United States of America',
          postal_code: '20500',
        };
        expect(retrieveSchema(schema, { definitions }, formData)).eql({
          type: 'object',
          properties: {
            country: {
              default: 'United States of America',
              enum: ['United States of America', 'Canada'],
            },
            postal_code: { pattern: '[0-9]{5}(-[0-9]{4})?' },
          },
        });
      });
      it('should resolve if, else', () => {
        const schema = {
          type: 'object',
          properties: {
            country: {
              default: 'United States of America',
              enum: ['United States of America', 'Canada'],
            },
          },
          if: {
            properties: { country: { const: 'United States of America' } },
          },
          then: {
            properties: { postal_code: { pattern: '[0-9]{5}(-[0-9]{4})?' } },
          },
          else: {
            properties: {
              postal_code: { pattern: '[A-Z][0-9][A-Z] [0-9][A-Z][0-9]' },
            },
          },
        };
        const definitions = {};
        const formData = {
          country: 'Canada',
          postal_code: 'K1M 1M4',
        };
        expect(retrieveSchema(schema, { definitions }, formData)).eql({
          type: 'object',
          properties: {
            country: {
              default: 'United States of America',
              enum: ['United States of America', 'Canada'],
            },
            postal_code: { pattern: '[A-Z][0-9][A-Z] [0-9][A-Z][0-9]' },
          },
        });
      });
      it('should resolve multiple conditions', () => {
        const schema = {
          type: 'object',
          properties: {
            animal: {
              enum: ['Cat', 'Fish'],
            },
          },
          allOf: [
            {
              if: {
                properties: { animal: { const: 'Cat' } },
              },
              then: {
                properties: {
                  food: { type: 'string', enum: ['meat', 'grass', 'fish'] },
                },
              },
              required: ['food'],
            },
            {
              if: {
                properties: { animal: { const: 'Fish' } },
              },
              then: {
                properties: {
                  food: {
                    type: 'string',
                    enum: ['insect', 'worms'],
                  },
                  water: {
                    type: 'string',
                    enum: ['lake', 'sea'],
                  },
                },
                required: ['food', 'water'],
              },
            },
            {
              required: ['animal'],
            },
          ],
        };
        const definitions = {};
        const formData = {
          animal: 'Cat',
        };

        expect(retrieveSchema(schema, { definitions }, formData)).eql({
          type: 'object',
          properties: {
            animal: {
              enum: ['Cat', 'Fish'],
            },
            food: { type: 'string', enum: ['meat', 'grass', 'fish'] },
          },
          required: ['animal', 'food'],
        });
      });
      it('should resolve multiple conditions in nested allOf blocks', () => {
        const schema = {
          type: 'object',
          properties: {
            Animal: {
              default: 'Cat',
              enum: ['Cat', 'Dog'],
              title: 'Animal',
              type: 'string',
            },
          },
          allOf: [
            {
              if: {
                required: ['Animal'],
                properties: {
                  Animal: {
                    const: 'Cat',
                  },
                },
              },
              then: {
                properties: {
                  Tail: {
                    default: 'Long',
                    enum: ['Long', 'Short', 'None'],
                    title: 'Tail length',
                    type: 'string',
                  },
                },
                required: ['Tail'],
              },
            },
            {
              if: {
                required: ['Animal'],
                properties: {
                  Animal: {
                    const: 'Dog',
                  },
                },
              },
              then: {
                properties: {
                  Breed: {
                    title: 'Breed',
                    properties: {
                      BreedName: {
                        default: 'Alsatian',
                        enum: ['Alsatian', 'Dalmation'],
                        title: 'Breed name',
                        type: 'string',
                      },
                    },
                    allOf: [
                      {
                        if: {
                          required: ['BreedName'],
                          properties: {
                            BreedName: {
                              const: 'Alsatian',
                            },
                          },
                        },
                        then: {
                          properties: {
                            Fur: {
                              default: 'brown',
                              enum: ['black', 'brown'],
                              title: 'Fur',
                              type: 'string',
                            },
                          },
                          required: ['Fur'],
                        },
                      },
                      {
                        if: {
                          required: ['BreedName'],
                          properties: {
                            BreedName: {
                              const: 'Dalmation',
                            },
                          },
                        },
                        then: {
                          properties: {
                            Spots: {
                              default: 'small',
                              enum: ['large', 'small'],
                              title: 'Spots',
                              type: 'string',
                            },
                          },
                          required: ['Spots'],
                        },
                      },
                    ],
                    required: ['BreedName'],
                  },
                },
              },
            },
          ],
          required: ['Animal'],
        };
        const definitions = {};
        const formData = {
          Animal: 'Dog',
          Breed: {
            BreedName: 'Dalmation',
          },
        };

        expect(retrieveSchema(schema, { definitions }, formData)).eql({
          type: 'object',
          properties: {
            Animal: {
              default: 'Cat',
              enum: ['Cat', 'Dog'],
              title: 'Animal',
              type: 'string',
            },
            Breed: {
              properties: {
                BreedName: {
                  default: 'Alsatian',
                  enum: ['Alsatian', 'Dalmation'],
                  title: 'Breed name',
                  type: 'string',
                },
                Spots: {
                  default: 'small',
                  enum: ['large', 'small'],
                  title: 'Spots',
                  type: 'string',
                },
              },
              required: ['BreedName', 'Spots'],
              title: 'Breed',
            },
          },
          required: ['Animal'],
        });
      });
      it('should resolve $ref', () => {
        const schema = {
          type: 'object',
          properties: {
            animal: {
              enum: ['Cat', 'Fish'],
            },
          },
          allOf: [
            {
              if: {
                properties: { animal: { const: 'Cat' } },
              },
              then: {
                $ref: '#/definitions/cat',
              },
              required: ['food'],
            },
            {
              if: {
                properties: { animal: { const: 'Fish' } },
              },
              then: {
                $ref: '#/definitions/fish',
              },
            },
            {
              required: ['animal'],
            },
          ],
        };

        const definitions = {
          cat: {
            properties: {
              food: { type: 'string', enum: ['meat', 'grass', 'fish'] },
            },
          },
          fish: {
            properties: {
              food: {
                type: 'string',
                enum: ['insect', 'worms'],
              },
              water: {
                type: 'string',
                enum: ['lake', 'sea'],
              },
            },
            required: ['food', 'water'],
          },
        };

        const formData = {
          animal: 'Cat',
        };

        expect(retrieveSchema(schema, { definitions }, formData)).eql({
          type: 'object',
          properties: {
            animal: {
              enum: ['Cat', 'Fish'],
            },
            food: { type: 'string', enum: ['meat', 'grass', 'fish'] },
          },
          required: ['animal', 'food'],
        });
      });
      it('handles nested if then else', () => {
        const schemaWithNested = {
          type: 'object',
          properties: {
            country: {
              enum: ['USA'],
            },
          },
          required: ['country'],
          if: {
            properties: {
              country: {
                const: 'USA',
              },
            },
            required: ['country'],
          },
          then: {
            properties: {
              state: {
                type: 'string',
                enum: ['California', 'New York'],
              },
            },
            required: ['state'],
            if: {
              properties: {
                state: {
                  const: 'New York',
                },
              },
              required: ['state'],
            },
            then: {
              properties: {
                city: {
                  type: 'string',
                  enum: ['New York City', 'Buffalo', 'Rochester'],
                },
              },
            },
            else: {
              if: {
                properties: {
                  state: {
                    const: 'California',
                  },
                },
                required: ['state'],
              },
              then: {
                properties: {
                  city: {
                    type: 'string',
                    enum: ['Los Angeles', 'San Diego', 'San Jose'],
                  },
                },
              },
            },
          },
        };

        const definitions = {};
        const formData = {
          country: 'USA',
          state: 'New York',
        };

        expect(retrieveSchema(schemaWithNested, definitions, formData)).eql({
          type: 'object',
          properties: {
            country: {
              enum: ['USA'],
            },
            state: { type: 'string', enum: ['California', 'New York'] },
            city: {
              type: 'string',
              enum: ['New York City', 'Buffalo', 'Rochester'],
            },
          },
          required: ['country', 'state'],
        });
      });
      it('overrides the base schema with a conditional branch when merged', () => {
        const schema = {
          type: 'object',
          properties: {
            myString: {
              type: 'string',
              minLength: 5,
            },
          },
          if: true,
          then: {
            properties: {
              myString: {
                minLength: 10, // This value of minLength should override the original value
              },
            },
          },
        };
        const definitions = {};
        const formData = {};
        expect(retrieveSchema(schema, { definitions }, formData)).eql({
          type: 'object',
          properties: {
            myString: {
              type: 'string',
              minLength: 10,
            },
          },
        });
      });
    });
  });

  describe('toIdSchema', () => {
    it('should return an idSchema for root field', () => {
      const schema = { type: 'string' };

      expect(toIdSchema(schema)).eql({ $id: 'root' });
    });

    it('should return an idSchema for nested objects', () => {
      const schema = {
        type: 'object',
        properties: {
          level1: {
            type: 'object',
            properties: {
              level2: { type: 'string' },
            },
          },
        },
      };

      expect(toIdSchema(schema)).eql({
        $id: 'root',
        level1: {
          $id: 'root_level1',
          level2: { $id: 'root_level1_level2' },
        },
      });
    });

    it('should return an idSchema for multiple nested objects', () => {
      const schema = {
        type: 'object',
        properties: {
          level1a: {
            type: 'object',
            properties: {
              level1a2a: { type: 'string' },
              level1a2b: { type: 'string' },
            },
          },
          level1b: {
            type: 'object',
            properties: {
              level1b2a: { type: 'string' },
              level1b2b: { type: 'string' },
            },
          },
        },
      };

      expect(toIdSchema(schema)).eql({
        $id: 'root',
        level1a: {
          $id: 'root_level1a',
          level1a2a: { $id: 'root_level1a_level1a2a' },
          level1a2b: { $id: 'root_level1a_level1a2b' },
        },
        level1b: {
          $id: 'root_level1b',
          level1b2a: { $id: 'root_level1b_level1b2a' },
          level1b2b: { $id: 'root_level1b_level1b2b' },
        },
      });
    });

    it('schema with an id property must not corrupt the idSchema', () => {
      const schema = {
        type: 'object',
        properties: {
          metadata: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
              },
            },
            required: ['id'],
          },
        },
      };
      expect(toIdSchema(schema)).eql({
        $id: 'root',
        metadata: {
          $id: 'root_metadata',
          id: { $id: 'root_metadata_id' },
        },
      });
    });

    it('should return an idSchema for array item objects', () => {
      const schema = {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            foo: { type: 'string' },
          },
        },
      };

      expect(toIdSchema(schema)).eql({
        $id: 'root',
        foo: { $id: 'root_foo' },
      });
    });

    it('should retrieve referenced schema definitions', () => {
      const schema = {
        definitions: {
          testdef: {
            type: 'object',
            properties: {
              foo: { type: 'string' },
              bar: { type: 'string' },
            },
          },
        },
        $ref: '#/definitions/testdef',
      };

      expect(toIdSchema(schema, undefined, schema)).eql({
        $id: 'root',
        foo: { $id: 'root_foo' },
        bar: { $id: 'root_bar' },
      });
    });

    it('should return an idSchema for property dependencies', () => {
      const schema = {
        type: 'object',
        properties: {
          foo: { type: 'string' },
        },
        dependencies: {
          foo: {
            properties: {
              bar: { type: 'string' },
            },
          },
        },
      };
      const formData = {
        foo: 'test',
      };

      expect(toIdSchema(schema, undefined, schema, formData)).eql({
        $id: 'root',
        foo: { $id: 'root_foo' },
        bar: { $id: 'root_bar' },
      });
    });

    it('should return an idSchema for nested property dependencies', () => {
      const schema = {
        type: 'object',
        properties: {
          obj: {
            type: 'object',
            properties: {
              foo: { type: 'string' },
            },
            dependencies: {
              foo: {
                properties: {
                  bar: { type: 'string' },
                },
              },
            },
          },
        },
      };
      const formData = {
        obj: {
          foo: 'test',
        },
      };

      expect(toIdSchema(schema, undefined, schema, formData)).eql({
        $id: 'root',
        obj: {
          $id: 'root_obj',
          foo: { $id: 'root_obj_foo' },
          bar: { $id: 'root_obj_bar' },
        },
      });
    });

    it('should return an idSchema for unmet property dependencies', () => {
      const schema = {
        type: 'object',
        properties: {
          foo: { type: 'string' },
        },
        dependencies: {
          foo: {
            properties: {
              bar: { type: 'string' },
            },
          },
        },
      };

      const formData = {};

      expect(toIdSchema(schema, undefined, schema, formData)).eql({
        $id: 'root',
        foo: { $id: 'root_foo' },
      });
    });

    it('should handle idPrefix parameter', () => {
      const schema = {
        definitions: {
          testdef: {
            type: 'object',
            properties: {
              foo: { type: 'string' },
              bar: { type: 'string' },
            },
          },
        },
        $ref: '#/definitions/testdef',
      };

      expect(toIdSchema(schema, undefined, schema, {}, 'rjsf')).eql({
        $id: 'rjsf',
        foo: { $id: 'rjsf_foo' },
        bar: { $id: 'rjsf_bar' },
      });
    });

    it('should handle idSeparator parameter', () => {
      const schema = {
        definitions: {
          testdef: {
            type: 'object',
            properties: {
              foo: { type: 'string' },
              bar: { type: 'string' },
            },
          },
        },
        $ref: '#/definitions/testdef',
      };

      expect(toIdSchema(schema, undefined, schema, {}, 'rjsf', '/')).eql({
        $id: 'rjsf',
        foo: { $id: 'rjsf/foo' },
        bar: { $id: 'rjsf/bar' },
      });
    });

    it('should handle null form data for object schemas', () => {
      const schema = {
        type: 'object',
        properties: {
          foo: { type: 'string' },
          bar: { type: 'string' },
        },
      };
      const formData = null;
      const result = toIdSchema(schema, null, {}, formData, 'rjsf');

      expect(result).eql({
        $id: 'rjsf',
        foo: { $id: 'rjsf_foo' },
        bar: { $id: 'rjsf_bar' },
      });
    });
  });

  describe('toPathSchema', () => {
    it('should return a pathSchema for root field', () => {
      const schema = { type: 'string' };

      expect(toPathSchema(schema)).eql({ $name: '' });
    });

    it('should return a pathSchema for nested objects', () => {
      const schema = {
        type: 'object',
        properties: {
          level1: {
            type: 'object',
            properties: {
              level2: { type: 'string' },
            },
          },
        },
      };

      expect(toPathSchema(schema)).eql({
        $name: '',
        level1: {
          $name: 'level1',
          level2: { $name: 'level1.level2' },
        },
      });
    });

    it('should return a pathSchema for a schema with dependencies', () => {
      const schema = {
        type: 'object',
        properties: {
          list: {
            title: 'list',
            type: 'array',
            items: {
              type: 'object',
              properties: {
                a: { type: 'string' },
                b: { type: 'string' },
              },
              dependencies: {
                b: {
                  properties: {
                    c: {
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
        },
      };

      const formData = {
        list: [
          {
            a: 'a1',
            b: 'b1',
            c: 'c1',
          },
          {
            a: 'a2',
          },
          {
            a: 'a2',
            c: 'c2',
          },
        ],
      };

      expect(toPathSchema(schema, '', schema, formData)).eql({
        $name: '',
        list: {
          $name: 'list',
          '0': {
            $name: 'list.0',
            a: {
              $name: 'list.0.a',
            },
            b: {
              $name: 'list.0.b',
            },
            c: {
              $name: 'list.0.c',
            },
          },
          '1': {
            $name: 'list.1',
            a: {
              $name: 'list.1.a',
            },
            b: {
              $name: 'list.1.b',
            },
          },
          '2': {
            $name: 'list.2',
            a: {
              $name: 'list.2.a',
            },
            b: {
              $name: 'list.2.b',
            },
          },
        },
      });
    });

    it('should return a pathSchema for a schema with references', () => {
      const schema = {
        definitions: {
          address: {
            type: 'object',
            properties: {
              street_address: {
                type: 'string',
              },
              city: {
                type: 'string',
              },
              state: {
                type: 'string',
              },
            },
            required: ['street_address', 'city', 'state'],
          },
        },
        type: 'object',
        properties: {
          billing_address: {
            title: 'Billing address',
            $ref: '#/definitions/address',
          },
        },
      };

      const formData = {
        billing_address: {
          street_address: '21, Jump Street',
          city: 'Babel',
          state: 'Neverland',
        },
      };

      expect(toPathSchema(schema, '', schema, formData)).eql({
        $name: '',
        billing_address: {
          $name: 'billing_address',
          city: {
            $name: 'billing_address.city',
          },
          state: {
            $name: 'billing_address.state',
          },
          street_address: {
            $name: 'billing_address.street_address',
          },
        },
      });
    });

    it('should return a pathSchema for a schema with references in an array item', () => {
      const schema = {
        definitions: {
          address: {
            type: 'object',
            properties: {
              street_address: {
                type: 'string',
              },
              city: {
                type: 'string',
              },
              state: {
                type: 'string',
              },
            },
            required: ['street_address', 'city', 'state'],
          },
        },
        type: 'object',
        properties: {
          address_list: {
            title: 'Address list',
            type: 'array',
            items: {
              $ref: '#/definitions/address',
            },
          },
        },
      };

      const formData = {
        address_list: [
          {
            street_address: '21, Jump Street',
            city: 'Babel',
            state: 'Neverland',
          },
          {
            street_address: '1234 Schema Rd.',
            city: 'New York',
            state: 'Arizona',
          },
        ],
      };

      expect(toPathSchema(schema, '', schema, formData)).eql({
        $name: '',
        address_list: {
          $name: 'address_list',
          '0': {
            $name: 'address_list.0',
            city: {
              $name: 'address_list.0.city',
            },
            state: {
              $name: 'address_list.0.state',
            },
            street_address: {
              $name: 'address_list.0.street_address',
            },
          },
          '1': {
            $name: 'address_list.1',
            city: {
              $name: 'address_list.1.city',
            },
            state: {
              $name: 'address_list.1.state',
            },
            street_address: {
              $name: 'address_list.1.street_address',
            },
          },
        },
      });
    });

    it('should return an pathSchema with different types of arrays', () => {
      const schema = {
        definitions: {
          Thing: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                default: 'Default name',
              },
            },
          },
        },
        type: 'object',
        properties: {
          listOfStrings: {
            type: 'array',
            title: 'A list of strings',
            items: {
              type: 'string',
              default: 'bazinga',
            },
          },
          multipleChoicesList: {
            type: 'array',
            title: 'A multiple choices list',
            items: {
              type: 'string',
              enum: ['foo', 'bar', 'fuzz', 'qux'],
            },
            uniqueItems: true,
          },
          fixedItemsList: {
            type: 'array',
            title: 'A list of fixed items',
            items: [
              {
                title: 'A string value',
                type: 'string',
                default: 'lorem ipsum',
              },
              {
                title: 'a boolean value',
                type: 'boolean',
              },
            ],
            additionalItems: {
              title: 'Additional item',
              type: 'number',
            },
          },
          minItemsList: {
            type: 'array',
            title: 'A list with a minimal number of items',
            minItems: 3,
            items: {
              $ref: '#/definitions/Thing',
            },
          },
          defaultsAndMinItems: {
            type: 'array',
            title: 'List and item level defaults',
            minItems: 5,
            default: ['carp', 'trout', 'bream'],
            items: {
              type: 'string',
              default: 'unidentified',
            },
          },
          nestedList: {
            type: 'array',
            title: 'Nested list',
            items: {
              type: 'array',
              title: 'Inner list',
              items: {
                type: 'string',
                default: 'lorem ipsum',
              },
            },
          },
          listOfObjects: {
            type: 'array',
            title: 'List of objects',
            items: {
              type: 'object',
              title: 'Object in list',
              properties: {
                name: {
                  type: 'string',
                  default: 'Default name',
                },
                id: {
                  type: 'number',
                  default: 'an id',
                },
              },
            },
          },
          unorderable: {
            title: 'Unorderable items',
            type: 'array',
            items: {
              type: 'string',
              default: 'lorem ipsum',
            },
          },
          unremovable: {
            title: 'Unremovable items',
            type: 'array',
            items: {
              type: 'string',
              default: 'lorem ipsum',
            },
          },
          noToolbar: {
            title: 'No add, remove and order buttons',
            type: 'array',
            items: {
              type: 'string',
              default: 'lorem ipsum',
            },
          },
          fixedNoToolbar: {
            title: 'Fixed array without buttons',
            type: 'array',
            items: [
              {
                title: 'A number',
                type: 'number',
                default: 42,
              },
              {
                title: 'A boolean',
                type: 'boolean',
                default: false,
              },
            ],
            additionalItems: {
              title: 'A string',
              type: 'string',
              default: 'lorem ipsum',
            },
          },
        },
      };

      const formData = {
        listOfStrings: ['foo', 'bar'],
        multipleChoicesList: ['foo', 'bar'],
        fixedItemsList: ['Some text', true, 123],
        minItemsList: [
          {
            name: 'Default name',
          },
          {
            name: 'Default name',
          },
          {
            name: 'Default name',
          },
        ],
        defaultsAndMinItems: [
          'carp',
          'trout',
          'bream',
          'unidentified',
          'unidentified',
        ],
        nestedList: [['lorem', 'ipsum'], ['dolor']],
        listOfObjects: [
          { name: 'name1', id: 123 },
          { name: 'name2', id: 1234 },
          { id: 12345 },
        ],
        unorderable: ['one', 'two'],
        unremovable: ['one', 'two'],
        noToolbar: ['one', 'two'],
        fixedNoToolbar: [
          42,
          true,
          'additional item one',
          'additional item two',
        ],
      };

      expect(toPathSchema(schema, '', schema, formData)).eql({
        $name: '',
        defaultsAndMinItems: {
          $name: 'defaultsAndMinItems',
          '0': {
            $name: 'defaultsAndMinItems.0',
          },
          '1': {
            $name: 'defaultsAndMinItems.1',
          },
          '2': {
            $name: 'defaultsAndMinItems.2',
          },
          '3': {
            $name: 'defaultsAndMinItems.3',
          },
          '4': {
            $name: 'defaultsAndMinItems.4',
          },
        },
        fixedItemsList: {
          $name: 'fixedItemsList',
          '0': {
            $name: 'fixedItemsList.0',
          },
          '1': {
            $name: 'fixedItemsList.1',
          },
          '2': {
            $name: 'fixedItemsList.2',
          },
        },
        fixedNoToolbar: {
          $name: 'fixedNoToolbar',
          '0': {
            $name: 'fixedNoToolbar.0',
          },
          '1': {
            $name: 'fixedNoToolbar.1',
          },
          '2': {
            $name: 'fixedNoToolbar.2',
          },
          '3': {
            $name: 'fixedNoToolbar.3',
          },
        },
        listOfObjects: {
          $name: 'listOfObjects',
          '0': {
            $name: 'listOfObjects.0',
            id: {
              $name: 'listOfObjects.0.id',
            },
            name: {
              $name: 'listOfObjects.0.name',
            },
          },
          '1': {
            $name: 'listOfObjects.1',
            id: {
              $name: 'listOfObjects.1.id',
            },
            name: {
              $name: 'listOfObjects.1.name',
            },
          },
          '2': {
            $name: 'listOfObjects.2',
            id: {
              $name: 'listOfObjects.2.id',
            },
            name: {
              $name: 'listOfObjects.2.name',
            },
          },
        },
        listOfStrings: {
          $name: 'listOfStrings',
          '0': {
            $name: 'listOfStrings.0',
          },
          '1': {
            $name: 'listOfStrings.1',
          },
        },
        minItemsList: {
          $name: 'minItemsList',
          '0': {
            $name: 'minItemsList.0',
            name: {
              $name: 'minItemsList.0.name',
            },
          },
          '1': {
            $name: 'minItemsList.1',
            name: {
              $name: 'minItemsList.1.name',
            },
          },
          '2': {
            $name: 'minItemsList.2',
            name: {
              $name: 'minItemsList.2.name',
            },
          },
        },
        multipleChoicesList: {
          $name: 'multipleChoicesList',
          '0': {
            $name: 'multipleChoicesList.0',
          },
          '1': {
            $name: 'multipleChoicesList.1',
          },
        },
        nestedList: {
          $name: 'nestedList',
          '0': {
            $name: 'nestedList.0',
            '0': {
              $name: 'nestedList.0.0',
            },
            '1': {
              $name: 'nestedList.0.1',
            },
          },
          '1': {
            $name: 'nestedList.1',
            '0': {
              $name: 'nestedList.1.0',
            },
          },
        },
        noToolbar: {
          $name: 'noToolbar',
          '0': {
            $name: 'noToolbar.0',
          },
          '1': {
            $name: 'noToolbar.1',
          },
        },
        unorderable: {
          $name: 'unorderable',
          '0': {
            $name: 'unorderable.0',
          },
          '1': {
            $name: 'unorderable.1',
          },
        },
        unremovable: {
          $name: 'unremovable',
          '0': {
            $name: 'unremovable.0',
          },
          '1': {
            $name: 'unremovable.1',
          },
        },
      });
    });
  });

  describe('getDisplayLabel', () => {
    it('object type', () => {
      expect(getDisplayLabel({ type: 'object' }, {})).eql(false);
    });
    it('boolean type without widget', () => {
      expect(getDisplayLabel({ type: 'boolean' }, {})).eql(false);
    });
    it('boolean type with widget', () => {
      expect(getDisplayLabel({ type: 'boolean' }, { 'ui:widget': 'test' })).eql(
        true
      );
    });
    it('with ui:field', () => {
      expect(getDisplayLabel({ type: 'string' }, { 'ui:field': 'test' })).eql(
        false
      );
    });
    describe('array type', () => {
      it('items', () => {
        expect(
          getDisplayLabel({ type: 'array', items: { type: 'string' } }, {})
        ).eql(false);
      });
      it('items enum', () => {
        expect(
          getDisplayLabel({ type: 'array', enum: ['NW', 'NE', 'SW', 'SE'] }, {})
        ).eql(false);
      });
      it('files type', () => {
        expect(
          getDisplayLabel({ type: 'array' }, { 'ui:widget': 'files' })
        ).eql(true);
      });
      it('custom type', () => {
        expect(
          getDisplayLabel(
            { type: 'array', title: 'myAwesomeTitle' },
            { 'ui:widget': 'MyAwesomeWidget' }
          )
        ).eql(true);
      });
    });
  });

  describe('getMatchingOption()', () => {
    it('should infer correct anyOf schema based on data if passing undefined', () => {
      const rootSchema = {
        defs: {
          a: { type: 'object', properties: { id: { enum: ['a'] } } },
          nested: {
            type: 'object',
            properties: {
              id: { enum: ['nested'] },
              child: { $ref: '#/defs/any' },
            },
          },
          any: { anyOf: [{ $ref: '#/defs/a' }, { $ref: '#/defs/nested' }] },
        },
        $ref: '#/defs/any',
      };
      const options = [
        { type: 'object', properties: { id: { enum: ['a'] } } },
        {
          type: 'object',
          properties: {
            id: { enum: ['nested'] },
            child: { $ref: '#/defs/any' },
          },
        },
      ];
      expect(getMatchingOption(undefined, options, rootSchema)).eql(0);
    });
    it('should infer correct anyOf schema based on data if passing null and option 2 is {type: null}', () => {
      const rootSchema = {
        defs: {
          a: { type: 'object', properties: { id: { enum: ['a'] } } },
          nested: {
            type: 'object',
            properties: {
              id: { enum: ['nested'] },
              child: { $ref: '#/defs/any' },
            },
          },
          any: { anyOf: [{ $ref: '#/defs/a' }, { $ref: '#/defs/nested' }] },
        },
        $ref: '#/defs/any',
      };
      const options = [
        { type: 'string' },
        { type: 'string' },
        { type: 'null' },
      ];
      expect(getMatchingOption(null, options, rootSchema)).eql(2);
    });
    it('should infer correct anyOf schema based on data', () => {
      const rootSchema = {
        defs: {
          a: { type: 'object', properties: { id: { enum: ['a'] } } },
          nested: {
            type: 'object',
            properties: {
              id: { enum: ['nested'] },
              child: { $ref: '#/defs/any' },
            },
          },
          any: { anyOf: [{ $ref: '#/defs/a' }, { $ref: '#/defs/nested' }] },
        },
        $ref: '#/defs/any',
      };
      const options = [
        { type: 'object', properties: { id: { enum: ['a'] } } },
        {
          type: 'object',
          properties: {
            id: { enum: ['nested'] },
            child: { $ref: '#/defs/any' },
          },
        },
      ];
      const formData = {
        id: 'nested',
        child: {
          id: 'nested',
          child: {
            id: 'a',
          },
        },
      };
      expect(getMatchingOption(formData, options, rootSchema)).eql(1);
    });
  });
});
