[![Build Status][build-shield]][build-url]
[![npm][npm-shield]][npm-url]
[![npm downloads][npm-dl-shield]][npm-dl-url]
[![Contributors][contributors-shield]][contributors-url]
[![Apache 2.0 License][license-shield]][license-url]

<!-- PROJECT LOGO -->
<br />
<p align="center">
  <a href="https://github.com/rjsf-team/react-jsonschema-form">
    <img src="./logo.png" alt="Logo" width="340">
  </a>

  <h3 align="center">@rjsf/chakra-ui</h3>

  <p align="center">
  Chakra UI theme, fields and widgets for <a href="https://github.com/rjsf-team/react-jsonschema-form/"><code>react-jsonschema-form</code></a>.
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
- [Optional Chakra UI Theme properties](#optional-chakra-ui-theme-properties)
  - [Custom Chakra uiSchema Chakra Property](#custom-chakra-uischema-chakra-property)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Contact](#contact)

<!-- ABOUT THE PROJECT -->

## About The Project

[![@rjsf/chakra-ui Screen Shot][product-screenshot]](https://rjsf-team.github.io/@rjsf/chakra-ui)

Exports `chakra-ui` theme, fields and widgets for `react-jsonschema-form`.

### Built With

- [react-jsonschema-form](https://github.com/rjsf-team/react-jsonschema-form/)
- [Chakra UI](https://chakra-ui.com/)
- [TypeScript](https://www.typescriptlang.org/)

<!-- GETTING STARTED -->

## Getting Started

### Prerequisites

- `@chakra-ui/react >= 1.7.0`
- `chakra-react-select >= 3.3.8`
- `react >= 17.0.0`
- `framer-motion >= 5.0.0`
- `@rjsf/core >= 2.0.0`

Refer to the [rjsf installation guide](https://rjsf-team.github.io/react-jsonschema-form/docs/#installation) and [chakra-ui installation guide](https://chakra-ui.com/docs/getting-started#installation) and for more details.

---

### Installation

```bash
yarn add @chakra-ui/react@^1.7 @emotion/react@^11 @emotion/styled@^11 framer-motion@^5
```

```bash
yarn add @rjsf/chakra-ui @rjsf/core
```

<!-- USAGE EXAMPLES -->

## Usage

```js
import Form from '@rjsf/chakra-ui';
```

or

```js
import { withTheme } from '@rjsf/core';
import { Theme as ChakraUITheme } from '@rjsf/chakra-ui';

// Make modifications to the theme with your own fields and widgets

const Form = withTheme(ChakraUITheme);
```

## Optional Chakra UI Theme properties

- To pass additional properties to widgets, see this [guide](https://rjsf-team.github.io/react-jsonschema-form/docs/usage/objects#additional-properties).

You can use `ChakraProvider`, to customize the components at a theme level.\
And, `uiSchema` allows for the use of a `"chakra"` `"ui:option"` to customize the styling of the form widgets.

#### Custom Chakra uiSchema Chakra Property

```json
{
  "ui:options": {
    "chakra": {
      "p": "1rem",
      "color": "blue.200",
      "sx": {
        "margin": "0 auto"
      }
    }
  }
}
```

It accepts the theme accessible [style props](https://chakra-ui.com/docs/features/style-props) provided by [Chakra](https://chakra-ui.com/docs/getting-started) and [Emotion](https://emotion.sh/docs/introduction).

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
[npm-shield]: https://img.shields.io/npm/v/@rjsf/chakra-ui/latest.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/@rjsf/chakra-ui
[npm-dl-shield]: https://img.shields.io/npm/dm/@rjsf/chakra-ui.svg?style=flat-square
[npm-dl-url]: https://www.npmjs.com/package/@rjsf/chakra-ui
[product-screenshot]: ./screenshot.png
