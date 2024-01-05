[![Build Status][build-shield]][build-url]
[![npm][npm-shield]][npm-url]
[![npm downloads][npm-dl-shield]][npm-dl-url]
[![Contributors][contributors-shield]][contributors-url]
[![Apache 2.0 License][license-shield]][license-url]

<!-- PROJECT LOGO -->
<br />
<p align="center">
  <a href="https://github.com/rjsf-team/react-jsonschema-form">
    <img src="https://raw.githubusercontent.com/rjsf-team/react-jsonschema-form/7ebc86621d8df8c21f0c39bcca6d476f6f7a2051/packages/mui/logo.png" alt="Logo" width="120" height="120">
  </a>

  <h3 align="center">@rjsf/mui-joy</h3>

  <p align="center">
  Mui Joy theme, fields and widgets for <a href="https://github.com/rjsf-team/react-jsonschema-form/"><code>react-jsonschema-form</code></a>.
    <br />
    <a href="https://rjsf-team.github.io/react-jsonschema-form/docs/"><strong>Explore the docs »</strong></a>
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

- [Table of Contents](#table-of-contents)
- [About The Project](#about-the-project)
  - [Built With](#built-with)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
  - [Mui Joy](#mui-joy)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Contact](#contact)

<!-- ABOUT THE PROJECT -->

## About The Project

[![@rjsf/mui Screen Shot][product-screenshot]](https://rjsf-team.github.io/@rjsf/mui-joy)

Exports `mui-joy` themes, fields and widgets for `react-jsonschema-form`.

### Built With

- [react-jsonschema-form](https://github.com/rjsf-team/react-jsonschema-form/)
- [Mui Joy](https://mui.com/joy-ui/getting-started/)
- [TypeScript](https://www.typescriptlang.org/)

<!-- GETTING STARTED -->

## Getting Started

### Prerequisites

NOTE: Mui Joy requires React 17, so you will need to upgrade

- `@mui/joy`
- `@mui/icons-material`
- `@emotion/react`
- `@emotion/styled`
- `@rjsf/core >= 5.0.0`
- `@rjsf/utils >= 5.0.0`
- `@rjsf/validator-ajv6 >= 5.0.0`

With NPM

```bash
npm install @mui/joy @mui/icons-material @emotion/react @emotion/styled @rjsf/core @rjsf/utils @rjsf/validator-ajv6
```

With Yarn

```bash
yarn add @mui/joy @mui/icons-material @emotion/react @emotion/styled @rjsf/core @rjsf/utils @rjsf/validator-ajv6
```

### Installation

With Yarn

```bash
yarn add @rjsf/mui-joy
```

With NPM

```bash
npm add @rjsf/mui-joy
```

<!-- USAGE EXAMPLES -->

## Usage

### Mui Joy

```js
import Form from '@rjsf/mui-joy';
```

or

```js
import { withTheme } from '@rjsf/core';
import Theme from '@rjsf/mui-joy';

// Make modifications to the theme with your own fields and widgets

const Form = withTheme(Theme);
```

<!-- ROADMAP -->

## Roadmap

See the [open issues](https://github.com/rjsf-team/react-jsonschema-form/issues) for a list of proposed features (and known issues).

<!-- CONTRIBUTING -->

## Contributing

Read our [contributors' guide](https://rjsf-team.github.io/react-jsonschema-form/docs/contributing/) to get started.

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
[npm-shield]: https://img.shields.io/npm/v/@rjsf/mui/latest.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/@rjsf/mui
[npm-dl-shield]: https://img.shields.io/npm/dm/@rjsf/mui.svg?style=flat-square
[npm-dl-url]: https://www.npmjs.com/package/@rjsf/mui
[product-screenshot]: https://raw.githubusercontent.com/rjsf-team/react-jsonschema-form/e2e1181d1020f18cad0c80c661ddae28edb9794e/packages/mui/screenshot.png
