import {
  asNumber,
  dataURItoBlob,
  deepEquals,
  getDefaultFormState,
  isFilesArray,
  isConstant,
  toConstant,
  isMultiSelect,
  mergeObjects,
  pad,
  parseDateString,
  retrieveSchema,
  shouldRender,
  toDateString,
  toIdSchema
} from 'react-jsonschema-form/src/utils';

describe('utils', () => {
  describe('getDefaultFormState()', () => {
    describe('root default', () => {
      it('should map root schema default to form state, if any', () => {
        expect(
          getDefaultFormState({
            type: 'string',
            default: 'foo'
          })
        ).toEqual('foo');
      });
    });

    describe('nested default', () => {
      it('should map schema object prop default to form state', () => {
        expect(
          getDefaultFormState({
            type: 'object',
            properties: {
              string: {
                type: 'string',
                default: 'foo'
              }
            }
          })
        ).toEqual({ string: 'foo' });
      });

      it('should default to empty object if no properties are defined', () => {
        expect(
          getDefaultFormState({
            type: 'object'
          })
        ).toEqual({});
      });

      it('should recursively map schema object default to form state', () => {
        expect(
          getDefaultFormState({
            type: 'object',
            properties: {
              object: {
                type: 'object',
                properties: {
                  string: {
                    type: 'string',
                    default: 'foo'
                  }
                }
              }
            }
          })
        ).toEqual({ object: { string: 'foo' } });
      });

      it('should map schema array default to form state', () => {
        expect(
          getDefaultFormState({
            type: 'object',
            properties: {
              array: {
                type: 'array',
                default: ['foo', 'bar'],
                items: {
                  type: 'string'
                }
              }
            }
          })
        ).toEqual({ array: ['foo', 'bar'] });
      });

      it('should recursively map schema array default to form state', () => {
        expect(
          getDefaultFormState({
            type: 'object',
            properties: {
              object: {
                type: 'object',
                properties: {
                  array: {
                    type: 'array',
                    default: ['foo', 'bar'],
                    items: {
                      type: 'string'
                    }
                  }
                }
              }
            }
          })
        ).toEqual({ object: { array: ['foo', 'bar'] } });
      });

      it('should propagate nested defaults to resulting formData by default', () => {
        const schema = {
          type: 'object',
          properties: {
            object: {
              type: 'object',
              properties: {
                array: {
                  type: 'array',
                  default: ['foo', 'bar'],
                  items: {
                    type: 'string'
                  }
                },
                bool: {
                  type: 'boolean',
                  default: true
                }
              }
            }
          }
        };
        expect(getDefaultFormState(schema, {})).toEqual({
          object: { array: ['foo', 'bar'], bool: true }
        });
      });

      it('should keep parent defaults if they don\'t have a node level default', () => {
        const schema = {
          type: 'object',
          properties: {
            level1: {
              type: 'object',
              default: {
                level2: {
                  leaf1: 1,
                  leaf2: 1,
                  leaf3: 1,
                  leaf4: 1
                }
              },
              properties: {
                level2: {
                  type: 'object',
                  default: {
                    // No level2 default for leaf1
                    leaf2: 2,
                    leaf3: 2
                  },
                  properties: {
                    leaf1: { type: 'number' }, // No level2 default for leaf1
                    leaf2: { type: 'number' }, // No level3 default for leaf2
                    leaf3: { type: 'number', default: 3 },
                    leaf4: { type: 'number' } // Defined in formData.
                  }
                }
              }
            }
          }
        };
        expect(
          getDefaultFormState(schema, {
            level1: { level2: { leaf4: 4 } }
          })
        ).toEqual({
          level1: {
            level2: { leaf1: 1, leaf2: 2, leaf3: 3, leaf4: 4 }
          }
        });
      });

      it('should use parent defaults for ArrayFields', () => {
        const schema = {
          type: 'object',
          properties: {
            level1: {
              type: 'array',
              default: [1, 2, 3],
              items: { type: 'number' }
            }
          }
        };
        expect(getDefaultFormState(schema, {})).toEqual({
          level1: [1, 2, 3]
        });
      });

      it('should use parent defaults for ArrayFields if declared in parent', () => {
        const schema = {
          type: 'object',
          default: { level1: [1, 2, 3] },
          properties: {
            level1: {
              type: 'array',
              items: { type: 'number' }
            }
          }
        };
        expect(getDefaultFormState(schema, {})).toEqual({
          level1: [1, 2, 3]
        });
      });

      it('should map item defaults to fixed array default', () => {
        const schema = {
          type: 'object',
          properties: {
            array: {
              type: 'array',
              items: [
                {
                  type: 'string',
                  default: 'foo'
                },
                {
                  type: 'number'
                }
              ]
            }
          }
        };
        expect(getDefaultFormState(schema, {})).toEqual({
          array: ['foo', undefined]
        });
      });

      it('should use schema default for referenced definitions', () => {
        const schema = {
          definitions: {
            testdef: {
              type: 'object',
              properties: {
                foo: { type: 'number' }
              }
            }
          },
          $ref: '#/definitions/testdef',
          default: { foo: 42 }
        };

        expect(
          getDefaultFormState(schema, undefined, schema.definitions)
        ).toEqual({
          foo: 42
        });
      });
    });
  });

  describe('asNumber()', () => {
    it('should return a number out of a string representing a number', () => {
      expect(asNumber('3')).toEqual(3);
    });

    it('should return a float out of a string representing a float', () => {
      expect(asNumber('3.14')).toEqual(3.14);
    });

    it('should return the raw value if the input ends with a dot', () => {
      expect(asNumber('3.')).toEqual('3.');
    });

    it('should not convert the value to an integer if the input ends with a 0', () => {
      // this is to allow users to input 3.07
      expect(asNumber('3.0')).toEqual('3.0');
    });

    it('should allow numbers with a 0 in the first decimal place', () => {
      expect(asNumber('3.07')).toEqual(3.07);
    });

    it('should return undefined if the input is empty', () => {
      expect(asNumber('')).toEqual(undefined);
    });
  });

  describe('isConstant', () => {
    it('should return false when neither enum nor const is defined', () => {
      const schema = {};
      expect(isConstant(schema)).toBe(false);
    });

    it('should return true when schema enum is an array of one item', () => {
      const schema = { enum: ['foo'] };
      expect(isConstant(schema)).toBe(true);
    });

    it('should return false when schema enum contains several items', () => {
      const schema = { enum: ['foo', 'bar', 'baz'] };
      expect(isConstant(schema)).toBe(false);
    });

    it('should return true when schema const is defined', () => {
      const schema = { const: 'foo' };
      expect(isConstant(schema)).toBe(true);
    });
  });

  describe('toConstant()', () => {
    describe('schema contains an enum array', () => {
      it('should return its first value when it contains a unique element', () => {
        const schema = { enum: ['foo'] };
        expect(toConstant(schema)).toEqual('foo');
      });

      it('should return schema const value when it exists', () => {
        const schema = { const: 'bar' };
        expect(toConstant(schema)).toEqual('bar');
      });

      it('should throw when it contains more than one element', () => {
        const schema = { enum: ['foo', 'bar'] };
        expect(() => {
          toConstant(schema);
        }).toThrowError(Error);
      });
    });
  });

  describe('isMultiSelect()', () => {
    describe('uniqueItems is true', () => {
      describe('schema items enum is an array', () => {
        it('should be true', () => {
          let schema = {
            items: { enum: ['foo', 'bar'] },
            uniqueItems: true
          };
          expect(isMultiSelect(schema)).toBe(true);
        });
      });

      it('should be false if items is undefined', () => {
        const schema = {};
        expect(isMultiSelect(schema)).toBe(false);
      });

      describe('schema items enum is not an array', () => {
        const constantSchema = { type: 'string', enum: ['Foo'] };
        const notConstantSchema = { type: 'string' };

        it('should be false if oneOf/anyOf is not in items schema', () => {
          const schema = { items: {}, uniqueItems: true };
          expect(isMultiSelect(schema)).toBe(false);
        });

        it('should be false if oneOf/anyOf schemas are not all constants', () => {
          const schema = {
            items: { oneOf: [constantSchema, notConstantSchema] },
            uniqueItems: true
          };
          expect(isMultiSelect(schema)).toBe(false);
        });

        it('should be true if oneOf/anyOf schemas are all constants', () => {
          const schema = {
            items: { oneOf: [constantSchema, constantSchema] },
            uniqueItems: true
          };
          expect(isMultiSelect(schema)).toBe(true);
        });
      });

      it('should retrieve reference schema definitions', () => {
        const schema = {
          items: { $ref: '#/definitions/FooItem' },
          uniqueItems: true
        };
        const definitions = {
          FooItem: { type: 'string', enum: ['foo'] }
        };
        expect(isMultiSelect(schema, definitions)).toBe(true);
      });
    });

    it('should be false if uniqueItems is false', () => {
      const schema = {
        items: { enum: ['foo', 'bar'] },
        uniqueItems: false
      };
      expect(isMultiSelect(schema)).toBe(false);
    });
  });

  describe('isFilesArray()', () => {
    it('should be true if items have data-url format', () => {
      const schema = { items: { type: 'string', format: 'data-url' } };
      const uiSchema = {};
      expect(isFilesArray(schema, uiSchema)).toBe(true);
    });

    it('should be false if items is undefined', () => {
      const schema = {};
      const uiSchema = {};
      expect(isFilesArray(schema, uiSchema)).toBe(false);
    });
  });

  describe('mergeObjects()', () => {
    it('should\'t mutate the provided objects', () => {
      const obj1 = { a: 1 };
      mergeObjects(obj1, { b: 2 });
      expect(obj1).toEqual({ a: 1 });
    });

    it('should merge two one-level deep objects', () => {
      expect(mergeObjects({ a: 1 }, { b: 2 })).toEqual({ a: 1, b: 2 });
    });

    it('should override the first object with the values from the second', () => {
      expect(mergeObjects({ a: 1 }, { a: 2 })).toEqual({ a: 2 });
    });

    it('should recursively merge deeply nested objects', () => {
      const obj1 = {
        a: 1,
        b: {
          c: 3,
          d: [1, 2, 3],
          e: { f: { g: 1 } }
        },
        c: 2
      };
      const obj2 = {
        a: 1,
        b: {
          d: [3, 2, 1],
          e: { f: { h: 2 } },
          g: 1
        },
        c: 3
      };
      const expected = {
        a: 1,
        b: {
          c: 3,
          d: [3, 2, 1],
          e: { f: { g: 1, h: 2 } },
          g: 1
        },
        c: 3
      };
      expect(mergeObjects(obj1, obj2)).toEqual(expected);
    });

    describe('concatArrays option', () => {
      it('should not concat arrays by default', () => {
        const obj1 = { a: [1] };
        const obj2 = { a: [2] };

        expect(mergeObjects(obj1, obj2)).toEqual({ a: [2] });
      });

      it('should concat arrays when concatArrays is true', () => {
        const obj1 = { a: [1] };
        const obj2 = { a: [2] };

        expect(mergeObjects(obj1, obj2, true)).toEqual({ a: [1, 2] });
      });

      it('should concat nested arrays when concatArrays is true', () => {
        const obj1 = { a: { b: [1] } };
        const obj2 = { a: { b: [2] } };

        expect(mergeObjects(obj1, obj2, true)).toEqual({
          a: { b: [1, 2] }
        });
      });
    });
  });

  describe('retrieveSchema()', () => {
    it('should \'resolve\' a schema which contains definitions', () => {
      const schema = { $ref: '#/definitions/address' };
      const address = {
        type: 'object',
        properties: {
          street_address: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' }
        },
        required: ['street_address', 'city', 'state']
      };
      const definitions = { address };

      expect(retrieveSchema(schema, definitions)).toEqual(address);
    });

    it('should \'resolve\' escaped JSON Pointers', () => {
      const schema = { $ref: '#/definitions/a~0complex~1name' };
      const address = { type: 'string' };
      const definitions = { 'a~complex/name': address };

      expect(retrieveSchema(schema, definitions)).toEqual(address);
    });

    it('should priorize local definitions over foreign ones', () => {
      const schema = {
        $ref: '#/definitions/address',
        title: 'foo'
      };
      const address = {
        type: 'string',
        title: 'bar'
      };
      const definitions = { address };

      expect(retrieveSchema(schema, definitions)).toEqual({
        ...address,
        title: 'foo'
      });
    });

    describe('property dependencies', () => {
      describe('false condition', () => {
        it('should not add required properties', () => {
          const schema = {
            type: 'object',
            properties: {
              a: { type: 'string' },
              b: { type: 'integer' }
            },
            required: ['a'],
            dependencies: {
              a: ['b']
            }
          };
          const definitions = {};
          const formData = {};
          expect(retrieveSchema(schema, definitions, formData)).toEqual({
            type: 'object',
            properties: {
              a: { type: 'string' },
              b: { type: 'integer' }
            },
            required: ['a']
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
                b: { type: 'integer' }
              },
              dependencies: {
                a: ['b']
              }
            };
            const definitions = {};
            const formData = { a: '1' };
            expect(retrieveSchema(schema, definitions, formData)).toEqual({
              type: 'object',
              properties: {
                a: { type: 'string' },
                b: { type: 'integer' }
              },
              required: ['b']
            });
          });
        });

        describe('when required is defined', () => {
          it('should concat required properties', () => {
            const schema = {
              type: 'object',
              properties: {
                a: { type: 'string' },
                b: { type: 'integer' }
              },
              required: ['a'],
              dependencies: {
                a: ['b']
              }
            };
            const definitions = {};
            const formData = { a: '1' };
            expect(retrieveSchema(schema, definitions, formData)).toEqual({
              type: 'object',
              properties: {
                a: { type: 'string' },
                b: { type: 'integer' }
              },
              required: ['a', 'b']
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
                a: { type: 'string' }
              },
              dependencies: {
                a: {
                  properties: {
                    b: { type: 'integer' }
                  }
                }
              }
            };
            const definitions = {};
            const formData = {};
            expect(retrieveSchema(schema, definitions, formData)).toEqual({
              type: 'object',
              properties: {
                a: { type: 'string' }
              }
            });
          });
        });

        describe('true condition', () => {
          it('should add properties', () => {
            const schema = {
              type: 'object',
              properties: {
                a: { type: 'string' }
              },
              dependencies: {
                a: {
                  properties: {
                    b: { type: 'integer' }
                  }
                }
              }
            };
            const definitions = {};
            const formData = { a: '1' };
            expect(retrieveSchema(schema, definitions, formData)).toEqual({
              type: 'object',
              properties: {
                a: { type: 'string' },
                b: { type: 'integer' }
              }
            });
          });
        });

        describe('with $ref in dependency', () => {
          it('should retrieve referenced schema', () => {
            const schema = {
              type: 'object',
              properties: {
                a: { type: 'string' }
              },
              dependencies: {
                a: {
                  $ref: '#/definitions/needsB'
                }
              }
            };
            const definitions = {
              needsB: {
                properties: {
                  b: { type: 'integer' }
                }
              }
            };
            const formData = { a: '1' };
            expect(retrieveSchema(schema, definitions, formData)).toEqual({
              type: 'object',
              properties: {
                a: { type: 'string' },
                b: { type: 'integer' }
              }
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
                a: { type: 'string' }
              },
              dependencies: {
                a: {
                  oneOf: [
                    {
                      properties: {
                        a: { enum: ['int'] },
                        b: { type: 'integer' }
                      }
                    },
                    {
                      properties: {
                        a: { enum: ['bool'] },
                        b: { type: 'boolean' }
                      }
                    }
                  ]
                }
              }
            };
            const definitions = {};
            const formData = {};
            expect(retrieveSchema(schema, definitions, formData)).toEqual({
              type: 'object',
              properties: {
                a: { type: 'string' }
              }
            });
          });
        });

        describe('true condition', () => {
          it('should add \'first\' properties given \'first\' data', () => {
            const schema = {
              type: 'object',
              properties: {
                a: { type: 'string', enum: ['int', 'bool'] }
              },
              dependencies: {
                a: {
                  oneOf: [
                    {
                      properties: {
                        a: { enum: ['int'] },
                        b: { type: 'integer' }
                      }
                    },
                    {
                      properties: {
                        a: { enum: ['bool'] },
                        b: { type: 'boolean' }
                      }
                    }
                  ]
                }
              }
            };
            const definitions = {};
            const formData = { a: 'int' };
            expect(retrieveSchema(schema, definitions, formData)).toEqual({
              type: 'object',
              properties: {
                a: { type: 'string', enum: ['int', 'bool'] },
                b: { type: 'integer' }
              }
            });
          });

          it('should add \'second\' properties given \'second\' data', () => {
            const schema = {
              type: 'object',
              properties: {
                a: { type: 'string', enum: ['int', 'bool'] }
              },
              dependencies: {
                a: {
                  oneOf: [
                    {
                      properties: {
                        a: { enum: ['int'] },
                        b: { type: 'integer' }
                      }
                    },
                    {
                      properties: {
                        a: { enum: ['bool'] },
                        b: { type: 'boolean' }
                      }
                    }
                  ]
                }
              }
            };
            const definitions = {};
            const formData = { a: 'bool' };
            expect(retrieveSchema(schema, definitions, formData)).toEqual({
              type: 'object',
              properties: {
                a: { type: 'string', enum: ['int', 'bool'] },
                b: { type: 'boolean' }
              }
            });
          });
        });

        describe('with $ref in dependency', () => {
          it('should retrieve the referenced schema', () => {
            const schema = {
              type: 'object',
              properties: {
                a: { type: 'string', enum: ['int', 'bool'] }
              },
              dependencies: {
                a: {
                  $ref: '#/definitions/typedInput'
                }
              }
            };
            const definitions = {
              typedInput: {
                oneOf: [
                  {
                    properties: {
                      a: { enum: ['int'] },
                      b: { type: 'integer' }
                    }
                  },
                  {
                    properties: {
                      a: { enum: ['bool'] },
                      b: { type: 'boolean' }
                    }
                  }
                ]
              }
            };
            const formData = { a: 'bool' };
            expect(retrieveSchema(schema, definitions, formData)).toEqual({
              type: 'object',
              properties: {
                a: { type: 'string', enum: ['int', 'bool'] },
                b: { type: 'boolean' }
              }
            });
          });
        });
      });
    });
  });

  describe('shouldRender', () => {
    describe('single level comparison checks', () => {
      const initial = { props: { myProp: 1 }, state: { myState: 1 } };

      it('should detect equivalent props and state', () => {
        expect(shouldRender(initial, { myProp: 1 }, { myState: 1 })).toEqual(
          false
        );
      });

      it('should detect diffing props', () => {
        expect(shouldRender(initial, { myProp: 2 }, { myState: 1 })).toEqual(
          true
        );
      });

      it('should detect diffing state', () => {
        expect(shouldRender(initial, { myProp: 1 }, { myState: 2 })).toEqual(
          true
        );
      });

      it('should handle equivalent function prop', () => {
        const fn = () => {};
        expect(
          shouldRender(
            { props: { myProp: fn }, state: { myState: 1 } },
            { myProp: fn },
            { myState: 1 }
          )
        ).toEqual(false);
      });
    });

    describe('nested levels comparison checks', () => {
      const initial = {
        props: { myProp: { mySubProp: 1 } },
        state: { myState: { mySubState: 1 } }
      };

      it('should detect equivalent props and state', () => {
        expect(
          shouldRender(
            initial,
            { myProp: { mySubProp: 1 } },
            { myState: { mySubState: 1 } }
          )
        ).toEqual(false);
      });

      it('should detect diffing props', () => {
        expect(
          shouldRender(
            initial,
            { myProp: { mySubProp: 2 } },
            { myState: { mySubState: 1 } }
          )
        ).toEqual(true);
      });

      it('should detect diffing state', () => {
        expect(
          shouldRender(
            initial,
            { myProp: { mySubProp: 1 } },
            { myState: { mySubState: 2 } }
          )
        ).toEqual(true);
      });

      it('should handle equivalent function prop', () => {
        const fn = () => {};
        expect(
          shouldRender(
            {
              props: { myProp: { mySubProp: fn } },
              state: { myState: { mySubState: fn } }
            },
            { myProp: { mySubProp: fn } },
            { myState: { mySubState: fn } }
          )
        ).toEqual(false);
      });
    });
  });

  describe('toIdSchema', () => {
    it('should return an idSchema for root field', () => {
      const schema = { type: 'string' };

      expect(toIdSchema(schema)).toEqual({ $id: 'root' });
    });

    it('should return an idSchema for nested objects', () => {
      const schema = {
        type: 'object',
        properties: {
          level1: {
            type: 'object',
            properties: {
              level2: { type: 'string' }
            }
          }
        }
      };

      expect(toIdSchema(schema)).toEqual({
        $id: 'root',
        level1: {
          $id: 'root_level1',
          level2: { $id: 'root_level1_level2' }
        }
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
              level1a2b: { type: 'string' }
            }
          },
          level1b: {
            type: 'object',
            properties: {
              level1b2a: { type: 'string' },
              level1b2b: { type: 'string' }
            }
          }
        }
      };

      expect(toIdSchema(schema)).toEqual({
        $id: 'root',
        level1a: {
          $id: 'root_level1a',
          level1a2a: { $id: 'root_level1a_level1a2a' },
          level1a2b: { $id: 'root_level1a_level1a2b' }
        },
        level1b: {
          $id: 'root_level1b',
          level1b2a: { $id: 'root_level1b_level1b2a' },
          level1b2b: { $id: 'root_level1b_level1b2b' }
        }
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
                type: 'string'
              }
            },
            required: ['id']
          }
        }
      };
      expect(toIdSchema(schema)).toEqual({
        $id: 'root',
        metadata: {
          $id: 'root_metadata',
          id: { $id: 'root_metadata_id' }
        }
      });
    });

    it('should return an idSchema for array item objects', () => {
      const schema = {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            foo: { type: 'string' }
          }
        }
      };

      expect(toIdSchema(schema)).toEqual({
        $id: 'root',
        foo: { $id: 'root_foo' }
      });
    });

    it('should retrieve referenced schema definitions', () => {
      const schema = {
        definitions: {
          testdef: {
            type: 'object',
            properties: {
              foo: { type: 'string' },
              bar: { type: 'string' }
            }
          }
        },
        $ref: '#/definitions/testdef'
      };

      expect(toIdSchema(schema, undefined, schema.definitions)).toEqual({
        $id: 'root',
        foo: { $id: 'root_foo' },
        bar: { $id: 'root_bar' }
      });
    });

    it('should handle idPrefix parameter', () => {
      const schema = {
        definitions: {
          testdef: {
            type: 'object',
            properties: {
              foo: { type: 'string' },
              bar: { type: 'string' }
            }
          }
        },
        $ref: '#/definitions/testdef'
      };

      expect(
        toIdSchema(schema, undefined, schema.definitions, {}, 'rjsf')
      ).toEqual({
        $id: 'rjsf',
        foo: { $id: 'rjsf_foo' },
        bar: { $id: 'rjsf_bar' }
      });
    });
  });

  describe('parseDateString()', () => {
    it('should raise on invalid JSON datetime', () => {
      expect(() => parseDateString('plop')).toThrowError(Error);
    });

    it('should return a default object when no datetime is passed', () => {
      expect(parseDateString()).toEqual({
        year: -1,
        month: -1,
        day: -1,
        hour: -1,
        minute: -1,
        second: -1
      });
    });

    it('should return a default object when time should not be included', () => {
      expect(parseDateString(undefined, false)).toEqual({
        year: -1,
        month: -1,
        day: -1,
        hour: 0,
        minute: 0,
        second: 0
      });
    });

    it('should parse a valid JSON datetime string', () => {
      expect(parseDateString('2016-04-05T14:01:30.182Z')).toEqual({
        year: 2016,
        month: 4,
        day: 5,
        hour: 14,
        minute: 1,
        second: 30
      });
    });

    it('should exclude time when includeTime is false', () => {
      expect(parseDateString('2016-04-05T14:01:30.182Z', false)).toEqual({
        year: 2016,
        month: 4,
        day: 5,
        hour: 0,
        minute: 0,
        second: 0
      });
    });
  });

  describe('toDateString()', () => {
    it('should transform an object to a valid json datetime if time=true', () => {
      expect(
        toDateString({
          year: 2016,
          month: 4,
          day: 5,
          hour: 14,
          minute: 1,
          second: 30
        })
      ).toEqual('2016-04-05T14:01:30.000Z');
    });

    it('should transform an object to a valid date string if time=false', () => {
      expect(
        toDateString(
          {
            year: 2016,
            month: 4,
            day: 5
          },
          false
        )
      ).toEqual('2016-04-05');
    });
  });

  describe('pad()', () => {
    it('should pad a string with 0s', () => {
      expect(pad(4, 3)).toEqual('004');
    });
  });

  describe('dataURItoBlob()', () => {
    it('should return the name of the file if present', () => {
      const { blob, name } = dataURItoBlob(
        'data:image/png;name=test.png;base64,VGVzdC5wbmc='
      );
      expect(name).toEqual('test.png');
      expect(blob).toHaveProperty('size', 8);
      expect(blob).toHaveProperty('type', 'image/png');
    });

    it('should return unknown if name is not provided', () => {
      const { blob, name } = dataURItoBlob(
        'data:image/png;base64,VGVzdC5wbmc='
      );
      expect(name).toEqual('unknown');
      expect(blob).toHaveProperty('size', 8);
      expect(blob).toHaveProperty('type', 'image/png');
    });

    it('should return ignore unsupported parameters', () => {
      const { blob, name } = dataURItoBlob(
        'data:image/png;unknown=foobar;name=test.png;base64,VGVzdC5wbmc='
      );
      expect(name).toEqual('test.png');
      expect(blob).toHaveProperty('size', 8);
      expect(blob).toHaveProperty('type', 'image/png');
    });
  });

  describe('deepEquals()', () => {
    // Note: deepEquals implementation being extracted from node-deeper, it's
    // worthless to reproduce all the tests existing for it; so we focus on the
    // behavioral differences we introduced.
    it('should assume functions are always equivalent', () => {
      expect(deepEquals(() => {}, () => {})).toEqual(true);
      expect(deepEquals({ foo() {} }, { foo() {} })).toEqual(true);
      expect(deepEquals({ foo: { bar() {} } }, { foo: { bar() {} } })).toEqual(
        true
      );
    });
  });
});
