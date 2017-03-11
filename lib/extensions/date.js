const _ = require('lodash')
const assert = require('../assert')

const twoDaysInMiliseconds = 1000 * 60 * 60 * 48
module.exports = function (construct) {
  return {
    types: ['date'],
    formats: {date: ['unix']},
    builders: {
      date() {
        return construct({type: 'date'})
      },
      unixtimestamp() {
        return construct({type: 'date', format: 'unix'})
      },
    },
    transformations: {
      date: {
        unix(value) {
          const asNumber = parseInt(value, 10)
          if (!_.isNaN(asNumber)) {
            value = asNumber
          }

          if (typeof value === 'number') {
            return new Date(value * 1000)
          } else {
            return value
          }
        },
        __default(value) {
          if (typeof value === 'string' || typeof value === 'number') {
            const date = new Date(value)
            const dateWithTz = new Date(value + ' 00:00:00 GMT')

            if (_.isNaN(date.getTime())) {
              return value
            } else if (_.isNaN(dateWithTz.getTime()) ||
                Math.abs(dateWithTz.getTime() - date.getTime()) > twoDaysInMiliseconds) {
              return date
            } else {
              return dateWithTz
            }
          } else {
            return value
          }
        },
      },
    },
    validations: {
      date: {
        __default(value) {
          assert.typeof(value, 'date')
          assert.ok(!_.isNaN(value.getTime()), 'invalid date')
        },
      },
    },
  }
}
