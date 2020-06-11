<!-- PROJECT LOGO -->
<br />
<p align="center">
  <a href="https://github.com/cybertec-postgresql/rjsf-material-ui">
    <img src="https://raw.githubusercontent.com/cybertec-postgresql/rjsf-material-ui/master/rjsf-material-ui-logo.png" alt="Logo" width="140" height="120">
  </a>

  <h3 align="center">@rjsf/material-ui</h3>

  <p align="center">
  Material-UI theme, fields and widgets for <a href="https://github.com/mozilla-services/react-jsonschema-form/"><code>react-jsonschema-form</code></a>.
    <br />
    <a href="https://react-jsonschema-form.readthedocs.io/en/latest/"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://rjsf-team.github.io/rjsf-material-ui/">View Playground</a>
    ·
    <a href="https://github.com/rjsf-team/rjsf-material-ui/issues">Report Bug</a>
    ·
    <a href="https://github.com/rjsf-team/rjsf-material-ui/issues">Request Feature</a>
  </p>
</p>

<!-- ABOUT THE PROJECT -->

## About The Project

[![rjsf-material-ui Screen Shot][product-screenshot]](https://cybertec-postgresql.github.io/rjsf-material-ui)

Exports `material-ui` theme, fields and widgets for `react-jsonschema-form`.

### Built With

- [react-jsonschema-form](https://github.com/mozilla-services/react-jsonschema-form/)
- [Material-UI](https://material-ui.com/)
- [Typescript](https://www.typescriptlang.org/)

<!-- GETTING STARTED -->

## Getting Started

### Prerequisites

- `@material-ui/core >= 4.2.0` ([in 4.2.0, the `slider` component was added to the core](https://github.com/mui-org/material-ui/pull/16416))
- `@material-ui/icons`
- `@rjsf/core >= 2.0.0`

```bash
yarn add @material-ui/core @material-ui/icons @rjsf/core
```

### Installation

```bash
yarn add @rjsf/material-ui
```

## Usage

```js
import Form from '@rjsf/material-ui';
```

or

```js
import { withTheme } from '@rjsf/core';
import { Theme as MuiTheme } from '@rjsf/material-ui';

const Form = withTheme(MuiTheme);
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