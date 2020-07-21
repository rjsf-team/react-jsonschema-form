<!-- PROJECT LOGO -->
<br />
<p align="center">
  <a href="https://github.com/cybertec-postgresql/rjsf-material-ui">
    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Bootstrap_logo.svg/800px-Bootstrap_logo.svg.png" alt="Logo" width="140" height="120">
  </a>

  <h3 align="center">@rjsf/bootstrap-4</h3>

  <p align="center">
  Bootstrap-4 theme, fields and widgets for <a href="https://github.com/mozilla-services/react-jsonschema-form/"><code>react-jsonschema-form</code></a>.
    <br />
    <a href="https://react-jsonschema-form.readthedocs.io/en/latest/"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="#">View Playground</a>
    ·
    <a href="#">Report Bug</a>
    ·
    <a href="#">Request Feature</a>
  </p>
</p>

<!-- ABOUT THE PROJECT -->

## About The Project


Exports `bootstrap-4` theme, fields and widgets for `react-jsonschema-form`.

### Built With

- [react-jsonschema-form](https://github.com/mozilla-services/react-jsonschema-form/)
- [Bootstrap-4](https://getbootstrap.com/docs/4.0/)
- [Typescript](https://www.typescriptlang.org/)

<!-- GETTING STARTED -->

## Getting Started

### Prerequisites

- `react-bootstrap >= 1.0.1`
- `@rjsf/core >= 2.2.0`

```bash
yarn add react-bootstrap @rjsf/core
```

### Installation

```bash
yarn add @rjsf/bootstrap-4
```

## Usage

```js
import Form from '@rjsf/bootstrap-4';
```

or

```js
import { withTheme } from '@rjsf/core';
import { Theme as Bootstrap4Theme } from '@rjsf/bootstrap-4';

const Form = withTheme(Bootstrap4Theme);
```

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[build-shield]: https://img.shields.io/circleci/build/github/cybertec-postgresql/rjsf-material-ui.svg?style=flat-square&token=a58b0890f96bff2b53eef0f4d9c9e5d16eec2200
[build-url]: https://circleci.com/gh/cybertec-postgresql/rjsf-material-ui
[contributors-shield]: https://img.shields.io/badge/contributors-1-orange.svg?style=flat-square
[contributors-url]: https://github.com/cybertec-postgresql/rjsf-material-ui/graphs/contributors
[license-shield]: https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square
[license-url]: https://choosealicense.com/licenses/mit
[npm-shield]: https://img.shields.io/npm/v/rjsf-material-ui/latest.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/rjsf-material-ui
[npm-dl-shield]: https://img.shields.io/npm/dm/rjsf-material-ui.svg?style=flat-square
[npm-dl-url]: https://www.npmjs.com/package/rjsf-material-ui
[product-screenshot]: https://raw.githubusercontent.com/cybertec-postgresql/rjsf-material-ui/master/screenshot.png
