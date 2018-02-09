# klay
[![NPM Package](https://badge.fury.io/js/klay.svg)](https://www.npmjs.com/package/klay)
[![Build Status](https://travis-ci.org/patrickhulce/klay.svg?branch=master)](https://travis-ci.org/patrickhulce/klay)
[![Coverage Status](https://coveralls.io/repos/github/patrickhulce/klay/badge.svg?branch=master)](https://coveralls.io/github/patrickhulce/klay?branch=master)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![Dependencies](https://david-dm.org/patrickhulce/klay.svg)](https://david-dm.org/patrickhulce/klay)

Isomorphic and extensible validation library for JavaScript.

## [API Documentation](https://patrickhulce.github.io/klay/)

## Usage

### Install

`npm install --save klay`

### Validate

```js
const klay = require('klay').defaultModelContext

const myModel = klay
  .object()
  .children({
    firstName: klay.string().required(),
    lastName: klay.string().required(),
    email: klay.email().required(),
    age: klay.integer(),
  })
  .strict()

const results = myModel.validate({
  firstName: 'John',
  lastName: 42,
  email: 'invalid.com',
  age: 'eleven',
})

console.log(results.toJSON())
```

```js
{ value:
   { firstName: 'John',
     lastName: '42',
     email: 'invalid.com',
     age: 'eleven' },
  conforms: false,
  errors:
   [ { message: 'expected value (invalid.com) to be email',
       path: ['email'] },
     { message: 'expected value (eleven) to have typeof number',
       path: ['age'] } ] }
```
