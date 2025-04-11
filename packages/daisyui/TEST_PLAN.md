# DaisyUI Test Plan

## Overview

This document outlines the test strategy for the DaisyUI theme for react-jsonschema-form. The testing approach follows existing patterns in the RJSF ecosystem while adding specific tests for DaisyUI components.

## Test Setup

The test environment includes:

- Jest for test runner
- React Testing Library for component testing
- jest-environment-jsdom for browser API simulation
- @rjsf/snapshot-tests for core component testing

## Test Structure

### 1. Core Snapshot Tests

These tests use the shared RJSF snapshot testing infrastructure:

- `Form.test.tsx` - Tests the overall form rendering
- `Array.test.tsx` - Tests array field rendering
- `Object.test.tsx` - Tests object field rendering

### 2. DaisyUI-Specific Component Tests

Unit tests for DaisyUI-specific components:

- `DaisyUIFrameProvider.test.tsx` - Tests iframe theme injection
- `ToggleWidget.test.tsx` - Tests the DaisyUI toggle component
- `RatingWidget.test.tsx` - Tests the DaisyUI rating component
- `ArrayFieldItemTemplate.test.tsx` - Tests card-based UI for array items

### 3. Helper Functions

Test helpers located in `test/helpers`:

- `createMocks.ts` - Creates mock props for testing form components

## Running Tests

Tests can be run using the following npm scripts:

```bash
# Run all tests
npm test

# Update snapshots
npm run test:update

# Watch mode for development
npm run test:watch
```

## Test Coverage Areas

1. **Functional Testing**

   - Proper rendering of form components
   - Widget interaction (e.g., toggling switches, setting ratings)
   - Form validation
   - Data binding

2. **UI Testing**

   - Proper application of DaisyUI classes
   - Responsive layout
   - Theme application

3. **Accessibility Testing**

   - Keyboard navigation
   - ARIA attributes
   - Focus management

4. **Theme Management**
   - Theme switching
   - Theme persistence in localStorage

## CI Integration

Tests are executed as part of the CI/CD pipeline to ensure code quality before merging to main.

## Future Enhancements

1. Integration tests for complete form scenarios
2. Accessibility automated testing
3. Enhanced visual regression testing
