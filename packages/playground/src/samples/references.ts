import { Sample } from './Sample';

const references: Sample = {
  schema: {
    definitions: {
      address: {
        type: 'object',
        properties: {
          street_address: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
        },
        required: ['street_address', 'city', 'state'],
      },
      node: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          children: {
            type: 'array',
            items: {
              $ref: '#/definitions/node',
            },
          },
        },
      },
      personType: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          details: { type: 'string' },
        },
      },
      companyType: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          details: { type: 'string' },
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
          { title: 'Person', $ref: '#/definitions/personType' },
          { title: 'Company', $ref: '#/definitions/companyType' },
        ],
      },
    },
  },
  uiSchema: {
    'ui:order': ['shipping_address', 'billing_address', 'contact', 'tree'],
    'ui:definitions': {
      '#/definitions/node': {
        name: {
          'ui:placeholder': 'Enter node name',
          'ui:help': 'This UI is defined once in ui:definitions and applied at all recursion levels',
        },
        children: {
          'ui:options': {
            orderable: false,
          },
        },
      },
      '#/definitions/address': {
        street_address: {
          'ui:placeholder': 'Street and number',
        },
        city: {
          'ui:placeholder': 'City name',
        },
        state: {
          'ui:placeholder': 'State or region',
        },
      },
      '#/definitions/personType': {
        name: {
          'ui:placeholder': 'Full name (e.g., John Doe)',
          'ui:help': 'Person-specific UI from ui:definitions',
        },
        details: {
          'ui:widget': 'textarea',
          'ui:placeholder': 'Personal bio...',
        },
      },
      '#/definitions/companyType': {
        name: {
          'ui:placeholder': 'Company name (e.g., Acme Inc.)',
          'ui:help': 'Company-specific UI from ui:definitions',
        },
        details: {
          'ui:widget': 'textarea',
          'ui:placeholder': 'Company description...',
        },
      },
    },
    shipping_address: {
      street_address: {
        'ui:placeholder': 'Shipping street (leave empty for pickup)',
      },
    },
  },
  formData: {
    billing_address: {
      street_address: '21, Jump Street',
      city: 'Babel',
      state: 'Neverland',
    },
    shipping_address: {
      street_address: '221B, Baker Street',
      city: 'London',
      state: 'N/A',
    },
    tree: {
      name: 'root',
      children: [{ name: 'leaf' }],
    },
    contact: {
      name: 'Jane Smith',
      details: 'Software engineer',
    },
  },
};

export default references;
