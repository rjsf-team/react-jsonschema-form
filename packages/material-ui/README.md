[![Build Status][build-shield]][build-url]
[![npm][npm-shield]][npm-url]
[![npm downloads][npm-dl-shield]][npm-dl-url]
[![Contributors][contributors-shield]][contributors-url]
[![Apache 2.0 License][license-shield]][license-url]

<!-- PROJECT LOGO -->
<br />
<p align="center">
  <a href="https://github.com/rjsf-team/react-jsonschema-form">
    <img src="https://raw.githubusercontent.com/rjsf-team/react-jsonschema-form/59a8206e148474bea854bbb004f624143fbcbac8/packages/material-ui/logo.png" alt="Logo" width="120" height="120">
  </a>

  <h3 align="center">@rjsf/material-ui</h3>

  <p align="center">
  Material UI 4 and 5 themes, fields and widgets for <a href="https://github.com/rjsf-team/react-jsonschema-form/"><code>react-jsonschema-form</code></a>.
    <br />
    <a href="https://react-jsonschema-form.readthedocs.io/en/latest/"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://rjsf-team.github.io/react-jsonschema-form/">View Playground</a>
    ·
    <a href="https://github.com/rjsf-team/react-jsonschema-form/issues">Report Bug</a>
    ·
    <a href="https://github.com/rjsf-team/react-jsonschema-form/issues">Request Feature</a>
  </p>
</p>

<!-- TABLE OF CONTENTS -->

## Table of Contents

- [About The Project](#about-the-project)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Contact](#contact)

<!-- ABOUT THE PROJECT -->

## About The Project

[![@rjsf/material-ui Screen Shot][product-screenshot]](https://rjsf-team.github.io/@rjsf/material-ui)

Exports `material-ui` version 4 and 5 themes, fields and widgets for `react-jsonschema-form`.

### Built With

- [react-jsonschema-form](https://github.com/rjsf-team/react-jsonschema-form/)
- [Material UI](https://material-ui.com/)
- [Mui](https://mui.com/)
- [TypeScript](https://www.typescriptlang.org/)

<!-- GETTING STARTED -->

## Getting Started

### Prerequisites

#### Material UI version 4

- `@material-ui/core >= 4.12.0` (in 4.12.0, the library developers made it forward compatible with Material-UI V5)
- `@material-ui/icons >= 4.11.0` (in 4.11.0, the library developers made it forward compatible with Material-UI V5)
- `@rjsf/core >= 4.0.0`

```bash
yarn add @material-ui/core @material-ui/icons @rjsf/core
```

#### Material UI version 5

NOTE: Material UI 5 requires React 17, so you will need to upgrade

- `@mui/material`
- `@mui/icons-material`
- `@emotion/react`
- `@emotion/styled`
- `@rjsf/core >= 4.0.0`

```bash
yarn add @mui/material @mui/icons-material @emotion/react @emotion/styled @rjsf/core
```

### Installation

```bash
yarn add @rjsf/material-ui
```

<!-- USAGE EXAMPLES -->

## Usage

### Material UI version 4

```js
import Form from '@rjsf/material-ui/v4';
```

or

```js
import { withTheme } from '@rjsf/core';
import Theme from '@rjsf/material-ui/v4';

// Make modifications to the theme with your own fields and widgets

const Form = withTheme(Theme);
```

### Typescript configuration adjustments

If you are using Typescript you may have to update your `tsconfig.json` file in to avoid problems with import aliasing.

If you are experiencing an error that is similar to `TS2307: Cannot find module '@rjsf/material-ui/v4' or its corresponding type declarations.` you can add the following:

```
{
  ...
  "compilerOptions": {
    ...
    "baseUrl": ".",
    "paths": {
      "@rjsf/material-ui/*": ["node_modules/@rjsf/material-ui/dist/*"]
    }
  }
}
```

### Jest configuration adjustments

If you are using Jest you may have to update your `jest.config.json` file in to avoid problems with import aliasing.

If you are experiencing an error that is similar to `Cannot find module '@rjsf/material-ui/v4' from '<file path>'` you can add the following:

```
{
  "moduleNameMapper": {
    "@rjsf/material-ui/v4": "<rootDir>/node_modules/@rjsf/material-ui/dist/v4.js"
  },
}
```

### Material UI version 5

```js
import Form from '@rjsf/material-ui/v5';
```

or

```js
import { withTheme } from '@rjsf/core';
import Theme from '@rjsf/material-ui/v5';

// Make modifications to the theme with your own fields and widgets

const Form = withTheme(Theme);
```

### Typescript configuration adjustments

If you are using Typescript you may have to update your `tsconfig.json` file in to avoid problems with import aliasing.

If you are experiencing an error that is similar to `TS2307: Cannot find module '@rjsf/material-ui/v5' or its corresponding type declarations.` you can add the following:

```
{
  ...
  "compilerOptions": {
    ...
    "baseUrl": ".",
    "paths": {
      "@rjsf/material-ui/*": ["node_modules/@rjsf/material-ui/dist/*"]
    }
  }
}
```

### Jest configuration adjustments

If you are using Jest you may have to update your `jest.config.json` file in to avoid problems with import aliasing.

If you are experiencing an error that is similar to `Cannot find module '@rjsf/material-ui/v5' from '<file path>'` you can add the following:

```
{
  "moduleNameMapper": {
    "@rjsf/material-ui/v5": "<rootDir>/node_modules/@rjsf/material-ui/dist/v5.js"
  },
}
```

<!-- ROADMAP -->

## Roadmap

See the [open issues](https://github.com/rjsf-team/react-jsonschema-form/issues) for a list of proposed features (and known issues).

<!-- CONTRIBUTING -->

## Contributing

Read our [contributors' guide](https://react-jsonschema-form.readthedocs.io/en/latest/contributing/) to get started.

<!-- CONTACT -->

## Contact

rjsf team: [https://github.com/orgs/rjsf-team/people](https://github.com/orgs/rjsf-team/people)

GitHub repository: [https://github.com/rjsf-team/react-jsonschema-form](https://github.com/rjsf-team/react-jsonschema-form)

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[build-shield]: https://github.com/rjsf-team/react-jsonschema-form/workflows/CI/badge.svg
[build-url]: https://github.com/rjsf-team/react-jsonschema-form/actions
[contributors-shield]: https://img.shields.io/github/contributors/rjsf-team/react-jsonschema-form.svg
[contributors-url]: https://github.com/rjsf-team/react-jsonschema-form/graphs/contributors
[license-shield]: https://img.shields.io/badge/license-Apache%202.0-blue.svg?style=flat-square
[license-url]: https://choosealicense.com/licenses/apache-2.0/
[npm-shield]: https://img.shields.io/npm/v/@rjsf/material-ui/latest.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/@rjsf/material-ui
[npm-dl-shield]: https://img.shields.io/npm/dm/@rjsf/material-ui.svg?style=flat-square
[npm-dl-url]: https://www.npmjs.com/package/@rjsf/material-ui
[product-screenshot]: https://raw.githubusercontent.com/rjsf-team/react-jsonschema-form/e2e1181d1020f18cad0c80c661ddae28edb9794e/packages/material-ui/screenshot5.png
