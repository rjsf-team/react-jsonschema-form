[![Build Status][build-shield]][build-url]
[![npm][npm-shield]][npm-url]
[![npm downloads][npm-dl-shield]][npm-dl-url]
[![Contributors][contributors-shield]][contributors-url]
[![Apache 2.0 License][license-shield]][license-url]

<br />
<p align="center">
  <a href="https://github.com/rjsf-team/react-jsonschema-form">
    <img src="logo.png" alt="Logo" width="120" height="120">
  </a>

<h3 align="center">@rjsf/primereact</h3>

  <p align="center">
  PrimeReact theme, fields, and widgets for <a href="https://github.com/rjsf-team/react-jsonschema-form/"><code>react-jsonschema-form</code></a>.
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

## Table of Contents

- [About The Project](#about-the-project)
  - [Built With](#built-with)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Contact](#contact)

## About The Project

PrimeReact theme, fields, and widgets for `react-jsonschema-form`.

### Built With

- [react-jsonschema-form](https://github.com/rjsf-team/react-jsonschema-form/)
- [PrimeReact](https://github.com/primefaces/primereact)

## Getting Started

### Prerequisites

- `primereact >= 8.0.0`
- `primeicons >= 6.0.0`
- `@rjsf/core >= 6`
- `@rjsf/utils >= 6`
- `@rjsf/validator-ajv8 >= 6`

```sh
npm install primereact primeicons @rjsf/core
```

### Installation

```sh
npm install @rjsf/primereact
```

## Usage

```javascript
import Form from '@rjsf/primereact';
```

or

```javascript
import { withTheme } from '@rjsf/core';
import { Theme as PrimeReactTheme } from '@rjsf/primereact';

// Customize the theme with your own fields and widgets

const Form = withTheme(PrimeReactTheme);
```

## Roadmap

See the general [open issues](https://github.com/rjsf-team/react-jsonschema-form/issues).

## Contributing

Read our [contributors' guide](https://rjsf-team.github.io/react-jsonschema-form/docs/contributing/) to get started.

## Contact

rjsf team: [https://github.com/orgs/rjsf-team/people](https://github.com/orgs/rjsf-team/people)

GitHub
repository: [https://github.com/rjsf-team/react-jsonschema-form](https://github.com/rjsf-team/react-jsonschema-form)

[build-shield]: https://github.com/rjsf-team/react-jsonschema-form/workflows/CI/badge.svg

[build-url]: https://github.com/rjsf-team/react-jsonschema-form/actions

[contributors-shield]: https://img.shields.io/github/contributors/rjsf-team/react-jsonschema-form.svg

[contributors-url]: https://github.com/rjsf-team/react-jsonschema-form/graphs/contributors

[license-shield]: https://img.shields.io/badge/license-Apache%202.0-blue.svg?style=flat-square

[license-url]: https://choosealicense.com/licenses/apache-2.0/

[npm-shield]: https://img.shields.io/npm/v/@rjsf/primereact/latest.svg?style=flat-square

[npm-url]: https://www.npmjs.com/package/@rjsf/primereact

[npm-dl-shield]: https://img.shields.io/npm/dm/@rjsf/primereact.svg?style=flat-square

[npm-dl-url]: https://www.npmjs.com/package/@rjsf/primereact
