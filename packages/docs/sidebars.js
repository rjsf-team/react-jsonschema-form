/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  // By default, Docusaurus generates a sidebar from the docs folder structure
  docs: [
    'intro',
    'quickstart',
    'contributing',
    {
      type: 'category',
      label: 'JSON Schema',
      link: {
        description: 'Documentation for how to use JSON Schema constructs in react-jsonschema-form.',
        type: 'generated-index',
        title: 'JSON Schema',
        slug: '/json-schema',
      },
      items: [
        'usage/single',
        'usage/objects',
        'usage/arrays',
        'usage/definitions',
        'usage/dependencies',
        'usage/oneof',
      ],
    },
    {
      type: 'category',
      label: 'Usage',
      link: {
        type: 'generated-index',
        title: 'Usage',
        description: 'How to use react-jsonschema-form to customize your form behavior and appearance.',
        slug: '/usage',
      },
      items: ['usage/widgets', 'usage/themes', 'usage/validation'],
    },
    {
      type: 'category',
      label: 'Advanced Customization',
      link: {
        type: 'generated-index',
        title: 'Advanced Customization',
        description: 'Advanced customization documentation for react-jsonschema-form.',
        slug: '/advanced-customization',
      },
      items: [
        'advanced-customization/custom-widgets-fields',
        'advanced-customization/custom-templates',
        'advanced-customization/custom-themes',
        'advanced-customization/internals',
        'advanced-customization/typescript',
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      link: {
        type: 'generated-index',
        title: 'API Reference',
        description: 'API documentation for react-jsonschema-form.',
        slug: '/api-reference',
      },
      items: [
        'api-reference/uiSchema',
        'api-reference/themes/semantic-ui/uiSchema',
        'api-reference/themes/chakra-ui/uiSchema',
        'api-reference/form-props',
        'api-reference/utility-functions',
        'api-reference/validator-ajv8'
      ],
    },
    {
      type: 'category',
      label: 'Migration Guides',
      link: {
        type: 'generated-index',
        title: 'Migration Guides',
        description: 'Guides for upgrading to a major version of react-jsonschema-form.',
        slug: '/migration-guides',
      },
      items: [
        'migration-guides/v5.x upgrade guide',
        'migration-guides/v4.x upgrade guide',
        'migration-guides/v3.x upgrade guide',
        'migration-guides/v2.x upgrade guide',
      ],
    },
  ],
};

module.exports = sidebars;
