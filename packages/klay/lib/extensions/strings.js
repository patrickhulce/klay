const _ = require('lodash')
const assert = require('../assert')

const ip = /(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?/i
const domain = /([0-9a-z-]+\.?)+(\.)?[0-9a-z-]+/i
const hostname = new RegExp(`(${domain.source}|${ip.source})`, 'i')
const REGEXES = {
  hex: /^[0-9a-f]*$/i,
  alphanumeric: /^\w*$/i,
  creditCard: /^\d{13,16}$/,
  uuid: /^[0-9a-f]{4}([0-9a-f]{4}-){4}[0-9a-f]{12}$/i,
  ip: new RegExp(`^${ip.source}$`),
  domain: new RegExp(`^${domain.source}$`, 'i'),
  email: [/^\S+@/, domain, /$/],
  hostname: new RegExp(`^${hostname.source}$`, 'i'),
  uri: [
    /^[a-z0-9+.-]+:(\/\/)?/, // scheme
    /(\S+@)?/, // userinfo
    hostname, // hostname
    /(:\d+)?/,
  ],
}

const compose = function (regexes) {
  return regexes.reduce((regexp, part) => {
    const first = regexp ? regexp.source : ''
    return new RegExp(first + part.source)
  }, false)
}

const validation = function (name) {
  const regex = _.isArray(REGEXES[name]) ?
    compose(REGEXES[name]) : REGEXES[name]
  const msg = `value should match ${regex}`

  return value => {
    const match = _.get(value, 'match', _.noop)
    assert.typeof(match, 'function')
    assert.ok(match.call(value, regex), msg)
  }
}

module.exports = function () {
  const extension = {
    builders: true,
    formats: {
      string: [
        'uuid', 'alphanumeric', 'hex',
        'ip', 'uri', 'domain', 'email',
        'creditCard',
      ],
    },
    transformations: {
      string: {
        creditCard(value) {
          if (typeof value === 'string') {
            return value.replace(/[-\s]+/g, '')
          } else {
            return value
          }
        },
      },
    },
  }

  extension.validations = {
    string: _.map(extension.formats.string, format => {
      return _.set({}, format, validation(format))
    }).reduce(_.merge, {}),
  }

  return extension
}
