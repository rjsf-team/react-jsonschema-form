[![Build Status][build-shield]][build-url]
[![npm][npm-shield]][npm-url]
[![npm downloads][npm-dl-shield]][npm-dl-url]
[![Contributors][contributors-shield]][contributors-url]
[![Apache 2.0 License][license-shield]][license-url]

<!-- PROJECT LOGO -->
<br />
<p align="center">
  <a href="https://github.com/rjsf-team/react-jsonschema-form">
    <img src="https://raw.githubusercontent.com/rjsf-team/react-jsonschema-form/59a8206e148474bea854bbb004f624143fbcbac8/packages/fluent-ui/logo.png" alt="Logo" width="120" height="120">
  </a>

  <h3 align="center">@rjsf/fluent-ui</h3>

  <p align="center">
  Fluent UI theme, fields and widgets for <a href="https://github.com/rjsf-team/react-jsonschema-form/"><code>react-jsonschema-form</code></a>.
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
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Contact](#contact)

<!-- ABOUT THE PROJECT -->

## About The Project

Fluent UI theme, fields and widgets for `react-jsonschema-form`.

### Built With

- [react-jsonschema-form](https://github.com/rjsf-team/react-jsonschema-form/)
- [Fluent UI](https://developer.microsoft.com/en-us/fluentui#/)
- [Typescript](https://www.typescriptlang.org/)

<!-- GETTING STARTED -->

## Getting Started

### Prerequisites

- `@fluentui/react >= 7.114.2`
- `@rjsf/core >= 2.0.0`

```bash
yarn add @fluentui/react @rjsf/core
```

For the Fluent UI grid to work, add the following CSS tag to the main HTML page:

```html
<link
  rel="stylesheet"
  href="//static2.sharepointonline.com/files/fabric/office-ui-fabric-core/11.0.0/css/fabric.min.css"
/>
```

### Installation

```bash
yarn add @rjsf/fluent-ui
```

<!-- USAGE EXAMPLES -->

## Usage

```js
import Form from '@rjsf/fluent-ui';
```

or

```js
import { withTheme } from '@rjsf/core';
import { Theme as FluentUITheme } from '@rjsf/fluent-ui';

// Make modifications to the theme with your own fields and widgets

const Form = withTheme(FluentUITheme);
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
[npm-shield]: https://img.shields.io/npm/v/@rjsf/fluent-ui/latest.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/@rjsf/fluent-ui
[npm-dl-shield]: https://img.shields.io/npm/dm/@rjsf/fluent-ui.svg?style=flat-square
[npm-dl-url]: https://www.npmjs.com/package/@rjsf/fluent-ui
[product-screenshot]: https://raw.githubusercontent.com/rjsf-team/react-jsonschema-form/59a8206e148474bea854bbb004f624143fbcbac8/packages/fluent-ui/screenshot.png
