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

  <h3 align="center">@rjsf/carbon</h3>

  <p align="center">
  Carbon Design System theme, fields and widgets for <a href="https://github.com/rjsf-team/react-jsonschema-form/"><code>react-jsonschema-form</code></a>.
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

TODO

[![@rjsf/carbon Screen Shot][product-screenshot]](https://rjsf-team.github.io/@rjsf/carbon)

Exports `carbon` theme, fields and widgets for `react-jsonschema-form`.

### Built With

- [react-jsonschema-form](https://github.com/rjsf-team/react-jsonschema-form/)
- [Carbon Design System](https://carbondesignsystem.com/)
- [TypeScript](https://www.typescriptlang.org/)

<!-- GETTING STARTED -->

## Getting Started

### Prerequisites

- `@carbon/react >= 1.7.0`

Refer to the [rjsf installation guide](https://rjsf-team.github.io/react-jsonschema-form/docs/#installation) and [Carbon Design System installation guide](https://carbondesignsystem.com/developing/frameworks/react/#install) and for more details.

---

### Installation

```bash
yarn add @carbon/react
```

```bash
yarn add @rjsf/core
```

<!-- USAGE EXAMPLES -->

## Usage

```js
import Form from '@rjsf/carbon';
// load style from carbon
import '@carbon/styles/css/styles.min.css';
```

or

```js
import { withTheme } from '@rjsf/core';
import { Theme as CarbonTheme } from '@rjsf/carbon';
// load style from carbon
import '@carbon/styles/css/styles.min.css';

// Make modifications to the theme with your own fields and widgets

const Form = withTheme(CarbonTheme);
```

## Optional Carbon Theme properties

Available carbon options are:

```ts
interface CarbonOptions {
  /**Gap between each form item, default to `7` (2.5rem)
   * @see https://carbondesignsystem.com/guidelines/spacing/overview/#spacing-scale
   */
  gap: number;
  /** Size of form item.
   *
   * Note that some of the `@carbon/react` component doesn't support `xl` and will fallback to `lg`
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';
}
```

### Custom Carbon through `formContext`

```js
const formContext = {
  carbon: {
    // carbon options here
  },
};
```

### Custom Carbon uiSchema Property

`uiSchema` allows for the use of a `carbon` to customize the styling of the form widgets.

```json
{
  "ui:options": {
    "carbon": {
      // carbon options here
    }
  }
}
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
[npm-shield]: https://img.shields.io/npm/v/@rjsf/carbon/latest.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/@rjsf/carbon
[npm-dl-shield]: https://img.shields.io/npm/dm/@rjsf/carbon.svg?style=flat-square
[npm-dl-url]: https://www.npmjs.com/package/@rjsf/carbon
[product-screenshot]: ./screenshot.png
