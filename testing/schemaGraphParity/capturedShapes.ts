import type { ParityShape } from './types.ts';

/** Every schema that resolved a `$ref` while the utils and core test suites ran, plus the one playground sample that
 * does, captured by mocking `findSchemaDefinition`, filtered to the ones whose `$ref` graph has a cycle, and re-rooted at
 * each definition, with a `populateDefaults` variant where the schema has an `allOf`. `source` names the test that
 * produced the root; the cases after those pin the data and Expand clicks of the tests they name.
 */
export const capturedShapes: readonly ParityShape[] = [
  {
    name: '0',
    source:
      'utils/test/schema.test.ts :: getDefaultFormState() > object schemas > an object with additionalProperties type object with defaults and formdata > a recursive schema > getDefaultFormState',
    schema: {
      definitions: {
        '@enum': {
          type: 'object',
          properties: {
            name: {
              title: 'Name',
              type: 'string',
              default: '',
            },
            children: {
              $ref: '#/definitions/@enum',
            },
          },
        },
      },
      $ref: '#/definitions/@enum',
    },
  },
  {
    name: '1',
    source:
      'utils/test/schema.test.ts :: getDefaultFormState() > object schemas > an object with additionalProperties type object with defaults and formdata > a recursive schema whose then branch refers back to it > getDefaultFormState stops at the recursion the branch expanded',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              default: 'n',
            },
          },
          if: {},
          then: {
            properties: {
              child: {
                $ref: '#/definitions/node',
              },
            },
          },
        },
      },
      $ref: '#/definitions/node',
    },
  },
  {
    name: '2',
    source:
      'utils/test/schema.test.ts :: getDefaultFormState() > object schemas > an object with additionalProperties type object with defaults and formdata > a schema resolved from a $ref whose then branch is a $ref to a recursive definition > getDefaultFormState fills one level of the recursion, as it does for a $ref property',
    schema: {
      definitions: {
        parent: {
          type: 'object',
          properties: {
            a: {
              type: 'string',
            },
          },
          if: {},
          then: {
            $ref: '#/definitions/kid',
          },
        },
        kid: {
          type: 'object',
          properties: {
            tag: {
              type: 'string',
              default: 't',
            },
            kid: {
              $ref: '#/definitions/kid',
            },
          },
        },
      },
      type: 'object',
      properties: {
        p: {
          $ref: '#/definitions/parent',
        },
      },
    },
  },
  {
    name: '2 ->parent',
    source:
      'utils/test/schema.test.ts :: getDefaultFormState() > object schemas > an object with additionalProperties type object with defaults and formdata > a schema resolved from a $ref whose then branch is a $ref to a recursive definition > getDefaultFormState fills one level of the recursion, as it does for a $ref property',
    schema: {
      definitions: {
        parent: {
          type: 'object',
          properties: {
            a: {
              type: 'string',
            },
          },
          if: {},
          then: {
            $ref: '#/definitions/kid',
          },
        },
        kid: {
          type: 'object',
          properties: {
            tag: {
              type: 'string',
              default: 't',
            },
            kid: {
              $ref: '#/definitions/kid',
            },
          },
        },
      },
      $ref: '#/definitions/parent',
    },
  },
  {
    name: '2 ->kid',
    source:
      'utils/test/schema.test.ts :: getDefaultFormState() > object schemas > an object with additionalProperties type object with defaults and formdata > a schema resolved from a $ref whose then branch is a $ref to a recursive definition > getDefaultFormState fills one level of the recursion, as it does for a $ref property',
    schema: {
      definitions: {
        parent: {
          type: 'object',
          properties: {
            a: {
              type: 'string',
            },
          },
          if: {},
          then: {
            $ref: '#/definitions/kid',
          },
        },
        kid: {
          type: 'object',
          properties: {
            tag: {
              type: 'string',
              default: 't',
            },
            kid: {
              $ref: '#/definitions/kid',
            },
          },
        },
      },
      $ref: '#/definitions/kid',
    },
  },
  {
    name: '3',
    source:
      'utils/test/schema.test.ts :: getDefaultFormState() > object schemas > an object with additionalProperties type object with defaults and formdata > a recursive schema whose dependencies entry refers back to it > getDefaultFormState stops at the recursion the entry declares, from the root',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            a: {
              type: 'string',
              default: 'x',
            },
          },
          dependencies: {
            a: {
              properties: {
                child: {
                  $ref: '#/definitions/node',
                },
              },
            },
          },
        },
      },
      $ref: '#/definitions/node',
    },
  },
  {
    name: '4',
    source:
      'utils/test/schema.test.ts :: getDefaultFormState() > object schemas > an object with additionalProperties type object with defaults and formdata > a recursive schema whose dependencies entry refers back to it > getDefaultFormState stops at the recursion the entry declares, from a property',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            a: {
              type: 'string',
              default: 'x',
            },
          },
          dependencies: {
            a: {
              properties: {
                child: {
                  $ref: '#/definitions/node',
                },
              },
            },
          },
        },
      },
      type: 'object',
      properties: {
        p: {
          $ref: '#/definitions/node',
        },
      },
    },
  },
  {
    name: '5',
    source:
      'utils/test/schema.test.ts :: getDefaultFormState() > object schemas > an object with additionalProperties type object with defaults and formdata > a recursive schema whose if has its properties resolved > keeps the parent and own defaults at the recursion, as a $ref to it does',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              default: 'n',
            },
            child: {
              $ref: '#/definitions/node',
            },
          },
          default: {
            child: {
              child: {
                name: 'deep',
              },
            },
          },
        },
      },
      $ref: '#/definitions/node',
    },
  },
  {
    name: '6',
    source:
      'utils/test/schema.test.ts :: getDefaultFormState() > object schemas > an object with additionalProperties type object with defaults and formdata > a recursive schema whose if has its properties resolved > keeps the parent and own defaults at the recursion, as a $ref to it does',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              default: 'n',
            },
            child: {
              $ref: '#/definitions/node',
            },
          },
          default: {
            child: {
              child: {
                name: 'deep',
              },
            },
          },
          if: {},
        },
      },
      $ref: '#/definitions/node',
    },
  },
  {
    name: '7',
    source:
      'utils/test/schema.test.ts :: getDefaultFormState() > object schemas > an object with additionalProperties type object with defaults and formdata > a recursive schema whose if has its properties resolved > takes the ui:initialValue at the recursion, as a $ref to it does',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              default: 'n',
            },
            child: {
              $ref: '#/definitions/node',
            },
          },
        },
      },
      $ref: '#/definitions/node',
    },
  },
  {
    name: '8',
    source:
      'utils/test/schema.test.ts :: getDefaultFormState() > object schemas > an object with additionalProperties type object with defaults and formdata > a recursive schema whose if has its properties resolved > takes the ui:initialValue at the recursion, as a $ref to it does',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              default: 'n',
            },
            child: {
              $ref: '#/definitions/node',
            },
          },
          if: {},
        },
      },
      $ref: '#/definitions/node',
    },
  },
  {
    name: '9',
    source:
      'utils/test/schema.test.ts :: getDefaultFormState() > object schemas > an object with additionalProperties type object with defaults and formdata > a recursive schema whose if has its properties resolved > stops at a recursion reached through array items',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              default: 'n',
            },
            kids: {
              type: 'array',
              minItems: 1,
              items: {
                $ref: '#/definitions/node',
              },
            },
          },
          required: ['kids'],
        },
      },
      $ref: '#/definitions/node',
    },
  },
  {
    name: '10',
    source:
      'utils/test/schema.test.ts :: getDefaultFormState() > object schemas > an object with additionalProperties type object with defaults and formdata > a recursive schema whose if has its properties resolved > stops at a recursion reached through array items',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              default: 'n',
            },
            kids: {
              type: 'array',
              minItems: 1,
              items: {
                $ref: '#/definitions/node',
              },
            },
          },
          required: ['kids'],
          if: {},
        },
      },
      $ref: '#/definitions/node',
    },
  },
  {
    name: '11',
    source:
      'utils/test/schema.test.ts :: getDefaultFormState() > object schemas > an object with additionalProperties type object with defaults and formdata > a recursive schema whose if has its properties resolved > stops at a recursion an allOf around the $ref hides from the $ref check',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              default: 'n',
            },
            child: {
              allOf: [
                {
                  $ref: '#/definitions/node',
                },
              ],
            },
          },
          default: {
            child: {
              child: {
                name: 'deep',
              },
            },
          },
        },
      },
      $ref: '#/definitions/node',
    },
  },
  {
    name: '11 populate',
    source:
      'utils/test/schema.test.ts :: getDefaultFormState() > object schemas > an object with additionalProperties type object with defaults and formdata > a recursive schema whose if has its properties resolved > stops at a recursion an allOf around the $ref hides from the $ref check',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              default: 'n',
            },
            child: {
              allOf: [
                {
                  $ref: '#/definitions/node',
                },
              ],
            },
          },
          default: {
            child: {
              child: {
                name: 'deep',
              },
            },
          },
        },
      },
      $ref: '#/definitions/node',
    },
    populate: true,
  },
  {
    name: '12',
    source:
      'utils/test/schema.test.ts :: getDefaultFormState() > object schemas > an object with additionalProperties type object with defaults and formdata > a recursive schema whose if has its properties resolved > stops at a $ref back to the definition whose allOf merged another $ref in',
    schema: {
      definitions: {
        outer: {
          allOf: [
            {
              $ref: '#/definitions/inner',
            },
            {
              properties: {
                extra: {
                  type: 'string',
                  default: 'e',
                },
              },
            },
          ],
        },
        inner: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              default: 'n',
            },
            back: {
              $ref: '#/definitions/outer',
            },
          },
        },
      },
      type: 'object',
      properties: {
        a: {
          $ref: '#/definitions/outer',
        },
      },
    },
  },
  {
    name: '12 populate',
    source:
      'utils/test/schema.test.ts :: getDefaultFormState() > object schemas > an object with additionalProperties type object with defaults and formdata > a recursive schema whose if has its properties resolved > stops at a $ref back to the definition whose allOf merged another $ref in',
    schema: {
      definitions: {
        outer: {
          allOf: [
            {
              $ref: '#/definitions/inner',
            },
            {
              properties: {
                extra: {
                  type: 'string',
                  default: 'e',
                },
              },
            },
          ],
        },
        inner: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              default: 'n',
            },
            back: {
              $ref: '#/definitions/outer',
            },
          },
        },
      },
      type: 'object',
      properties: {
        a: {
          $ref: '#/definitions/outer',
        },
      },
    },
    populate: true,
  },
  {
    name: '12 ->outer',
    source:
      'utils/test/schema.test.ts :: getDefaultFormState() > object schemas > an object with additionalProperties type object with defaults and formdata > a recursive schema whose if has its properties resolved > stops at a $ref back to the definition whose allOf merged another $ref in',
    schema: {
      definitions: {
        outer: {
          allOf: [
            {
              $ref: '#/definitions/inner',
            },
            {
              properties: {
                extra: {
                  type: 'string',
                  default: 'e',
                },
              },
            },
          ],
        },
        inner: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              default: 'n',
            },
            back: {
              $ref: '#/definitions/outer',
            },
          },
        },
      },
      $ref: '#/definitions/outer',
    },
  },
  {
    name: '12 ->outer populate',
    source:
      'utils/test/schema.test.ts :: getDefaultFormState() > object schemas > an object with additionalProperties type object with defaults and formdata > a recursive schema whose if has its properties resolved > stops at a $ref back to the definition whose allOf merged another $ref in',
    schema: {
      definitions: {
        outer: {
          allOf: [
            {
              $ref: '#/definitions/inner',
            },
            {
              properties: {
                extra: {
                  type: 'string',
                  default: 'e',
                },
              },
            },
          ],
        },
        inner: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              default: 'n',
            },
            back: {
              $ref: '#/definitions/outer',
            },
          },
        },
      },
      $ref: '#/definitions/outer',
    },
    populate: true,
  },
  {
    name: '12 ->inner',
    source:
      'utils/test/schema.test.ts :: getDefaultFormState() > object schemas > an object with additionalProperties type object with defaults and formdata > a recursive schema whose if has its properties resolved > stops at a $ref back to the definition whose allOf merged another $ref in',
    schema: {
      definitions: {
        outer: {
          allOf: [
            {
              $ref: '#/definitions/inner',
            },
            {
              properties: {
                extra: {
                  type: 'string',
                  default: 'e',
                },
              },
            },
          ],
        },
        inner: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              default: 'n',
            },
            back: {
              $ref: '#/definitions/outer',
            },
          },
        },
      },
      $ref: '#/definitions/inner',
    },
  },
  {
    name: '12 ->inner populate',
    source:
      'utils/test/schema.test.ts :: getDefaultFormState() > object schemas > an object with additionalProperties type object with defaults and formdata > a recursive schema whose if has its properties resolved > stops at a $ref back to the definition whose allOf merged another $ref in',
    schema: {
      definitions: {
        outer: {
          allOf: [
            {
              $ref: '#/definitions/inner',
            },
            {
              properties: {
                extra: {
                  type: 'string',
                  default: 'e',
                },
              },
            },
          ],
        },
        inner: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              default: 'n',
            },
            back: {
              $ref: '#/definitions/outer',
            },
          },
        },
      },
      $ref: '#/definitions/inner',
    },
    populate: true,
  },
  {
    name: '13',
    source:
      'utils/test/schema.test.ts :: getDefaultFormState() > object schemas > an object with additionalProperties type object with defaults and formdata > a recursive schema whose if has its properties resolved > stops a recursion under a populated allOf one level sooner than the same one without it',
    schema: {
      definitions: {
        tags: {
          type: 'array',
          minItems: 1,
          items: {
            $ref: '#/definitions/tags',
          },
        },
      },
      type: 'object',
      required: ['t'],
      properties: {
        t: {
          $ref: '#/definitions/tags',
        },
      },
    },
  },
  {
    name: '13 ->tags',
    source:
      'utils/test/schema.test.ts :: getDefaultFormState() > object schemas > an object with additionalProperties type object with defaults and formdata > a recursive schema whose if has its properties resolved > stops a recursion under a populated allOf one level sooner than the same one without it',
    schema: {
      definitions: {
        tags: {
          type: 'array',
          minItems: 1,
          items: {
            $ref: '#/definitions/tags',
          },
        },
      },
      $ref: '#/definitions/tags',
    },
  },
  {
    name: '14',
    source:
      'utils/test/schema.test.ts :: getDefaultFormState() > object schemas > an object with additionalProperties type object with defaults and formdata > a recursive schema whose if has its properties resolved > stops a recursion under a populated allOf one level sooner than the same one without it',
    schema: {
      definitions: {
        tags: {
          type: 'array',
          minItems: 1,
          items: {
            $ref: '#/definitions/tags',
          },
          allOf: [
            {
              minItems: 1,
            },
          ],
        },
      },
      type: 'object',
      required: ['t'],
      properties: {
        t: {
          $ref: '#/definitions/tags',
        },
      },
    },
  },
  {
    name: '14 populate',
    source:
      'utils/test/schema.test.ts :: getDefaultFormState() > object schemas > an object with additionalProperties type object with defaults and formdata > a recursive schema whose if has its properties resolved > stops a recursion under a populated allOf one level sooner than the same one without it',
    schema: {
      definitions: {
        tags: {
          type: 'array',
          minItems: 1,
          items: {
            $ref: '#/definitions/tags',
          },
          allOf: [
            {
              minItems: 1,
            },
          ],
        },
      },
      type: 'object',
      required: ['t'],
      properties: {
        t: {
          $ref: '#/definitions/tags',
        },
      },
    },
    populate: true,
  },
  {
    name: '14 ->tags',
    source:
      'utils/test/schema.test.ts :: getDefaultFormState() > object schemas > an object with additionalProperties type object with defaults and formdata > a recursive schema whose if has its properties resolved > stops a recursion under a populated allOf one level sooner than the same one without it',
    schema: {
      definitions: {
        tags: {
          type: 'array',
          minItems: 1,
          items: {
            $ref: '#/definitions/tags',
          },
          allOf: [
            {
              minItems: 1,
            },
          ],
        },
      },
      $ref: '#/definitions/tags',
    },
  },
  {
    name: '14 ->tags populate',
    source:
      'utils/test/schema.test.ts :: getDefaultFormState() > object schemas > an object with additionalProperties type object with defaults and formdata > a recursive schema whose if has its properties resolved > stops a recursion under a populated allOf one level sooner than the same one without it',
    schema: {
      definitions: {
        tags: {
          type: 'array',
          minItems: 1,
          items: {
            $ref: '#/definitions/tags',
          },
          allOf: [
            {
              minItems: 1,
            },
          ],
        },
      },
      $ref: '#/definitions/tags',
    },
    populate: true,
  },
  {
    name: '15',
    source:
      'utils/test/schema.test.ts :: getDefaultFormState() > object schemas > an object with additionalProperties type object with defaults and formdata > a recursive schema whose typed property resolves its way back to it > stops at a recursion reached through the allOf of a property',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              default: 'n',
            },
            child: {
              type: 'object',
              allOf: [
                {
                  $ref: '#/definitions/node',
                },
              ],
            },
          },
        },
      },
      $ref: '#/definitions/node',
    },
  },
  {
    name: '15 populate',
    source:
      'utils/test/schema.test.ts :: getDefaultFormState() > object schemas > an object with additionalProperties type object with defaults and formdata > a recursive schema whose typed property resolves its way back to it > stops at a recursion reached through the allOf of a property',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              default: 'n',
            },
            child: {
              type: 'object',
              allOf: [
                {
                  $ref: '#/definitions/node',
                },
              ],
            },
          },
        },
      },
      $ref: '#/definitions/node',
    },
    populate: true,
  },
  {
    name: '16',
    source:
      'utils/test/schema.test.ts :: getDefaultFormState() > object schemas > an object with additionalProperties type object with defaults and formdata > a recursive schema whose typed property resolves its way back to it > stops at a recursion reached through the then branch of a property',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              default: 'n',
            },
            child: {
              type: 'object',
              if: {},
              then: {
                $ref: '#/definitions/node',
              },
            },
          },
        },
      },
      $ref: '#/definitions/node',
    },
  },
  {
    name: '17',
    source:
      'utils/test/schema.test.ts :: getDefaultFormState() > object schemas > an object with additionalProperties type object with defaults and formdata > a recursive schema whose typed property resolves its way back to it > stops at a recursion reached through the allOf of array items',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              default: 'n',
            },
            child: {
              type: 'array',
              minItems: 1,
              items: {
                type: 'object',
                allOf: [
                  {
                    $ref: '#/definitions/node',
                  },
                ],
              },
            },
          },
        },
      },
      $ref: '#/definitions/node',
    },
  },
  {
    name: '17 populate',
    source:
      'utils/test/schema.test.ts :: getDefaultFormState() > object schemas > an object with additionalProperties type object with defaults and formdata > a recursive schema whose typed property resolves its way back to it > stops at a recursion reached through the allOf of array items',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              default: 'n',
            },
            child: {
              type: 'array',
              minItems: 1,
              items: {
                type: 'object',
                allOf: [
                  {
                    $ref: '#/definitions/node',
                  },
                ],
              },
            },
          },
        },
      },
      $ref: '#/definitions/node',
    },
    populate: true,
  },
  {
    name: '18',
    source:
      'utils/test/schema.test.ts :: getDefaultFormState() > object schemas > an object with additionalProperties type object with defaults and formdata > a recursive schema whose typed property resolves its way back to it > stops at a recursion reached through the allOf of additionalProperties',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              default: 'n',
            },
          },
          additionalProperties: {
            type: 'object',
            allOf: [
              {
                $ref: '#/definitions/node',
              },
            ],
          },
        },
      },
      $ref: '#/definitions/node',
      default: {
        extra: {
          extra: {},
        },
      },
    },
  },
  {
    name: '18 populate',
    source:
      'utils/test/schema.test.ts :: getDefaultFormState() > object schemas > an object with additionalProperties type object with defaults and formdata > a recursive schema whose typed property resolves its way back to it > stops at a recursion reached through the allOf of additionalProperties',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              default: 'n',
            },
          },
          additionalProperties: {
            type: 'object',
            allOf: [
              {
                $ref: '#/definitions/node',
              },
            ],
          },
        },
      },
      $ref: '#/definitions/node',
      default: {
        extra: {
          extra: {},
        },
      },
    },
    populate: true,
  },
  {
    name: '18 ->node',
    source:
      'utils/test/schema.test.ts :: getDefaultFormState() > object schemas > an object with additionalProperties type object with defaults and formdata > a recursive schema whose typed property resolves its way back to it > stops at a recursion reached through the allOf of additionalProperties',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              default: 'n',
            },
          },
          additionalProperties: {
            type: 'object',
            allOf: [
              {
                $ref: '#/definitions/node',
              },
            ],
          },
        },
      },
      $ref: '#/definitions/node',
    },
  },
  {
    name: '18 ->node populate',
    source:
      'utils/test/schema.test.ts :: getDefaultFormState() > object schemas > an object with additionalProperties type object with defaults and formdata > a recursive schema whose typed property resolves its way back to it > stops at a recursion reached through the allOf of additionalProperties',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              default: 'n',
            },
          },
          additionalProperties: {
            type: 'object',
            allOf: [
              {
                $ref: '#/definitions/node',
              },
            ],
          },
        },
      },
      $ref: '#/definitions/node',
    },
    populate: true,
  },
  {
    name: '19',
    source:
      'utils/test/schema.test.ts :: getDefaultFormState() > object schemas > an object with additionalProperties type object with defaults and formdata > a recursive allof schema > getDefaultFormState',
    schema: {
      definitions: {
        '@enum': {
          type: 'object',
          properties: {
            name: {
              title: 'Name',
              type: 'string',
              default: '',
            },
            _id: {
              title: 'Value',
              type: 'number',
            },
            children: {
              title: 'Subvalues',
              type: 'array',
              items: {
                allOf: [
                  {
                    $ref: '#/definitions/@enum',
                  },
                ],
              },
            },
          },
        },
      },
      type: 'object',
      properties: {
        value: {
          type: 'array',
          items: {
            allOf: [
              {
                $ref: '#/definitions/@enum',
              },
            ],
          },
          minItems: 1,
        },
      },
    },
  },
  {
    name: '19 populate',
    source:
      'utils/test/schema.test.ts :: getDefaultFormState() > object schemas > an object with additionalProperties type object with defaults and formdata > a recursive allof schema > getDefaultFormState',
    schema: {
      definitions: {
        '@enum': {
          type: 'object',
          properties: {
            name: {
              title: 'Name',
              type: 'string',
              default: '',
            },
            _id: {
              title: 'Value',
              type: 'number',
            },
            children: {
              title: 'Subvalues',
              type: 'array',
              items: {
                allOf: [
                  {
                    $ref: '#/definitions/@enum',
                  },
                ],
              },
            },
          },
        },
      },
      type: 'object',
      properties: {
        value: {
          type: 'array',
          items: {
            allOf: [
              {
                $ref: '#/definitions/@enum',
              },
            ],
          },
          minItems: 1,
        },
      },
    },
    populate: true,
  },
  {
    name: '19 ->@enum',
    source:
      'utils/test/schema.test.ts :: getDefaultFormState() > object schemas > an object with additionalProperties type object with defaults and formdata > a recursive allof schema > getDefaultFormState',
    schema: {
      definitions: {
        '@enum': {
          type: 'object',
          properties: {
            name: {
              title: 'Name',
              type: 'string',
              default: '',
            },
            _id: {
              title: 'Value',
              type: 'number',
            },
            children: {
              title: 'Subvalues',
              type: 'array',
              items: {
                allOf: [
                  {
                    $ref: '#/definitions/@enum',
                  },
                ],
              },
            },
          },
        },
      },
      $ref: '#/definitions/@enum',
    },
  },
  {
    name: '19 ->@enum populate',
    source:
      'utils/test/schema.test.ts :: getDefaultFormState() > object schemas > an object with additionalProperties type object with defaults and formdata > a recursive allof schema > getDefaultFormState',
    schema: {
      definitions: {
        '@enum': {
          type: 'object',
          properties: {
            name: {
              title: 'Name',
              type: 'string',
              default: '',
            },
            _id: {
              title: 'Value',
              type: 'number',
            },
            children: {
              title: 'Subvalues',
              type: 'array',
              items: {
                allOf: [
                  {
                    $ref: '#/definitions/@enum',
                  },
                ],
              },
            },
          },
        },
      },
      $ref: '#/definitions/@enum',
    },
    populate: true,
  },
  {
    name: '20',
    source:
      'utils/test/schema.test.ts :: getDefaultFormState() > defaults with anyOf > stops following a selected option written as a $ref once it leads back to a $ref already followed',
    schema: {
      definitions: {
        a: {
          type: 'string',
          anyOf: [
            {
              $ref: '#/definitions/b',
            },
            {
              minLength: 1,
            },
          ],
        },
        b: {
          type: 'string',
          default: 'b',
          anyOf: [
            {
              $ref: '#/definitions/a',
            },
            {
              maxLength: 3,
            },
          ],
        },
      },
      $ref: '#/definitions/a',
    },
  },
  {
    name: '20 ->b',
    source:
      'utils/test/schema.test.ts :: getDefaultFormState() > defaults with anyOf > stops following a selected option written as a $ref once it leads back to a $ref already followed',
    schema: {
      definitions: {
        a: {
          type: 'string',
          anyOf: [
            {
              $ref: '#/definitions/b',
            },
            {
              minLength: 1,
            },
          ],
        },
        b: {
          type: 'string',
          default: 'b',
          anyOf: [
            {
              $ref: '#/definitions/a',
            },
            {
              maxLength: 3,
            },
          ],
        },
      },
      $ref: '#/definitions/b',
    },
  },
  {
    name: '21 ->Node',
    source:
      'utils/test/schema.test.ts :: oneOfMatchingOption > recursive $ref in an option, see https://github.com/rjsf-team/react-jsonschema-form/issues/5337 > terminates when the recursion runs out of form data',
    schema: {
      definitions: {
        Node: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            child: {
              $ref: '#/definitions/Node',
            },
          },
        },
      },
      $ref: '#/definitions/Node',
    },
  },
  {
    name: '22 ->A',
    source:
      'utils/test/schema.test.ts :: oneOfMatchingOption > recursive $ref in an option, see https://github.com/rjsf-team/react-jsonschema-form/issues/5337 > terminates for a pair of mutually recursive definitions',
    schema: {
      definitions: {
        A: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            b: {
              $ref: '#/definitions/B',
            },
          },
        },
        B: {
          type: 'object',
          properties: {
            label: {
              type: 'string',
            },
            a: {
              $ref: '#/definitions/A',
            },
          },
        },
      },
      $ref: '#/definitions/A',
    },
  },
  {
    name: '22 ->B',
    source:
      'utils/test/schema.test.ts :: oneOfMatchingOption > recursive $ref in an option, see https://github.com/rjsf-team/react-jsonschema-form/issues/5337 > terminates for a pair of mutually recursive definitions',
    schema: {
      definitions: {
        A: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            b: {
              $ref: '#/definitions/B',
            },
          },
        },
        B: {
          type: 'object',
          properties: {
            label: {
              type: 'string',
            },
            a: {
              $ref: '#/definitions/A',
            },
          },
        },
      },
      $ref: '#/definitions/B',
    },
  },
  {
    name: '23 ->cat',
    source:
      'utils/test/schema.test.ts :: getAdditionalPropertyType() > returns the type the definition a reference names says, given a root schema to look it up in',
    schema: {
      definitions: {
        cat: {
          type: 'object',
          properties: {
            meow: {
              type: 'string',
            },
          },
        },
        dog: {
          properties: {
            woof: {
              type: 'string',
            },
          },
        },
        named: {
          $ref: '#/definitions/cat',
        },
        loop: {
          oneOf: [
            {
              $ref: '#/definitions/loop',
            },
          ],
        },
      },
      $ref: '#/definitions/cat',
    },
  },
  {
    name: '23 ->dog',
    source:
      'utils/test/schema.test.ts :: getAdditionalPropertyType() > returns the type the definition a reference names says, given a root schema to look it up in',
    schema: {
      definitions: {
        cat: {
          type: 'object',
          properties: {
            meow: {
              type: 'string',
            },
          },
        },
        dog: {
          properties: {
            woof: {
              type: 'string',
            },
          },
        },
        named: {
          $ref: '#/definitions/cat',
        },
        loop: {
          oneOf: [
            {
              $ref: '#/definitions/loop',
            },
          ],
        },
      },
      $ref: '#/definitions/dog',
    },
  },
  {
    name: '23 ->named',
    source:
      'utils/test/schema.test.ts :: getAdditionalPropertyType() > returns the type the definition a reference names says, given a root schema to look it up in',
    schema: {
      definitions: {
        cat: {
          type: 'object',
          properties: {
            meow: {
              type: 'string',
            },
          },
        },
        dog: {
          properties: {
            woof: {
              type: 'string',
            },
          },
        },
        named: {
          $ref: '#/definitions/cat',
        },
        loop: {
          oneOf: [
            {
              $ref: '#/definitions/loop',
            },
          ],
        },
      },
      $ref: '#/definitions/named',
    },
  },
  {
    name: '23 ->loop',
    source:
      'utils/test/schema.test.ts :: getAdditionalPropertyType() > returns the type the definition a reference names says, given a root schema to look it up in',
    schema: {
      definitions: {
        cat: {
          type: 'object',
          properties: {
            meow: {
              type: 'string',
            },
          },
        },
        dog: {
          properties: {
            woof: {
              type: 'string',
            },
          },
        },
        named: {
          $ref: '#/definitions/cat',
        },
        loop: {
          oneOf: [
            {
              $ref: '#/definitions/loop',
            },
          ],
        },
      },
      $ref: '#/definitions/loop',
    },
  },
  {
    name: '24 ->property',
    source:
      'utils/test/schema.test.ts :: retrieveSchema() > should resolve conditions in additionalProperties $ref using the additional property value',
    schema: {
      definitions: {
        property: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['string', 'object'],
            },
          },
          if: {
            required: ['type'],
            properties: {
              type: {
                const: 'object',
              },
            },
          },
          then: {
            properties: {
              properties: {
                type: 'object',
                additionalProperties: {
                  $ref: '#/definitions/property',
                },
              },
            },
          },
        },
      },
      $ref: '#/definitions/property',
    },
  },
  {
    name: '25',
    source:
      'utils/test/schema.test.ts :: retrieveSchema() > recursive array-items ref resolves without cycle flag (items are data-driven, not infinite)',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            children: {
              type: 'array',
              items: {
                $ref: '#/definitions/node',
              },
            },
          },
        },
      },
      $ref: '#/definitions/node',
    },
  },
  {
    name: '26',
    source:
      'utils/test/schema.test.ts :: retrieveSchema() > schema dependencies > conditional > with $ref in oneOf > terminates on a recursive definition under an allOf root',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            child: {
              $ref: '#/definitions/node',
            },
          },
        },
      },
      type: 'object',
      properties: {
        tree: {
          $ref: '#/definitions/node',
        },
      },
      allOf: [
        {
          required: ['tree'],
        },
      ],
    },
  },
  {
    name: '26 populate',
    source:
      'utils/test/schema.test.ts :: retrieveSchema() > schema dependencies > conditional > with $ref in oneOf > terminates on a recursive definition under an allOf root',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            child: {
              $ref: '#/definitions/node',
            },
          },
        },
      },
      type: 'object',
      properties: {
        tree: {
          $ref: '#/definitions/node',
        },
      },
      allOf: [
        {
          required: ['tree'],
        },
      ],
    },
    populate: true,
  },
  {
    name: '26 ->node',
    source:
      'utils/test/schema.test.ts :: retrieveSchema() > schema dependencies > conditional > with $ref in oneOf > terminates on a recursive definition under an allOf root',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            child: {
              $ref: '#/definitions/node',
            },
          },
        },
      },
      $ref: '#/definitions/node',
    },
  },
  {
    name: '26 ->node populate',
    source:
      'utils/test/schema.test.ts :: retrieveSchema() > schema dependencies > conditional > with $ref in oneOf > terminates on a recursive definition under an allOf root',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            child: {
              $ref: '#/definitions/node',
            },
          },
        },
      },
      $ref: '#/definitions/node',
    },
    populate: true,
  },
  {
    name: '27',
    source:
      'utils/test/schema.test.ts :: retrieveSchema() > schema dependencies > conditional > with $ref in oneOf > terminates on a recursive definition under a dependencies root',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            child: {
              $ref: '#/definitions/node',
            },
          },
        },
      },
      type: 'object',
      properties: {
        a: {
          type: 'string',
        },
        tree: {
          $ref: '#/definitions/node',
        },
      },
      dependencies: {
        a: {
          properties: {
            extra: {
              $ref: '#/definitions/node',
            },
          },
        },
      },
    },
  },
  {
    name: '28',
    source:
      'utils/test/schema.test.ts :: retrieveSchema() > schema dependencies > conditional > with $ref in oneOf > terminates on a recursive definition under an if/then root',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            child: {
              $ref: '#/definitions/node',
            },
          },
        },
      },
      type: 'object',
      properties: {
        tree: {
          $ref: '#/definitions/node',
        },
      },
      if: {
        properties: {
          a: {
            const: '1',
          },
        },
      },
      then: {
        properties: {
          extra: {
            $ref: '#/definitions/node',
          },
        },
      },
    },
  },
  {
    name: '29',
    source:
      'utils/test/schema.test.ts :: retrieveSchema() > schema dependencies > conditional > with $ref in oneOf > terminates on a recursive definition behind array items under an allOf root',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            child: {
              $ref: '#/definitions/node',
            },
          },
        },
      },
      type: 'object',
      properties: {
        children: {
          type: 'array',
          items: {
            $ref: '#/definitions/node',
          },
        },
      },
      allOf: [
        {
          required: ['children'],
        },
      ],
    },
  },
  {
    name: '29 populate',
    source:
      'utils/test/schema.test.ts :: retrieveSchema() > schema dependencies > conditional > with $ref in oneOf > terminates on a recursive definition behind array items under an allOf root',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            child: {
              $ref: '#/definitions/node',
            },
          },
        },
      },
      type: 'object',
      properties: {
        children: {
          type: 'array',
          items: {
            $ref: '#/definitions/node',
          },
        },
      },
      allOf: [
        {
          required: ['children'],
        },
      ],
    },
    populate: true,
  },
  {
    name: '30',
    source:
      'utils/test/schema.test.ts :: retrieveSchema() > schema dependencies > conditional > with $ref in oneOf > collapses a self-referencing property after one level',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            child: {
              $ref: '#/definitions/node',
            },
          },
        },
      },
      type: 'object',
      properties: {
        tree: {
          $ref: '#/definitions/node',
        },
      },
    },
  },
  {
    name: '31',
    source:
      'utils/test/schema.test.ts :: retrieveSchema() > schema dependencies > conditional > with $ref in oneOf > marks the closing edge of mutually recursive definitions as a cycle on both entry points',
    schema: {
      definitions: {
        A: {
          type: 'object',
          properties: {
            child: {
              $ref: '#/definitions/B',
            },
          },
        },
        B: {
          type: 'object',
          properties: {
            child: {
              $ref: '#/definitions/A',
            },
          },
        },
      },
      type: 'object',
      properties: {
        a: {
          $ref: '#/definitions/A',
        },
        b: {
          $ref: '#/definitions/B',
        },
      },
    },
  },
  {
    name: '31 ->A',
    source:
      'utils/test/schema.test.ts :: retrieveSchema() > schema dependencies > conditional > with $ref in oneOf > marks the closing edge of mutually recursive definitions as a cycle on both entry points',
    schema: {
      definitions: {
        A: {
          type: 'object',
          properties: {
            child: {
              $ref: '#/definitions/B',
            },
          },
        },
        B: {
          type: 'object',
          properties: {
            child: {
              $ref: '#/definitions/A',
            },
          },
        },
      },
      $ref: '#/definitions/A',
    },
  },
  {
    name: '31 ->B',
    source:
      'utils/test/schema.test.ts :: retrieveSchema() > schema dependencies > conditional > with $ref in oneOf > marks the closing edge of mutually recursive definitions as a cycle on both entry points',
    schema: {
      definitions: {
        A: {
          type: 'object',
          properties: {
            child: {
              $ref: '#/definitions/B',
            },
          },
        },
        B: {
          type: 'object',
          properties: {
            child: {
              $ref: '#/definitions/A',
            },
          },
        },
      },
      $ref: '#/definitions/B',
    },
  },
  {
    name: '32',
    source:
      'utils/test/schema.test.ts :: retrieveSchema() > schema dependencies > conditional > with $ref in oneOf > keeps a cycle-flagged $ref collapsed when dependencies are re-walked',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            child: {
              $ref: '#/definitions/node',
            },
          },
        },
      },
      type: 'object',
      properties: {
        a: {
          type: 'string',
        },
      },
      dependencies: {
        a: {
          properties: {
            n: {
              $ref: '#/definitions/node',
            },
          },
        },
      },
    },
  },
  {
    name: '33',
    source:
      'utils/test/schema.test.ts :: retrieveSchema() > schema dependencies > conditional > with $ref in oneOf > flags a dependent property that points back at its definition after a dependency that is a $ref was merged',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            a: {
              type: 'string',
            },
            b: {
              type: 'string',
            },
          },
          dependencies: {
            a: {
              $ref: '#/definitions/extra',
            },
            b: {
              properties: {
                child: {
                  $ref: '#/definitions/node',
                },
              },
            },
          },
        },
        extra: {
          properties: {
            x: {
              type: 'string',
            },
          },
        },
        branch: {
          properties: {
            a: {
              enum: ['1'],
            },
            x: {
              type: 'string',
            },
          },
        },
      },
      $ref: '#/definitions/node',
    },
  },
  {
    name: '33 ->extra',
    source:
      'utils/test/schema.test.ts :: retrieveSchema() > schema dependencies > conditional > with $ref in oneOf > flags a dependent property that points back at its definition after a dependency that is a $ref was merged',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            a: {
              type: 'string',
            },
            b: {
              type: 'string',
            },
          },
          dependencies: {
            a: {
              $ref: '#/definitions/extra',
            },
            b: {
              properties: {
                child: {
                  $ref: '#/definitions/node',
                },
              },
            },
          },
        },
        extra: {
          properties: {
            x: {
              type: 'string',
            },
          },
        },
        branch: {
          properties: {
            a: {
              enum: ['1'],
            },
            x: {
              type: 'string',
            },
          },
        },
      },
      $ref: '#/definitions/extra',
    },
  },
  {
    name: '33 ->branch',
    source:
      'utils/test/schema.test.ts :: retrieveSchema() > schema dependencies > conditional > with $ref in oneOf > flags a dependent property that points back at its definition after a dependency that is a $ref was merged',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            a: {
              type: 'string',
            },
            b: {
              type: 'string',
            },
          },
          dependencies: {
            a: {
              $ref: '#/definitions/extra',
            },
            b: {
              properties: {
                child: {
                  $ref: '#/definitions/node',
                },
              },
            },
          },
        },
        extra: {
          properties: {
            x: {
              type: 'string',
            },
          },
        },
        branch: {
          properties: {
            a: {
              enum: ['1'],
            },
            x: {
              type: 'string',
            },
          },
        },
      },
      $ref: '#/definitions/branch',
    },
  },
  {
    name: '34',
    source:
      'utils/test/schema.test.ts :: retrieveSchema() > schema dependencies > conditional > with $ref in oneOf > flags a dependent property that points back at its definition after a dependency whose oneOf branch is a $ref was merged',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            a: {
              type: 'string',
            },
            b: {
              type: 'string',
            },
          },
          dependencies: {
            a: {
              oneOf: [
                {
                  $ref: '#/definitions/branch',
                },
              ],
            },
            b: {
              properties: {
                child: {
                  $ref: '#/definitions/node',
                },
              },
            },
          },
        },
        extra: {
          properties: {
            x: {
              type: 'string',
            },
          },
        },
        branch: {
          properties: {
            a: {
              enum: ['1'],
            },
            x: {
              type: 'string',
            },
          },
        },
      },
      $ref: '#/definitions/node',
    },
  },
  {
    name: '34 ->extra',
    source:
      'utils/test/schema.test.ts :: retrieveSchema() > schema dependencies > conditional > with $ref in oneOf > flags a dependent property that points back at its definition after a dependency whose oneOf branch is a $ref was merged',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            a: {
              type: 'string',
            },
            b: {
              type: 'string',
            },
          },
          dependencies: {
            a: {
              oneOf: [
                {
                  $ref: '#/definitions/branch',
                },
              ],
            },
            b: {
              properties: {
                child: {
                  $ref: '#/definitions/node',
                },
              },
            },
          },
        },
        extra: {
          properties: {
            x: {
              type: 'string',
            },
          },
        },
        branch: {
          properties: {
            a: {
              enum: ['1'],
            },
            x: {
              type: 'string',
            },
          },
        },
      },
      $ref: '#/definitions/extra',
    },
  },
  {
    name: '34 ->branch',
    source:
      'utils/test/schema.test.ts :: retrieveSchema() > schema dependencies > conditional > with $ref in oneOf > flags a dependent property that points back at its definition after a dependency whose oneOf branch is a $ref was merged',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            a: {
              type: 'string',
            },
            b: {
              type: 'string',
            },
          },
          dependencies: {
            a: {
              oneOf: [
                {
                  $ref: '#/definitions/branch',
                },
              ],
            },
            b: {
              properties: {
                child: {
                  $ref: '#/definitions/node',
                },
              },
            },
          },
        },
        extra: {
          properties: {
            x: {
              type: 'string',
            },
          },
        },
        branch: {
          properties: {
            a: {
              enum: ['1'],
            },
            x: {
              type: 'string',
            },
          },
        },
      },
      $ref: '#/definitions/branch',
    },
  },
  {
    name: '35',
    source:
      'utils/test/schema.test.ts :: retrieveSchema() > schema dependencies > conditional > with $ref in oneOf > flags a dependent property that points back at its definition after a then that is a $ref was merged',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            a: {
              type: 'string',
            },
            b: {
              type: 'string',
            },
          },
          if: true,
          then: {
            $ref: '#/definitions/extra',
          },
          dependencies: {
            b: {
              properties: {
                child: {
                  $ref: '#/definitions/node',
                },
              },
            },
          },
        },
        extra: {
          properties: {
            x: {
              type: 'string',
            },
          },
        },
        branch: {
          properties: {
            a: {
              enum: ['1'],
            },
            x: {
              type: 'string',
            },
          },
        },
      },
      $ref: '#/definitions/node',
    },
  },
  {
    name: '35 ->extra',
    source:
      'utils/test/schema.test.ts :: retrieveSchema() > schema dependencies > conditional > with $ref in oneOf > flags a dependent property that points back at its definition after a then that is a $ref was merged',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            a: {
              type: 'string',
            },
            b: {
              type: 'string',
            },
          },
          if: true,
          then: {
            $ref: '#/definitions/extra',
          },
          dependencies: {
            b: {
              properties: {
                child: {
                  $ref: '#/definitions/node',
                },
              },
            },
          },
        },
        extra: {
          properties: {
            x: {
              type: 'string',
            },
          },
        },
        branch: {
          properties: {
            a: {
              enum: ['1'],
            },
            x: {
              type: 'string',
            },
          },
        },
      },
      $ref: '#/definitions/extra',
    },
  },
  {
    name: '35 ->branch',
    source:
      'utils/test/schema.test.ts :: retrieveSchema() > schema dependencies > conditional > with $ref in oneOf > flags a dependent property that points back at its definition after a then that is a $ref was merged',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            a: {
              type: 'string',
            },
            b: {
              type: 'string',
            },
          },
          if: true,
          then: {
            $ref: '#/definitions/extra',
          },
          dependencies: {
            b: {
              properties: {
                child: {
                  $ref: '#/definitions/node',
                },
              },
            },
          },
        },
        extra: {
          properties: {
            x: {
              type: 'string',
            },
          },
        },
        branch: {
          properties: {
            a: {
              enum: ['1'],
            },
            x: {
              type: 'string',
            },
          },
        },
      },
      $ref: '#/definitions/branch',
    },
  },
  {
    name: '36',
    source:
      'utils/test/schema.test.ts :: retrieveSchema() > schema dependencies > conditional > with $ref in oneOf > leaves a recursion inside the definition of a then that is a $ref collapsed',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            a: {
              type: 'string',
            },
          },
          if: true,
          then: {
            $ref: '#/definitions/branch',
          },
        },
        branch: {
          type: 'object',
          properties: {
            a: {
              enum: ['1'],
            },
            kid: {
              $ref: '#/definitions/branch',
            },
          },
        },
      },
      $ref: '#/definitions/node',
    },
  },
  {
    name: '36 ->branch',
    source:
      'utils/test/schema.test.ts :: retrieveSchema() > schema dependencies > conditional > with $ref in oneOf > leaves a recursion inside the definition of a then that is a $ref collapsed',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            a: {
              type: 'string',
            },
          },
          if: true,
          then: {
            $ref: '#/definitions/branch',
          },
        },
        branch: {
          type: 'object',
          properties: {
            a: {
              enum: ['1'],
            },
            kid: {
              $ref: '#/definitions/branch',
            },
          },
        },
      },
      $ref: '#/definitions/branch',
    },
  },
  {
    name: '37',
    source:
      'utils/test/schema.test.ts :: retrieveSchema() > schema dependencies > conditional > with $ref in oneOf > leaves a recursion inside the definition of a dependency that is a $ref collapsed',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            a: {
              type: 'string',
            },
          },
          dependencies: {
            a: {
              $ref: '#/definitions/branch',
            },
          },
        },
        branch: {
          type: 'object',
          properties: {
            a: {
              enum: ['1'],
            },
            kid: {
              $ref: '#/definitions/branch',
            },
          },
        },
      },
      $ref: '#/definitions/node',
    },
  },
  {
    name: '37 ->branch',
    source:
      'utils/test/schema.test.ts :: retrieveSchema() > schema dependencies > conditional > with $ref in oneOf > leaves a recursion inside the definition of a dependency that is a $ref collapsed',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            a: {
              type: 'string',
            },
          },
          dependencies: {
            a: {
              $ref: '#/definitions/branch',
            },
          },
        },
        branch: {
          type: 'object',
          properties: {
            a: {
              enum: ['1'],
            },
            kid: {
              $ref: '#/definitions/branch',
            },
          },
        },
      },
      $ref: '#/definitions/branch',
    },
  },
  {
    name: '38',
    source:
      'utils/test/schema.test.ts :: retrieveSchema() > schema dependencies > conditional > with $ref in oneOf > leaves a recursion inside the definition of a dependency whose oneOf branch is a $ref collapsed',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            a: {
              type: 'string',
            },
          },
          dependencies: {
            a: {
              oneOf: [
                {
                  $ref: '#/definitions/branch',
                },
              ],
            },
          },
        },
        branch: {
          type: 'object',
          properties: {
            a: {
              enum: ['1'],
            },
            kid: {
              $ref: '#/definitions/branch',
            },
          },
        },
      },
      $ref: '#/definitions/node',
    },
  },
  {
    name: '38 ->branch',
    source:
      'utils/test/schema.test.ts :: retrieveSchema() > schema dependencies > conditional > with $ref in oneOf > leaves a recursion inside the definition of a dependency whose oneOf branch is a $ref collapsed',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            a: {
              type: 'string',
            },
          },
          dependencies: {
            a: {
              oneOf: [
                {
                  $ref: '#/definitions/branch',
                },
              ],
            },
          },
        },
        branch: {
          type: 'object',
          properties: {
            a: {
              enum: ['1'],
            },
            kid: {
              $ref: '#/definitions/branch',
            },
          },
        },
      },
      $ref: '#/definitions/branch',
    },
  },
  {
    name: '39 ->a',
    source:
      'utils/test/schema.test.ts :: retrieveSchema() > schema dependencies > conditional > with $ref in oneOf > collapses a definition that reaches itself through allOf',
    schema: {
      definitions: {
        a: {
          allOf: [
            {
              $ref: '#/definitions/a',
            },
          ],
        },
      },
      $ref: '#/definitions/a',
    },
  },
  {
    name: '39 ->a populate',
    source:
      'utils/test/schema.test.ts :: retrieveSchema() > schema dependencies > conditional > with $ref in oneOf > collapses a definition that reaches itself through allOf',
    schema: {
      definitions: {
        a: {
          allOf: [
            {
              $ref: '#/definitions/a',
            },
          ],
        },
      },
      $ref: '#/definitions/a',
    },
    populate: true,
  },
  {
    name: '40 ->a',
    source:
      'utils/test/schema.test.ts :: retrieveSchema() > schema dependencies > conditional > with $ref in oneOf > collapses a definition that reaches itself through if/then',
    schema: {
      definitions: {
        a: {
          type: 'object',
          properties: {
            k: {
              type: 'string',
            },
          },
          if: {
            properties: {
              k: {
                const: 'x',
              },
            },
          },
          then: {
            $ref: '#/definitions/a',
          },
        },
      },
      $ref: '#/definitions/a',
    },
  },
  {
    name: '41 ->a',
    source:
      'utils/test/schema.test.ts :: retrieveSchema() > schema dependencies > conditional > with $ref in oneOf > collapses mutually recursive definitions that reach each other through allOf',
    schema: {
      definitions: {
        a: {
          allOf: [
            {
              $ref: '#/definitions/b',
            },
          ],
        },
        b: {
          allOf: [
            {
              $ref: '#/definitions/a',
            },
          ],
        },
      },
      $ref: '#/definitions/a',
    },
  },
  {
    name: '41 ->a populate',
    source:
      'utils/test/schema.test.ts :: retrieveSchema() > schema dependencies > conditional > with $ref in oneOf > collapses mutually recursive definitions that reach each other through allOf',
    schema: {
      definitions: {
        a: {
          allOf: [
            {
              $ref: '#/definitions/b',
            },
          ],
        },
        b: {
          allOf: [
            {
              $ref: '#/definitions/a',
            },
          ],
        },
      },
      $ref: '#/definitions/a',
    },
    populate: true,
  },
  {
    name: '41 ->b',
    source:
      'utils/test/schema.test.ts :: retrieveSchema() > schema dependencies > conditional > with $ref in oneOf > collapses mutually recursive definitions that reach each other through allOf',
    schema: {
      definitions: {
        a: {
          allOf: [
            {
              $ref: '#/definitions/b',
            },
          ],
        },
        b: {
          allOf: [
            {
              $ref: '#/definitions/a',
            },
          ],
        },
      },
      $ref: '#/definitions/b',
    },
  },
  {
    name: '41 ->b populate',
    source:
      'utils/test/schema.test.ts :: retrieveSchema() > schema dependencies > conditional > with $ref in oneOf > collapses mutually recursive definitions that reach each other through allOf',
    schema: {
      definitions: {
        a: {
          allOf: [
            {
              $ref: '#/definitions/b',
            },
          ],
        },
        b: {
          allOf: [
            {
              $ref: '#/definitions/a',
            },
          ],
        },
      },
      $ref: '#/definitions/b',
    },
    populate: true,
  },
  {
    name: '42 ->node',
    source:
      'utils/test/schema.test.ts :: retrieveSchema() > schema dependencies > conditional > with $ref in oneOf > collapses a definition that reaches itself through dependencies',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            k: {
              type: 'string',
            },
          },
          dependencies: {
            k: {
              $ref: '#/definitions/node',
            },
          },
        },
      },
      $ref: '#/definitions/node',
    },
  },
  {
    name: '43 ->node',
    source:
      'utils/test/schema.test.ts :: retrieveSchema() > schema dependencies > conditional > with $ref in oneOf > flags a dependent property that points back at its enclosing definition as a cycle',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            k: {
              type: 'string',
            },
          },
          dependencies: {
            k: {
              properties: {
                child: {
                  $ref: '#/definitions/node',
                },
              },
            },
          },
        },
      },
      $ref: '#/definitions/node',
    },
  },
  {
    name: '44 ->Pet',
    source:
      'utils/test/schema.test.ts :: retrieveSchema() > schema dependencies > conditional > with $ref in oneOf > collapses an OpenAPI-style discriminator pair that loops through if/then and allOf',
    schema: {
      definitions: {
        Pet: {
          type: 'object',
          properties: {
            petType: {
              type: 'string',
            },
          },
          if: {
            properties: {
              petType: {
                const: 'cat',
              },
            },
          },
          then: {
            $ref: '#/definitions/Cat',
          },
        },
        Cat: {
          allOf: [
            {
              $ref: '#/definitions/Pet',
            },
            {
              type: 'object',
              properties: {
                hunts: {
                  type: 'boolean',
                },
              },
            },
          ],
        },
      },
      $ref: '#/definitions/Pet',
    },
  },
  {
    name: '44 ->Pet populate',
    source:
      'utils/test/schema.test.ts :: retrieveSchema() > schema dependencies > conditional > with $ref in oneOf > collapses an OpenAPI-style discriminator pair that loops through if/then and allOf',
    schema: {
      definitions: {
        Pet: {
          type: 'object',
          properties: {
            petType: {
              type: 'string',
            },
          },
          if: {
            properties: {
              petType: {
                const: 'cat',
              },
            },
          },
          then: {
            $ref: '#/definitions/Cat',
          },
        },
        Cat: {
          allOf: [
            {
              $ref: '#/definitions/Pet',
            },
            {
              type: 'object',
              properties: {
                hunts: {
                  type: 'boolean',
                },
              },
            },
          ],
        },
      },
      $ref: '#/definitions/Pet',
    },
    populate: true,
  },
  {
    name: '44 ->Cat',
    source:
      'utils/test/schema.test.ts :: retrieveSchema() > schema dependencies > conditional > with $ref in oneOf > collapses an OpenAPI-style discriminator pair that loops through if/then and allOf',
    schema: {
      definitions: {
        Pet: {
          type: 'object',
          properties: {
            petType: {
              type: 'string',
            },
          },
          if: {
            properties: {
              petType: {
                const: 'cat',
              },
            },
          },
          then: {
            $ref: '#/definitions/Cat',
          },
        },
        Cat: {
          allOf: [
            {
              $ref: '#/definitions/Pet',
            },
            {
              type: 'object',
              properties: {
                hunts: {
                  type: 'boolean',
                },
              },
            },
          ],
        },
      },
      $ref: '#/definitions/Cat',
    },
  },
  {
    name: '44 ->Cat populate',
    source:
      'utils/test/schema.test.ts :: retrieveSchema() > schema dependencies > conditional > with $ref in oneOf > collapses an OpenAPI-style discriminator pair that loops through if/then and allOf',
    schema: {
      definitions: {
        Pet: {
          type: 'object',
          properties: {
            petType: {
              type: 'string',
            },
          },
          if: {
            properties: {
              petType: {
                const: 'cat',
              },
            },
          },
          then: {
            $ref: '#/definitions/Cat',
          },
        },
        Cat: {
          allOf: [
            {
              $ref: '#/definitions/Pet',
            },
            {
              type: 'object',
              properties: {
                hunts: {
                  type: 'boolean',
                },
              },
            },
          ],
        },
      },
      $ref: '#/definitions/Cat',
    },
    populate: true,
  },
  {
    name: '45',
    source:
      'utils/test/schema.test.ts :: retrieveSchema() > withPatternProperties() > keeps the properties of a schema a key refers back to when a pattern also matches that key',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            child: {
              $ref: '#/definitions/node',
            },
          },
          patternProperties: {
            '^child$': {
              properties: {
                extra: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
      $ref: '#/definitions/node',
    },
  },
  {
    name: '46',
    source:
      'utils/test/schema.test.ts :: retrieveSchema() > withPatternProperties() > merges a pattern into a key referring back to a schema other than the one that holds it',
    schema: {
      definitions: {
        A: {
          type: 'object',
          properties: {
            b: {
              $ref: '#/definitions/B',
            },
          },
        },
        B: {
          type: 'object',
          properties: {
            a: {
              $ref: '#/definitions/A',
            },
            s: {
              type: 'string',
            },
          },
          patternProperties: {
            '^a$': {
              title: 'Pattern',
            },
          },
        },
      },
      $ref: '#/definitions/A',
    },
  },
  {
    name: '46 ->B',
    source:
      'utils/test/schema.test.ts :: retrieveSchema() > withPatternProperties() > merges a pattern into a key referring back to a schema other than the one that holds it',
    schema: {
      definitions: {
        A: {
          type: 'object',
          properties: {
            b: {
              $ref: '#/definitions/B',
            },
          },
        },
        B: {
          type: 'object',
          properties: {
            a: {
              $ref: '#/definitions/A',
            },
            s: {
              type: 'string',
            },
          },
          patternProperties: {
            '^a$': {
              title: 'Pattern',
            },
          },
        },
      },
      $ref: '#/definitions/B',
    },
  },
  {
    name: '47 ->loop',
    source:
      'utils/test/schema.test.ts :: retrieveSchema() > stubExistingAdditionalProperties() > has an anyOf option that refers back to the definition it is declared in',
    schema: {
      definitions: {
        loop: {
          properties: {
            deep: {
              type: 'string',
            },
          },
          anyOf: [
            {
              $ref: '#/definitions/loop',
            },
          ],
        },
      },
      $ref: '#/definitions/loop',
    },
  },
  {
    name: '48',
    source: 'utils/test/findSchemaDefinition.test.ts :: findSchemaDefinition() > throws error when ref does not exist',
    schema: {
      type: 'object',
      definitions: {
        bundledSchema: {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          $id: 'https://example.com/bundled.ref.json',
          type: 'object',
          properties: {
            num: {
              type: 'integer',
            },
          },
        },
        stringRef: {
          type: 'string',
        },
        nestedRef: {
          $ref: '#/definitions/stringRef',
        },
        extraNestedRef: {
          $ref: '#/definitions/stringRef',
          title: 'foo',
        },
        badCircularNestedRef: {
          $ref: '#/definitions/badCircularNestedRef',
        },
        badCircularDeepNestedRef: {
          $ref: '#/definitions/badCircularDeeperNestedRef',
        },
        badCircularDeeperNestedRef: {
          $ref: '#/definitions/badCircularDeepestNestedRef',
        },
        badCircularDeepestNestedRef: {
          $ref: '#/definitions/badCircularDeepNestedRef',
        },
        bundledRef: {
          $ref: '/bundled.ref.json',
        },
      },
    },
  },
  {
    name: '48 ->bundledSchema',
    source: 'utils/test/findSchemaDefinition.test.ts :: findSchemaDefinition() > throws error when ref does not exist',
    schema: {
      definitions: {
        bundledSchema: {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          $id: 'https://example.com/bundled.ref.json',
          type: 'object',
          properties: {
            num: {
              type: 'integer',
            },
          },
        },
        stringRef: {
          type: 'string',
        },
        nestedRef: {
          $ref: '#/definitions/stringRef',
        },
        extraNestedRef: {
          $ref: '#/definitions/stringRef',
          title: 'foo',
        },
        badCircularNestedRef: {
          $ref: '#/definitions/badCircularNestedRef',
        },
        badCircularDeepNestedRef: {
          $ref: '#/definitions/badCircularDeeperNestedRef',
        },
        badCircularDeeperNestedRef: {
          $ref: '#/definitions/badCircularDeepestNestedRef',
        },
        badCircularDeepestNestedRef: {
          $ref: '#/definitions/badCircularDeepNestedRef',
        },
        bundledRef: {
          $ref: '/bundled.ref.json',
        },
      },
      $ref: '#/definitions/bundledSchema',
    },
  },
  {
    name: '48 ->stringRef',
    source: 'utils/test/findSchemaDefinition.test.ts :: findSchemaDefinition() > throws error when ref does not exist',
    schema: {
      definitions: {
        bundledSchema: {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          $id: 'https://example.com/bundled.ref.json',
          type: 'object',
          properties: {
            num: {
              type: 'integer',
            },
          },
        },
        stringRef: {
          type: 'string',
        },
        nestedRef: {
          $ref: '#/definitions/stringRef',
        },
        extraNestedRef: {
          $ref: '#/definitions/stringRef',
          title: 'foo',
        },
        badCircularNestedRef: {
          $ref: '#/definitions/badCircularNestedRef',
        },
        badCircularDeepNestedRef: {
          $ref: '#/definitions/badCircularDeeperNestedRef',
        },
        badCircularDeeperNestedRef: {
          $ref: '#/definitions/badCircularDeepestNestedRef',
        },
        badCircularDeepestNestedRef: {
          $ref: '#/definitions/badCircularDeepNestedRef',
        },
        bundledRef: {
          $ref: '/bundled.ref.json',
        },
      },
      $ref: '#/definitions/stringRef',
    },
  },
  {
    name: '48 ->nestedRef',
    source: 'utils/test/findSchemaDefinition.test.ts :: findSchemaDefinition() > throws error when ref does not exist',
    schema: {
      definitions: {
        bundledSchema: {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          $id: 'https://example.com/bundled.ref.json',
          type: 'object',
          properties: {
            num: {
              type: 'integer',
            },
          },
        },
        stringRef: {
          type: 'string',
        },
        nestedRef: {
          $ref: '#/definitions/stringRef',
        },
        extraNestedRef: {
          $ref: '#/definitions/stringRef',
          title: 'foo',
        },
        badCircularNestedRef: {
          $ref: '#/definitions/badCircularNestedRef',
        },
        badCircularDeepNestedRef: {
          $ref: '#/definitions/badCircularDeeperNestedRef',
        },
        badCircularDeeperNestedRef: {
          $ref: '#/definitions/badCircularDeepestNestedRef',
        },
        badCircularDeepestNestedRef: {
          $ref: '#/definitions/badCircularDeepNestedRef',
        },
        bundledRef: {
          $ref: '/bundled.ref.json',
        },
      },
      $ref: '#/definitions/nestedRef',
    },
  },
  {
    name: '48 ->extraNestedRef',
    source: 'utils/test/findSchemaDefinition.test.ts :: findSchemaDefinition() > throws error when ref does not exist',
    schema: {
      definitions: {
        bundledSchema: {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          $id: 'https://example.com/bundled.ref.json',
          type: 'object',
          properties: {
            num: {
              type: 'integer',
            },
          },
        },
        stringRef: {
          type: 'string',
        },
        nestedRef: {
          $ref: '#/definitions/stringRef',
        },
        extraNestedRef: {
          $ref: '#/definitions/stringRef',
          title: 'foo',
        },
        badCircularNestedRef: {
          $ref: '#/definitions/badCircularNestedRef',
        },
        badCircularDeepNestedRef: {
          $ref: '#/definitions/badCircularDeeperNestedRef',
        },
        badCircularDeeperNestedRef: {
          $ref: '#/definitions/badCircularDeepestNestedRef',
        },
        badCircularDeepestNestedRef: {
          $ref: '#/definitions/badCircularDeepNestedRef',
        },
        bundledRef: {
          $ref: '/bundled.ref.json',
        },
      },
      $ref: '#/definitions/extraNestedRef',
    },
  },
  {
    name: '48 ->badCircularNestedRef',
    source: 'utils/test/findSchemaDefinition.test.ts :: findSchemaDefinition() > throws error when ref does not exist',
    schema: {
      definitions: {
        bundledSchema: {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          $id: 'https://example.com/bundled.ref.json',
          type: 'object',
          properties: {
            num: {
              type: 'integer',
            },
          },
        },
        stringRef: {
          type: 'string',
        },
        nestedRef: {
          $ref: '#/definitions/stringRef',
        },
        extraNestedRef: {
          $ref: '#/definitions/stringRef',
          title: 'foo',
        },
        badCircularNestedRef: {
          $ref: '#/definitions/badCircularNestedRef',
        },
        badCircularDeepNestedRef: {
          $ref: '#/definitions/badCircularDeeperNestedRef',
        },
        badCircularDeeperNestedRef: {
          $ref: '#/definitions/badCircularDeepestNestedRef',
        },
        badCircularDeepestNestedRef: {
          $ref: '#/definitions/badCircularDeepNestedRef',
        },
        bundledRef: {
          $ref: '/bundled.ref.json',
        },
      },
      $ref: '#/definitions/badCircularNestedRef',
    },
  },
  {
    name: '48 ->badCircularDeepNestedRef',
    source: 'utils/test/findSchemaDefinition.test.ts :: findSchemaDefinition() > throws error when ref does not exist',
    schema: {
      definitions: {
        bundledSchema: {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          $id: 'https://example.com/bundled.ref.json',
          type: 'object',
          properties: {
            num: {
              type: 'integer',
            },
          },
        },
        stringRef: {
          type: 'string',
        },
        nestedRef: {
          $ref: '#/definitions/stringRef',
        },
        extraNestedRef: {
          $ref: '#/definitions/stringRef',
          title: 'foo',
        },
        badCircularNestedRef: {
          $ref: '#/definitions/badCircularNestedRef',
        },
        badCircularDeepNestedRef: {
          $ref: '#/definitions/badCircularDeeperNestedRef',
        },
        badCircularDeeperNestedRef: {
          $ref: '#/definitions/badCircularDeepestNestedRef',
        },
        badCircularDeepestNestedRef: {
          $ref: '#/definitions/badCircularDeepNestedRef',
        },
        bundledRef: {
          $ref: '/bundled.ref.json',
        },
      },
      $ref: '#/definitions/badCircularDeepNestedRef',
    },
  },
  {
    name: '48 ->badCircularDeeperNestedRef',
    source: 'utils/test/findSchemaDefinition.test.ts :: findSchemaDefinition() > throws error when ref does not exist',
    schema: {
      definitions: {
        bundledSchema: {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          $id: 'https://example.com/bundled.ref.json',
          type: 'object',
          properties: {
            num: {
              type: 'integer',
            },
          },
        },
        stringRef: {
          type: 'string',
        },
        nestedRef: {
          $ref: '#/definitions/stringRef',
        },
        extraNestedRef: {
          $ref: '#/definitions/stringRef',
          title: 'foo',
        },
        badCircularNestedRef: {
          $ref: '#/definitions/badCircularNestedRef',
        },
        badCircularDeepNestedRef: {
          $ref: '#/definitions/badCircularDeeperNestedRef',
        },
        badCircularDeeperNestedRef: {
          $ref: '#/definitions/badCircularDeepestNestedRef',
        },
        badCircularDeepestNestedRef: {
          $ref: '#/definitions/badCircularDeepNestedRef',
        },
        bundledRef: {
          $ref: '/bundled.ref.json',
        },
      },
      $ref: '#/definitions/badCircularDeeperNestedRef',
    },
  },
  {
    name: '48 ->badCircularDeepestNestedRef',
    source: 'utils/test/findSchemaDefinition.test.ts :: findSchemaDefinition() > throws error when ref does not exist',
    schema: {
      definitions: {
        bundledSchema: {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          $id: 'https://example.com/bundled.ref.json',
          type: 'object',
          properties: {
            num: {
              type: 'integer',
            },
          },
        },
        stringRef: {
          type: 'string',
        },
        nestedRef: {
          $ref: '#/definitions/stringRef',
        },
        extraNestedRef: {
          $ref: '#/definitions/stringRef',
          title: 'foo',
        },
        badCircularNestedRef: {
          $ref: '#/definitions/badCircularNestedRef',
        },
        badCircularDeepNestedRef: {
          $ref: '#/definitions/badCircularDeeperNestedRef',
        },
        badCircularDeeperNestedRef: {
          $ref: '#/definitions/badCircularDeepestNestedRef',
        },
        badCircularDeepestNestedRef: {
          $ref: '#/definitions/badCircularDeepNestedRef',
        },
        bundledRef: {
          $ref: '/bundled.ref.json',
        },
      },
      $ref: '#/definitions/badCircularDeepestNestedRef',
    },
  },
  {
    name: '48 ->bundledRef',
    source: 'utils/test/findSchemaDefinition.test.ts :: findSchemaDefinition() > throws error when ref does not exist',
    schema: {
      definitions: {
        bundledSchema: {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          $id: 'https://example.com/bundled.ref.json',
          type: 'object',
          properties: {
            num: {
              type: 'integer',
            },
          },
        },
        stringRef: {
          type: 'string',
        },
        nestedRef: {
          $ref: '#/definitions/stringRef',
        },
        extraNestedRef: {
          $ref: '#/definitions/stringRef',
          title: 'foo',
        },
        badCircularNestedRef: {
          $ref: '#/definitions/badCircularNestedRef',
        },
        badCircularDeepNestedRef: {
          $ref: '#/definitions/badCircularDeeperNestedRef',
        },
        badCircularDeeperNestedRef: {
          $ref: '#/definitions/badCircularDeepestNestedRef',
        },
        badCircularDeepestNestedRef: {
          $ref: '#/definitions/badCircularDeepNestedRef',
        },
        bundledRef: {
          $ref: '/bundled.ref.json',
        },
      },
      $ref: '#/definitions/bundledRef',
    },
  },
  {
    name: '49',
    source:
      'utils/test/schema/getUiRequiredErrorSchema.test.ts :: getUiRequiredErrorSchema() > recursive $ref cycles > does not stack overflow on a recursive $ref reached through a ui:definitions fragment',
    schema: {
      type: 'object',
      definitions: {
        Node: {
          type: 'object',
          properties: {
            value: {
              type: 'string',
            },
            next: {
              $ref: '#/definitions/Node',
            },
          },
        },
      },
      properties: {
        root: {
          $ref: '#/definitions/Node',
        },
      },
    },
  },
  {
    name: '49 ->Node',
    source:
      'utils/test/schema/getUiRequiredErrorSchema.test.ts :: getUiRequiredErrorSchema() > recursive $ref cycles > does not stack overflow on a recursive $ref reached through a ui:definitions fragment',
    schema: {
      definitions: {
        Node: {
          type: 'object',
          properties: {
            value: {
              type: 'string',
            },
            next: {
              $ref: '#/definitions/Node',
            },
          },
        },
      },
      $ref: '#/definitions/Node',
    },
  },
  {
    name: '50',
    source:
      'utils/test/parser/schemaParser.test.ts :: schemaParser() > parses a recursive schema carrying an anyOf on the recursive node',
    schema: {
      $ref: '#/definitions/Node',
      definitions: {
        Node: {
          type: 'object',
          properties: {
            child: {
              $ref: '#/definitions/Node',
            },
          },
          anyOf: [
            {
              required: ['a'],
            },
            {
              required: ['b'],
            },
          ],
        },
      },
    },
  },
  {
    name: '51',
    source:
      'utils/test/parser/schemaParser.test.ts :: schemaParser() > parses a recursive schema carrying a oneOf of one option',
    schema: {
      $ref: '#/definitions/Node',
      definitions: {
        Node: {
          type: 'object',
          properties: {
            child: {
              $ref: '#/definitions/Node',
            },
          },
          oneOf: [
            {
              required: ['a'],
            },
          ],
        },
      },
    },
  },
  {
    name: '52',
    source:
      'utils/test/parser/schemaParser.test.ts :: schemaParser() > parses a recursive schema carrying an allOf alongside the anyOf',
    schema: {
      $ref: '#/definitions/Node',
      definitions: {
        Node: {
          type: 'object',
          properties: {
            child: {
              $ref: '#/definitions/Node',
            },
          },
          allOf: [
            {
              title: 'x',
            },
          ],
          anyOf: [
            {
              required: ['a'],
            },
          ],
        },
      },
    },
  },
  {
    name: '52 populate',
    source:
      'utils/test/parser/schemaParser.test.ts :: schemaParser() > parses a recursive schema carrying an allOf alongside the anyOf',
    schema: {
      $ref: '#/definitions/Node',
      definitions: {
        Node: {
          type: 'object',
          properties: {
            child: {
              $ref: '#/definitions/Node',
            },
          },
          allOf: [
            {
              title: 'x',
            },
          ],
          anyOf: [
            {
              required: ['a'],
            },
          ],
        },
      },
    },
    populate: true,
  },
  {
    name: '53',
    source:
      'utils/test/parser/schemaParser.test.ts :: schemaParser() > parses a recursive schema carrying the recursion reached through an items',
    schema: {
      $ref: '#/definitions/Node',
      definitions: {
        Node: {
          type: 'object',
          properties: {
            children: {
              type: 'array',
              items: {
                $ref: '#/definitions/Node',
              },
            },
          },
          oneOf: [
            {
              required: ['a'],
            },
          ],
        },
      },
    },
  },
  {
    name: '54',
    source:
      'utils/test/parser/schemaParser.test.ts :: schemaParser() > parses a recursive $ref under a key its patternProperties match',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            child: {
              $ref: '#/definitions/node',
            },
          },
          patternProperties: {
            '^c': {
              type: 'object',
              properties: {
                tag: {
                  oneOf: [
                    {
                      const: 'p',
                    },
                  ],
                },
              },
            },
          },
        },
      },
      $ref: '#/definitions/node',
    },
  },
  {
    name: '55',
    source:
      'utils/test/schemaHasNestedConditional.test.ts :: schemaHasNestedConditional() > returns false and does not infinitely recurse for a circular $ref',
    schema: {
      type: 'object',
      definitions: {
        Node: {
          type: 'object',
          properties: {
            next: {
              $ref: '#/definitions/Node',
            },
          },
        },
      },
      properties: {
        root: {
          $ref: '#/definitions/Node',
        },
      },
    },
  },
  {
    name: '55 ->Node',
    source:
      'utils/test/schemaHasNestedConditional.test.ts :: schemaHasNestedConditional() > returns false and does not infinitely recurse for a circular $ref',
    schema: {
      definitions: {
        Node: {
          type: 'object',
          properties: {
            next: {
              $ref: '#/definitions/Node',
            },
          },
        },
      },
      $ref: '#/definitions/Node',
    },
  },
  {
    name: '56',
    source:
      'core/test/ObjectField.test.tsx :: ObjectField > additionalProperties > should resolve if/then conditions for an existing additionalProperties entry that is a $ref (issue #4266)',
    schema: {
      definitions: {
        property: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['string', 'object'],
              default: 'string',
            },
          },
          required: ['type'],
          if: {
            properties: {
              type: {
                const: 'object',
              },
            },
          },
          then: {
            properties: {
              properties: {
                $ref: '#/definitions/properties',
              },
            },
          },
        },
        properties: {
          type: 'object',
          additionalProperties: {
            default: {
              type: 'string',
            },
            $ref: '#/definitions/property',
          },
        },
      },
      $ref: '#/definitions/property',
    },
  },
  {
    name: '56 ->properties',
    source:
      'core/test/ObjectField.test.tsx :: ObjectField > additionalProperties > should resolve if/then conditions for an existing additionalProperties entry that is a $ref (issue #4266)',
    schema: {
      definitions: {
        property: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['string', 'object'],
              default: 'string',
            },
          },
          required: ['type'],
          if: {
            properties: {
              type: {
                const: 'object',
              },
            },
          },
          then: {
            properties: {
              properties: {
                $ref: '#/definitions/properties',
              },
            },
          },
        },
        properties: {
          type: 'object',
          additionalProperties: {
            default: {
              type: 'string',
            },
            $ref: '#/definitions/property',
          },
        },
      },
      $ref: '#/definitions/properties',
    },
  },
  {
    name: '57',
    source:
      'core/test/ObjectField.test.tsx :: ObjectField > additionalProperties > stops at the cycle for a recursive key that the patternProperties match',
    schema: {
      $ref: '#/definitions/node',
      definitions: {
        node: {
          type: 'object',
          properties: {
            child: {
              $ref: '#/definitions/node',
            },
            name: {
              type: 'string',
            },
          },
          patternProperties: {
            '^child': {
              title: 'Child',
            },
          },
        },
      },
    },
  },
  {
    name: '58',
    source:
      'core/test/anyOf.test.tsx :: anyOf > definitions > should correctly infer the selected option based on value',
    schema: {
      $ref: '#/definitions/any',
      definitions: {
        chain: {
          type: 'object',
          title: 'Chain',
          properties: {
            id: {
              enum: ['chain'],
            },
            components: {
              type: 'array',
              items: {
                $ref: '#/definitions/any',
              },
            },
          },
        },
        map: {
          type: 'object',
          title: 'Map',
          properties: {
            id: {
              enum: ['map'],
            },
            fn: {
              $ref: '#/definitions/any',
            },
          },
        },
        to_absolute: {
          type: 'object',
          title: 'To Absolute',
          properties: {
            id: {
              enum: ['to_absolute'],
            },
            base_url: {
              type: 'string',
            },
          },
        },
        transform: {
          type: 'object',
          title: 'Transform',
          properties: {
            id: {
              enum: ['transform'],
            },
            property_key: {
              type: 'string',
            },
            transformer: {
              $ref: '#/definitions/any',
            },
          },
        },
        any: {
          anyOf: [
            {
              $ref: '#/definitions/chain',
            },
            {
              $ref: '#/definitions/map',
            },
            {
              $ref: '#/definitions/to_absolute',
            },
            {
              $ref: '#/definitions/transform',
            },
          ],
        },
      },
    },
  },
  {
    name: '58 ->chain',
    source:
      'core/test/anyOf.test.tsx :: anyOf > definitions > should correctly infer the selected option based on value',
    schema: {
      definitions: {
        chain: {
          type: 'object',
          title: 'Chain',
          properties: {
            id: {
              enum: ['chain'],
            },
            components: {
              type: 'array',
              items: {
                $ref: '#/definitions/any',
              },
            },
          },
        },
        map: {
          type: 'object',
          title: 'Map',
          properties: {
            id: {
              enum: ['map'],
            },
            fn: {
              $ref: '#/definitions/any',
            },
          },
        },
        to_absolute: {
          type: 'object',
          title: 'To Absolute',
          properties: {
            id: {
              enum: ['to_absolute'],
            },
            base_url: {
              type: 'string',
            },
          },
        },
        transform: {
          type: 'object',
          title: 'Transform',
          properties: {
            id: {
              enum: ['transform'],
            },
            property_key: {
              type: 'string',
            },
            transformer: {
              $ref: '#/definitions/any',
            },
          },
        },
        any: {
          anyOf: [
            {
              $ref: '#/definitions/chain',
            },
            {
              $ref: '#/definitions/map',
            },
            {
              $ref: '#/definitions/to_absolute',
            },
            {
              $ref: '#/definitions/transform',
            },
          ],
        },
      },
      $ref: '#/definitions/chain',
    },
  },
  {
    name: '58 ->map',
    source:
      'core/test/anyOf.test.tsx :: anyOf > definitions > should correctly infer the selected option based on value',
    schema: {
      definitions: {
        chain: {
          type: 'object',
          title: 'Chain',
          properties: {
            id: {
              enum: ['chain'],
            },
            components: {
              type: 'array',
              items: {
                $ref: '#/definitions/any',
              },
            },
          },
        },
        map: {
          type: 'object',
          title: 'Map',
          properties: {
            id: {
              enum: ['map'],
            },
            fn: {
              $ref: '#/definitions/any',
            },
          },
        },
        to_absolute: {
          type: 'object',
          title: 'To Absolute',
          properties: {
            id: {
              enum: ['to_absolute'],
            },
            base_url: {
              type: 'string',
            },
          },
        },
        transform: {
          type: 'object',
          title: 'Transform',
          properties: {
            id: {
              enum: ['transform'],
            },
            property_key: {
              type: 'string',
            },
            transformer: {
              $ref: '#/definitions/any',
            },
          },
        },
        any: {
          anyOf: [
            {
              $ref: '#/definitions/chain',
            },
            {
              $ref: '#/definitions/map',
            },
            {
              $ref: '#/definitions/to_absolute',
            },
            {
              $ref: '#/definitions/transform',
            },
          ],
        },
      },
      $ref: '#/definitions/map',
    },
  },
  {
    name: '58 ->to_absolute',
    source:
      'core/test/anyOf.test.tsx :: anyOf > definitions > should correctly infer the selected option based on value',
    schema: {
      definitions: {
        chain: {
          type: 'object',
          title: 'Chain',
          properties: {
            id: {
              enum: ['chain'],
            },
            components: {
              type: 'array',
              items: {
                $ref: '#/definitions/any',
              },
            },
          },
        },
        map: {
          type: 'object',
          title: 'Map',
          properties: {
            id: {
              enum: ['map'],
            },
            fn: {
              $ref: '#/definitions/any',
            },
          },
        },
        to_absolute: {
          type: 'object',
          title: 'To Absolute',
          properties: {
            id: {
              enum: ['to_absolute'],
            },
            base_url: {
              type: 'string',
            },
          },
        },
        transform: {
          type: 'object',
          title: 'Transform',
          properties: {
            id: {
              enum: ['transform'],
            },
            property_key: {
              type: 'string',
            },
            transformer: {
              $ref: '#/definitions/any',
            },
          },
        },
        any: {
          anyOf: [
            {
              $ref: '#/definitions/chain',
            },
            {
              $ref: '#/definitions/map',
            },
            {
              $ref: '#/definitions/to_absolute',
            },
            {
              $ref: '#/definitions/transform',
            },
          ],
        },
      },
      $ref: '#/definitions/to_absolute',
    },
  },
  {
    name: '58 ->transform',
    source:
      'core/test/anyOf.test.tsx :: anyOf > definitions > should correctly infer the selected option based on value',
    schema: {
      definitions: {
        chain: {
          type: 'object',
          title: 'Chain',
          properties: {
            id: {
              enum: ['chain'],
            },
            components: {
              type: 'array',
              items: {
                $ref: '#/definitions/any',
              },
            },
          },
        },
        map: {
          type: 'object',
          title: 'Map',
          properties: {
            id: {
              enum: ['map'],
            },
            fn: {
              $ref: '#/definitions/any',
            },
          },
        },
        to_absolute: {
          type: 'object',
          title: 'To Absolute',
          properties: {
            id: {
              enum: ['to_absolute'],
            },
            base_url: {
              type: 'string',
            },
          },
        },
        transform: {
          type: 'object',
          title: 'Transform',
          properties: {
            id: {
              enum: ['transform'],
            },
            property_key: {
              type: 'string',
            },
            transformer: {
              $ref: '#/definitions/any',
            },
          },
        },
        any: {
          anyOf: [
            {
              $ref: '#/definitions/chain',
            },
            {
              $ref: '#/definitions/map',
            },
            {
              $ref: '#/definitions/to_absolute',
            },
            {
              $ref: '#/definitions/transform',
            },
          ],
        },
      },
      $ref: '#/definitions/transform',
    },
  },
  {
    name: '59',
    source: 'core/test/oneOf.test.tsx :: oneOf > definitions > should handle the $ref keyword correctly',
    schema: {
      definitions: {
        fieldEither: {
          type: 'object',
          oneOf: [
            {
              type: 'object',
              properties: {
                value: {
                  type: 'string',
                },
              },
            },
            {
              type: 'object',
              properties: {
                value: {
                  type: 'array',
                  items: {
                    $ref: '#/definitions/fieldEither',
                  },
                },
              },
            },
          ],
        },
      },
      type: 'object',
      properties: {
        value: {
          type: 'array',
          items: {
            $ref: '#/definitions/fieldEither',
          },
        },
      },
    },
  },
  {
    name: '59 ->fieldEither',
    source: 'core/test/oneOf.test.tsx :: oneOf > definitions > should handle the $ref keyword correctly',
    schema: {
      definitions: {
        fieldEither: {
          type: 'object',
          oneOf: [
            {
              type: 'object',
              properties: {
                value: {
                  type: 'string',
                },
              },
            },
            {
              type: 'object',
              properties: {
                value: {
                  type: 'array',
                  items: {
                    $ref: '#/definitions/fieldEither',
                  },
                },
              },
            },
          ],
        },
      },
      $ref: '#/definitions/fieldEither',
    },
  },
  {
    name: '60',
    source:
      'core/test/oneOf.test.tsx :: oneOf > definitions > should correctly infer the selected option based on value',
    schema: {
      $ref: '#/definitions/any',
      definitions: {
        chain: {
          type: 'object',
          title: 'Chain',
          properties: {
            id: {
              enum: ['chain'],
            },
            components: {
              type: 'array',
              items: {
                $ref: '#/definitions/any',
              },
            },
          },
        },
        map: {
          type: 'object',
          title: 'Map',
          properties: {
            id: {
              enum: ['map'],
            },
            fn: {
              $ref: '#/definitions/any',
            },
          },
        },
        to_absolute: {
          type: 'object',
          title: 'To Absolute',
          properties: {
            id: {
              enum: ['to_absolute'],
            },
            base_url: {
              type: 'string',
            },
          },
        },
        transform: {
          type: 'object',
          title: 'Transform',
          properties: {
            id: {
              enum: ['transform'],
            },
            property_key: {
              type: 'string',
            },
            transformer: {
              $ref: '#/definitions/any',
            },
          },
        },
        any: {
          oneOf: [
            {
              $ref: '#/definitions/chain',
            },
            {
              $ref: '#/definitions/map',
            },
            {
              $ref: '#/definitions/to_absolute',
            },
            {
              $ref: '#/definitions/transform',
            },
          ],
        },
      },
    },
  },
  {
    name: '60 ->chain',
    source:
      'core/test/oneOf.test.tsx :: oneOf > definitions > should correctly infer the selected option based on value',
    schema: {
      definitions: {
        chain: {
          type: 'object',
          title: 'Chain',
          properties: {
            id: {
              enum: ['chain'],
            },
            components: {
              type: 'array',
              items: {
                $ref: '#/definitions/any',
              },
            },
          },
        },
        map: {
          type: 'object',
          title: 'Map',
          properties: {
            id: {
              enum: ['map'],
            },
            fn: {
              $ref: '#/definitions/any',
            },
          },
        },
        to_absolute: {
          type: 'object',
          title: 'To Absolute',
          properties: {
            id: {
              enum: ['to_absolute'],
            },
            base_url: {
              type: 'string',
            },
          },
        },
        transform: {
          type: 'object',
          title: 'Transform',
          properties: {
            id: {
              enum: ['transform'],
            },
            property_key: {
              type: 'string',
            },
            transformer: {
              $ref: '#/definitions/any',
            },
          },
        },
        any: {
          oneOf: [
            {
              $ref: '#/definitions/chain',
            },
            {
              $ref: '#/definitions/map',
            },
            {
              $ref: '#/definitions/to_absolute',
            },
            {
              $ref: '#/definitions/transform',
            },
          ],
        },
      },
      $ref: '#/definitions/chain',
    },
  },
  {
    name: '60 ->map',
    source:
      'core/test/oneOf.test.tsx :: oneOf > definitions > should correctly infer the selected option based on value',
    schema: {
      definitions: {
        chain: {
          type: 'object',
          title: 'Chain',
          properties: {
            id: {
              enum: ['chain'],
            },
            components: {
              type: 'array',
              items: {
                $ref: '#/definitions/any',
              },
            },
          },
        },
        map: {
          type: 'object',
          title: 'Map',
          properties: {
            id: {
              enum: ['map'],
            },
            fn: {
              $ref: '#/definitions/any',
            },
          },
        },
        to_absolute: {
          type: 'object',
          title: 'To Absolute',
          properties: {
            id: {
              enum: ['to_absolute'],
            },
            base_url: {
              type: 'string',
            },
          },
        },
        transform: {
          type: 'object',
          title: 'Transform',
          properties: {
            id: {
              enum: ['transform'],
            },
            property_key: {
              type: 'string',
            },
            transformer: {
              $ref: '#/definitions/any',
            },
          },
        },
        any: {
          oneOf: [
            {
              $ref: '#/definitions/chain',
            },
            {
              $ref: '#/definitions/map',
            },
            {
              $ref: '#/definitions/to_absolute',
            },
            {
              $ref: '#/definitions/transform',
            },
          ],
        },
      },
      $ref: '#/definitions/map',
    },
  },
  {
    name: '60 ->to_absolute',
    source:
      'core/test/oneOf.test.tsx :: oneOf > definitions > should correctly infer the selected option based on value',
    schema: {
      definitions: {
        chain: {
          type: 'object',
          title: 'Chain',
          properties: {
            id: {
              enum: ['chain'],
            },
            components: {
              type: 'array',
              items: {
                $ref: '#/definitions/any',
              },
            },
          },
        },
        map: {
          type: 'object',
          title: 'Map',
          properties: {
            id: {
              enum: ['map'],
            },
            fn: {
              $ref: '#/definitions/any',
            },
          },
        },
        to_absolute: {
          type: 'object',
          title: 'To Absolute',
          properties: {
            id: {
              enum: ['to_absolute'],
            },
            base_url: {
              type: 'string',
            },
          },
        },
        transform: {
          type: 'object',
          title: 'Transform',
          properties: {
            id: {
              enum: ['transform'],
            },
            property_key: {
              type: 'string',
            },
            transformer: {
              $ref: '#/definitions/any',
            },
          },
        },
        any: {
          oneOf: [
            {
              $ref: '#/definitions/chain',
            },
            {
              $ref: '#/definitions/map',
            },
            {
              $ref: '#/definitions/to_absolute',
            },
            {
              $ref: '#/definitions/transform',
            },
          ],
        },
      },
      $ref: '#/definitions/to_absolute',
    },
  },
  {
    name: '60 ->transform',
    source:
      'core/test/oneOf.test.tsx :: oneOf > definitions > should correctly infer the selected option based on value',
    schema: {
      definitions: {
        chain: {
          type: 'object',
          title: 'Chain',
          properties: {
            id: {
              enum: ['chain'],
            },
            components: {
              type: 'array',
              items: {
                $ref: '#/definitions/any',
              },
            },
          },
        },
        map: {
          type: 'object',
          title: 'Map',
          properties: {
            id: {
              enum: ['map'],
            },
            fn: {
              $ref: '#/definitions/any',
            },
          },
        },
        to_absolute: {
          type: 'object',
          title: 'To Absolute',
          properties: {
            id: {
              enum: ['to_absolute'],
            },
            base_url: {
              type: 'string',
            },
          },
        },
        transform: {
          type: 'object',
          title: 'Transform',
          properties: {
            id: {
              enum: ['transform'],
            },
            property_key: {
              type: 'string',
            },
            transformer: {
              $ref: '#/definitions/any',
            },
          },
        },
        any: {
          oneOf: [
            {
              $ref: '#/definitions/chain',
            },
            {
              $ref: '#/definitions/map',
            },
            {
              $ref: '#/definitions/to_absolute',
            },
            {
              $ref: '#/definitions/transform',
            },
          ],
        },
      },
      $ref: '#/definitions/transform',
    },
  },
  {
    name: '61',
    source:
      'core/test/Form.behaviors.test.tsx :: optionalDataControls > renders the optional data controls for a nested object described by the root schema itself',
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
        child: {
          $ref: '#',
        },
      },
    },
  },
  {
    name: '62',
    source:
      'core/test/uiSchema.test.tsx :: uiSchema > ui:definitions > should apply ui:definitions at 5 levels of recursive $ref depth',
    schema: {
      $ref: '#/$defs/node',
      $defs: {
        node: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            children: {
              type: 'array',
              items: {
                $ref: '#/$defs/node',
              },
            },
          },
        },
      },
    },
  },
  {
    name: '63',
    source:
      'core/test/uiSchema.test.tsx :: uiSchema > ui:definitions > should apply ui:title from ui:definitions to oneOf dropdown labels at recursive depth',
    schema: {
      type: 'object',
      properties: {
        tree: {
          type: 'array',
          items: {
            oneOf: [
              {
                title: 'None',
                type: 'null',
              },
              {
                $ref: '#/$defs/node',
              },
            ],
          },
        },
      },
      $defs: {
        node: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            children: {
              type: 'array',
              items: {
                oneOf: [
                  {
                    title: 'None',
                    type: 'null',
                  },
                  {
                    $ref: '#/$defs/node',
                  },
                ],
              },
            },
          },
        },
      },
    },
  },
  {
    name: '63 ->node',
    source:
      'core/test/uiSchema.test.tsx :: uiSchema > ui:definitions > should apply ui:title from ui:definitions to oneOf dropdown labels at recursive depth',
    schema: {
      $defs: {
        node: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            children: {
              type: 'array',
              items: {
                oneOf: [
                  {
                    title: 'None',
                    type: 'null',
                  },
                  {
                    $ref: '#/$defs/node',
                  },
                ],
              },
            },
          },
        },
      },
      $ref: '#/$defs/node',
    },
  },
  {
    name: '64',
    source:
      'core/test/SchemaField.test.tsx :: SchemaField > cyclic $ref > renders a cycle indicator for a recursion reached through a nested property',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            wrap: {
              type: 'object',
              properties: {
                child: {
                  $ref: '#/definitions/node',
                },
              },
            },
          },
        },
      },
      $ref: '#/definitions/node',
    },
  },
  {
    name: '65',
    source:
      'core/test/SchemaField.test.tsx :: SchemaField > cyclic $ref > renders a cycle indicator for a recursion reached through a then branch',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
          },
          if: {},
          then: {
            properties: {
              child: {
                $ref: '#/definitions/node',
              },
            },
          },
        },
      },
      $ref: '#/definitions/node',
    },
  },
  {
    name: '66',
    source:
      'core/test/SchemaField.test.tsx :: SchemaField > cyclic $ref > clicking the expand button shows the next level of the cycle',
    schema: {
      title: 'A registration form',
      description: 'A simple form example.',
      type: 'object',
      properties: {
        child: {
          $ref: '#',
        },
      },
    },
  },
  {
    name: '67',
    source:
      'core/test/Form.store.test.tsx :: an item set through the handle and an add in one event, on an array a core field renders below itself > below CyclicSchemaField, the add builds on the item set',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            list: {
              type: 'array',
              items: {
                type: 'string',
                default: 'new',
              },
            },
            next: {
              $ref: '#/definitions/node',
            },
          },
        },
      },
      type: 'object',
      properties: {
        tree: {
          $ref: '#/definitions/node',
        },
      },
    },
  },
  {
    name: '67 ->node',
    source:
      'core/test/Form.store.test.tsx :: an item set through the handle and an add in one event, on an array a core field renders below itself > below CyclicSchemaField, the add builds on the item set',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            list: {
              type: 'array',
              items: {
                type: 'string',
                default: 'new',
              },
            },
            next: {
              $ref: '#/definitions/node',
            },
          },
        },
      },
      $ref: '#/definitions/node',
    },
  },
  {
    name: 'S0',
    source: 'playground/src/samples/references.ts',
    schema: {
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
        node: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            children: {
              type: 'array',
              items: {
                oneOf: [
                  {
                    title: 'None',
                    type: 'null',
                  },
                  {
                    $ref: '#/definitions/node',
                  },
                ],
              },
            },
          },
        },
        personType: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            details: {
              type: 'string',
            },
          },
        },
        companyType: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            details: {
              type: 'string',
            },
          },
        },
      },
      type: 'object',
      properties: {
        billing_address: {
          title: 'Billing address',
          $ref: '#/definitions/address',
        },
        shipping_address: {
          title: 'Shipping address',
          $ref: '#/definitions/address',
        },
        tree: {
          title: 'Recursive references',
          $ref: '#/definitions/node',
        },
        contact: {
          title: 'Contact (oneOf with same property names)',
          oneOf: [
            {
              title: 'Person',
              $ref: '#/definitions/personType',
            },
            {
              title: 'Company',
              $ref: '#/definitions/companyType',
            },
          ],
        },
      },
    },
  },
  {
    name: 'S0 ->address',
    source: 'playground/src/samples/references.ts',
    schema: {
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
        node: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            children: {
              type: 'array',
              items: {
                oneOf: [
                  {
                    title: 'None',
                    type: 'null',
                  },
                  {
                    $ref: '#/definitions/node',
                  },
                ],
              },
            },
          },
        },
        personType: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            details: {
              type: 'string',
            },
          },
        },
        companyType: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            details: {
              type: 'string',
            },
          },
        },
      },
      $ref: '#/definitions/address',
    },
  },
  {
    name: 'S0 ->node',
    source: 'playground/src/samples/references.ts',
    schema: {
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
        node: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            children: {
              type: 'array',
              items: {
                oneOf: [
                  {
                    title: 'None',
                    type: 'null',
                  },
                  {
                    $ref: '#/definitions/node',
                  },
                ],
              },
            },
          },
        },
        personType: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            details: {
              type: 'string',
            },
          },
        },
        companyType: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            details: {
              type: 'string',
            },
          },
        },
      },
      $ref: '#/definitions/node',
    },
  },
  {
    name: 'S0 ->personType',
    source: 'playground/src/samples/references.ts',
    schema: {
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
        node: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            children: {
              type: 'array',
              items: {
                oneOf: [
                  {
                    title: 'None',
                    type: 'null',
                  },
                  {
                    $ref: '#/definitions/node',
                  },
                ],
              },
            },
          },
        },
        personType: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            details: {
              type: 'string',
            },
          },
        },
        companyType: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            details: {
              type: 'string',
            },
          },
        },
      },
      $ref: '#/definitions/personType',
    },
  },
  {
    name: 'S0 ->companyType',
    source: 'playground/src/samples/references.ts',
    schema: {
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
        node: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            children: {
              type: 'array',
              items: {
                oneOf: [
                  {
                    title: 'None',
                    type: 'null',
                  },
                  {
                    $ref: '#/definitions/node',
                  },
                ],
              },
            },
          },
        },
        personType: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            details: {
              type: 'string',
            },
          },
        },
        companyType: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            details: {
              type: 'string',
            },
          },
        },
      },
      $ref: '#/definitions/companyType',
    },
  },
  {
    name: 'D cyc click',
    source: 'core/test/SchemaField.test.tsx:1302',
    schema: {
      title: 'A registration form',
      type: 'object',
      properties: {
        child: {
          $ref: '#',
        },
      },
    },
    expand: ['root_child_child-button'],
  },
  {
    name: 'D then click',
    source: 'core/test/SchemaField.test.tsx:1265',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
          },
          if: {},
          then: {
            properties: {
              child: {
                $ref: '#/definitions/node',
              },
            },
          },
        },
      },
      $ref: '#/definitions/node',
    },
    expand: ['root_child-button'],
  },
  {
    name: 'D wrap click',
    source: 'core/test/SchemaField.test.tsx:1253 (+click)',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            wrap: {
              type: 'object',
              properties: {
                child: {
                  $ref: '#/definitions/node',
                },
              },
            },
          },
        },
      },
      $ref: '#/definitions/node',
    },
    expand: ['root_wrap_child-button'],
  },
  {
    name: 'D tree5',
    source: 'core/test/uiSchema.test.tsx:2735',
    schema: {
      $ref: '#/$defs/node',
      $defs: {
        node: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            children: {
              type: 'array',
              items: {
                $ref: '#/$defs/node',
              },
            },
          },
        },
      },
    },
    formData: {
      name: 'L0',
      children: [
        {
          name: 'L1',
          children: [
            {
              name: 'L2',
              children: [
                {
                  name: 'L3',
                  children: [
                    {
                      name: 'L4',
                      children: [],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    name: 'D treeOneOf',
    source: 'core/test/uiSchema.test.tsx:2775',
    schema: {
      type: 'object',
      properties: {
        tree: {
          type: 'array',
          items: {
            oneOf: [
              {
                title: 'None',
                type: 'null',
              },
              {
                $ref: '#/$defs/node',
              },
            ],
          },
        },
      },
      $defs: {
        node: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            children: {
              type: 'array',
              items: {
                oneOf: [
                  {
                    title: 'None',
                    type: 'null',
                  },
                  {
                    $ref: '#/$defs/node',
                  },
                ],
              },
            },
          },
        },
      },
    },
    formData: {
      tree: [
        {
          name: 'L0',
          children: [
            {
              name: 'L1',
              children: [],
            },
          ],
        },
      ],
    },
  },
  {
    name: 'D 4266',
    source: 'core/test/ObjectField.test.tsx:767',
    schema: {
      definitions: {
        property: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['string', 'object'],
              default: 'string',
            },
          },
          required: ['type'],
          if: {
            properties: {
              type: {
                const: 'object',
              },
            },
          },
          then: {
            properties: {
              properties: {
                $ref: '#/definitions/properties',
              },
            },
          },
        },
        properties: {
          type: 'object',
          additionalProperties: {
            default: {
              type: 'string',
            },
            $ref: '#/definitions/property',
          },
        },
      },
      $ref: '#/definitions/property',
    },
    formData: {
      type: 'object',
      properties: {
        inner: {
          type: 'object',
          properties: {},
        },
      },
    },
  },
  {
    name: 'D cyc click twice',
    source: 'parity review probe, no test pins it',
    schema: {
      title: 'A registration form',
      type: 'object',
      properties: {
        child: {
          $ref: '#',
        },
      },
    },
    expand: ['root_child_child-button', 'root_child_child_child_child-button'],
  },
  {
    name: 'E items row ref prop',
    source: 'parity review probe, no test pins it',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            kids: {
              type: 'array',
              items: {
                $ref: '#/definitions/node',
              },
            },
            best: {
              $ref: '#/definitions/node',
            },
          },
        },
      },
      $ref: '#/definitions/node',
    },
    formData: {
      kids: [{}],
    },
  },
  {
    name: 'E addl key ref prop',
    source: 'parity review probe, no test pins it',
    schema: {
      definitions: {
        map: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            best: {
              $ref: '#/definitions/map',
            },
          },
          additionalProperties: {
            $ref: '#/definitions/map',
          },
        },
      },
      $ref: '#/definitions/map',
    },
    formData: {
      k: {},
    },
  },
  {
    name: 'E 4266 no data',
    source: 'parity review probe, no test pins it',
    schema: {
      definitions: {
        property: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['string', 'object'],
              default: 'string',
            },
          },
          required: ['type'],
          if: {
            properties: {
              type: {
                const: 'object',
              },
            },
          },
          then: {
            properties: {
              properties: {
                $ref: '#/definitions/properties',
              },
            },
          },
        },
        properties: {
          type: 'object',
          additionalProperties: {
            default: {
              type: 'string',
            },
            $ref: '#/definitions/property',
          },
        },
      },
      $ref: '#/definitions/property',
    },
  },
  {
    name: 'E2 nonref root row',
    source: 'parity review probe, no test pins it',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            kids: {
              type: 'array',
              items: {
                $ref: '#/definitions/node',
              },
            },
            best: {
              $ref: '#/definitions/node',
            },
          },
        },
      },
      type: 'object',
      properties: {
        kids: {
          type: 'array',
          items: {
            $ref: '#/definitions/node',
          },
        },
      },
    },
    formData: {
      kids: [{}],
    },
  },
  {
    name: 'E row nested',
    source: 'parity review probe, no test pins it',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            kids: {
              type: 'array',
              items: {
                $ref: '#/definitions/node',
              },
            },
            best: {
              $ref: '#/definitions/node',
            },
          },
        },
      },
      $ref: '#/definitions/node',
    },
    formData: {
      kids: [
        {
          kids: [{}],
        },
      ],
    },
  },
  {
    name: 'E row no data',
    source: 'parity review probe, no test pins it',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            kids: {
              type: 'array',
              items: {
                $ref: '#/definitions/node',
              },
            },
            best: {
              $ref: '#/definitions/node',
            },
          },
        },
      },
      $ref: '#/definitions/node',
    },
  },
  {
    name: 'F req array nonrec',
    source: 'parity review probe, no test pins it',
    schema: {
      type: 'object',
      properties: {
        children: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      },
      allOf: [
        {
          required: ['children'],
        },
      ],
    },
  },
  {
    name: 'F req array nonrec direct',
    source: 'parity review probe, no test pins it',
    schema: {
      type: 'object',
      properties: {
        children: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      },
      required: ['children'],
    },
  },
  {
    name: 'F collapsed typed sibling prop',
    source: 'parity review probe, no test pins it',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              default: 'n',
            },
            child: {
              type: 'object',
              properties: {
                own: {
                  type: 'string',
                  default: 'o',
                },
              },
              allOf: [
                {
                  $ref: '#/definitions/node',
                },
              ],
            },
          },
        },
      },
      $ref: '#/definitions/node',
    },
    populate: true,
  },
  {
    name: 'F collapsed ref sibling default',
    source: 'parity review probe, no test pins it',
    schema: {
      definitions: {
        node: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              default: 'n',
            },
            child: {
              $ref: '#/definitions/node',
              properties: {
                own: {
                  type: 'string',
                  default: 'o',
                },
              },
            },
          },
        },
      },
      $ref: '#/definitions/node',
    },
  },
  {
    name: 'G oneOf data',
    source: 'core/test/oneOf.test.tsx:2011',
    schema: {
      $ref: '#/definitions/any',
      definitions: {
        chain: {
          type: 'object',
          title: 'Chain',
          properties: {
            id: {
              enum: ['chain'],
            },
            components: {
              type: 'array',
              items: {
                $ref: '#/definitions/any',
              },
            },
          },
        },
        map: {
          type: 'object',
          title: 'Map',
          properties: {
            id: {
              enum: ['map'],
            },
            fn: {
              $ref: '#/definitions/any',
            },
          },
        },
        to_absolute: {
          type: 'object',
          title: 'To Absolute',
          properties: {
            id: {
              enum: ['to_absolute'],
            },
            base_url: {
              type: 'string',
            },
          },
        },
        transform: {
          type: 'object',
          title: 'Transform',
          properties: {
            id: {
              enum: ['transform'],
            },
            property_key: {
              type: 'string',
            },
            transformer: {
              $ref: '#/definitions/any',
            },
          },
        },
        any: {
          oneOf: [
            {
              $ref: '#/definitions/chain',
            },
            {
              $ref: '#/definitions/map',
            },
            {
              $ref: '#/definitions/to_absolute',
            },
            {
              $ref: '#/definitions/transform',
            },
          ],
        },
      },
    },
    formData: {
      id: 'chain',
      components: [
        {
          id: 'map',
          fn: {
            id: 'transform',
            property_key: 'uri',
            transformer: {
              id: 'to_absolute',
              base_url: 'http://localhost',
            },
          },
        },
      ],
    },
  },
  {
    name: 'G anyOf data',
    source: 'core/test/anyOf.test.tsx',
    schema: {
      $ref: '#/definitions/any',
      definitions: {
        chain: {
          type: 'object',
          title: 'Chain',
          properties: {
            id: {
              enum: ['chain'],
            },
            components: {
              type: 'array',
              items: {
                $ref: '#/definitions/any',
              },
            },
          },
        },
        map: {
          type: 'object',
          title: 'Map',
          properties: {
            id: {
              enum: ['map'],
            },
            fn: {
              $ref: '#/definitions/any',
            },
          },
        },
        to_absolute: {
          type: 'object',
          title: 'To Absolute',
          properties: {
            id: {
              enum: ['to_absolute'],
            },
            base_url: {
              type: 'string',
            },
          },
        },
        transform: {
          type: 'object',
          title: 'Transform',
          properties: {
            id: {
              enum: ['transform'],
            },
            property_key: {
              type: 'string',
            },
            transformer: {
              $ref: '#/definitions/any',
            },
          },
        },
        any: {
          anyOf: [
            {
              $ref: '#/definitions/chain',
            },
            {
              $ref: '#/definitions/map',
            },
            {
              $ref: '#/definitions/to_absolute',
            },
            {
              $ref: '#/definitions/transform',
            },
          ],
        },
      },
    },
    formData: {
      id: 'chain',
      components: [
        {
          id: 'map',
          fn: {
            id: 'transform',
            property_key: 'uri',
            transformer: {
              id: 'to_absolute',
              base_url: 'http://localhost',
            },
          },
        },
      ],
    },
  },
];
