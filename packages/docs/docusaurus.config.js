// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'react-jsonschema-form',
  tagline: 'Build forms in React using JSON Schema',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://rjsf-team.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/react-jsonschema-form/docs',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'rjsf-team', // Usually your GitHub org/user name.
  projectName: 'react-jsonschema-form', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/',
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/rjsf-team/react-jsonschema-form/tree/main/packages/docs/',
        },
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      // image: 'img/docusaurus-social-card.jpg',
      navbar: {
        title: 'react-jsonschema-form documentation',
        // logo: {
        //   alt: 'RJSF Logo',
        //   src: 'img/logo.svg',
        // },
        items: [
          {
            type: 'doc',
            docId: 'quickstart',
            position: 'left',
            label: 'Quickstart Guide',
          },
          {
            type: 'doc',
            docId: '/api-reference',
            position: 'left',
            label: 'API Reference',
          },
          {
            type: 'doc',
            docId: '/advanced-customization',
            position: 'left',
            label: 'Advanced Customization',
          },
          {
            type: 'doc',
            docId: '/migration-guides',
            position: 'left',
            label: 'Upgrade Guide',
          },
          {
            href: 'https://rjsf-team.github.io/react-jsonschema-form',
            position: 'right',
            label: 'Playground',
          },
          {
            href: 'https://github.com/rjsf-team/react-jsonschema-form',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Quickstart',
                to: 'quickstart',
              },
              {
                to: '/api-reference',
                label: 'API Reference',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/rjsf-team/react-jsonschema-form',
              },
              {
                label: 'Discord',
                href: 'https://discord.gg/fdZm2JZJrX',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()}. Built with Docusaurus.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
      algolia: {
        // The application ID provided by Algolia
        appId: 'LRQC6J0BO6',
        // Public API key: it is safe to commit it
        apiKey: 'ab28c5ea429f2a16f7360d8a55a25f88',
        indexName: 'react-jsonschema-form',
        // Optional: Replace parts of the item URLs from Algolia. Useful when using the same search index for multiple deployments using a different baseUrl. You can use regexp or string in the `from` param. For example: localhost:3000 vs myCompany.com/docs
        replaceSearchResultPathname: {
          from: '/react-jsonschema-form/docs/',
          to: '/',
        },
        // We will need to tune `contextualSearch` and `searchParameters` to handle search for versioned docs
        // Optional: see doc section -- https://docusaurus.io/docs/search#contextual-search
        contextualSearch: true,
        // Optional: Algolia search parameters
        searchParameters: {},
        // Optional: path for search page that enabled by default (`false` to disable it)
        searchPagePath: 'search',
      },
    }),
};

module.exports = config;
