[![Build Status][build-shield]][build-url]
[![npm][npm-shield]][npm-url]
[![npm downloads][npm-dl-shield]][npm-dl-url]
[![Contributors][contributors-shield]][contributors-url]
[![Apache 2.0 License][license-shield]][license-url]

<br />
<p align="center">
  <a href="https://github.com/rjsf-team/react-jsonschema-form">
    <img src="https://raw.githubusercontent.com/rjsf-team/react-jsonschema-form/59a8206e148474bea854bbb004f624143fbcbac8/packages/core/logo.png" alt="Logo" width="180" height="120">
  </a>

  <h3 align="center">@rjsf/snapshot-tests</h3>

  <p align="center">
  A set of snapshot tests to be used for testing RJSF themes.
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
- [Getting Started](#getting-started)
  - [Installation](#installation)
- [Usage](#usage)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Contact](#contact)

<!-- ABOUT THE PROJECT -->

## About The Project

Package with snapshot test suits for testing themes for `react-jsonschema-form`.

<!-- GETTING STARTED -->

## Getting Started

### Installation

```sh
npm install @rjsf/snapshot-tests
```

## Usage

```tsx
import { arrayTests } from '@rjsf/snapshot-tests'; // OR
// import { formTests } from '@rjsf/snapshot-tests';
// import { objectTests } from '@rjsf/snapshot-tests';

import Form from '../src';

arrayTests(Form); // OR
// formTests(Form);
// objectTests(Form);
```
<!-- ROADMAP -->

## Roadmap

See the general [open issues](https://github.com/rjsf-team/react-jsonschema-form/issues).

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
[npm-shield]: https://img.shields.io/npm/v/@rjsf/snapshot-tests/latest.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/@rjsf/snapshot-tests
[npm-dl-shield]: https://img.shields.io/npm/dm/@rjsf/snapshot-tests.svg?style=flat-square
[npm-dl-url]: https://www.npmjs.com/package/@rjsf/snapshot-tests
[product-screenshot]: https://raw.githubusercontent.com/rjsf-team/react-jsonschema-form/59a8206e148474bea854bbb004f624143fbcbac8/packages/snapshot-tests/screenshot.png
