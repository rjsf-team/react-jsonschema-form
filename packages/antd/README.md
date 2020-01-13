[![npm][npm-shield]][npm-url]
[![npm downloads][npm-dl-shield]][npm-dl-url]

<br />
<p align="center">
  <h3 align="center">@rjsf/antd</h3>

  <p align="center">
    Ant Design theme, fields and widgets for <a href="https://github.com/rjsf-team/react-jsonschema-form"><code>react-jsonschema-form</code></a>.
    <br />
    <a href="https://react-jsonschema-form.readthedocs.io/"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://rjsf-team.github.io/react-jsonschema-form/">View Playground (TBD)</a>
    ·
    <a href="https://github.com/rjsf-team/react-jsonschema-form/issues">Report Bug</a>
    ·
    <a href="https://github.com/rjsf-team/react-jsonschema-form/issues">Request Feature</a>
  </p>
</p>

## Table of Contents

- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

## Getting Started

### Prerequisites

- `antd == 3` (not tested yet with version 4)
- `react-jsonschema-form >= 2.0.0-alpha.1`

```sh
npm install antd react-jsonschema-form
```

### Installation

```sh
npm install @rjsf/antd
```

## Usage

```javascript
import Form from '@rjsf/antd';
```

or

```javascript
import { withTheme } from 'react-jsonschema-form';
import { Theme } from '@rjsf/antd';

// Make modifications to the Theme with your own fields and widgets

const Form = withTheme(Theme);
```

## Roadmap

See the general [open issues](https://github.com/rjsf-team/react-jsonschema-form/issues).

## Contributing

Read the general [contributors' guide](https://react-jsonschema-form.readthedocs.io/en/latest/#contributing) to get started.

## License

MIT

<!-- MARKDOWN LINKS & IMAGES -->

[npm-shield]: https://img.shields.io/npm/v/react-jsonschema-form/latest.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/react-jsonschema-form
[npm-dl-shield]: https://img.shields.io/npm/dm/react-jsonschema-form.svg?style=flat-square
[npm-dl-url]: https://www.npmjs.com/package/react-jsonschema-form
