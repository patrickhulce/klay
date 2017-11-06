# klay
[![NPM Package](https://badge.fury.io/js/klay.svg)](https://www.npmjs.com/package/klay)
[![Build Status](https://travis-ci.org/patrickhulce/klay.svg?branch=master)](https://travis-ci.org/patrickhulce/klay)
[![Coverage Status](https://coveralls.io/repos/github/patrickhulce/klay/badge.svg?branch=master)](https://coveralls.io/github/patrickhulce/klay?branch=master)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![Dependencies](https://david-dm.org/patrickhulce/klay.svg)](https://david-dm.org/patrickhulce/klay)

Isomorphic and extensible validation library for JavaScript.

## Usage

### Install

`npm install --save klay`

### Validate

```js
const klay = require('klay')

const builders = klay().builders
const myModel = builders.object({
    firstName: builders.string().required(),
    lastName: builders.string().required(),
    email: builders.email().required(),
    age: builders.integer(),
  }).strict()

const results = myModel.validate({
  firstName: 'John',
  lastName: 42,
  email: 'invalid.com',
  age: 'eleven',
})

console.log(results)

// ValidationResult {
//   value:
//    { firstName: 'John',
//      lastName: 42,
//      email: 'invalid.com',
//      age: 'eleven' },
//   conforms: false,
//   errors:
//    [ { path: 'lastName',
//        message: 'expected 42 to have typeof string' },
//      { path: 'email',
//        message: 'value should match /^\\S+@([0-9a-z-]+\\.?)+(\\.)?[0-9a-z-]+$/' },
//      { path: 'age', message: 'value must be an integer' } ] }
```
