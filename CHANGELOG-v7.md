<!--

INSTRUCTIONS:

For each PR, add a changelog entry that describes what your PR does. Add it to the heading
for the appropriate package it modifies and include it in this format:
- [Description] ([Link to PR])

If your PR affects multiple packages, list it multiple times under headings for each package.
If it affects more general things such as dependency updates or non-package-specific changes,
add it under a "Dev / docs / playground" section.

You should also update the heading of the latest (upcoming) version if your PR change merits
it according to semantic versioning. For example, if your PR adds a breaking change, then you
should change the heading of the (upcoming) version to include a major version bump.

-->

# 7.0.0

## Dev / docs / playground

- **BREAKING CHANGE** Dropped support for Node 20, 23, 25, and 24 releases before 24.11.0; `engines.node` is now `^22.18.0 || ^24.11.0 || >=26.0.0` across all packages, matching the active Node.js LTS lines, and CI now runs against Node 22, 24, and 26
