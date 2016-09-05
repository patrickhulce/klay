var _ = require('lodash');
var assert = require('../assert');

var twoDaysInMiliseconds = 1000 * 60 * 60 * 48;
module.exports = function (construct) {
  return {
    types: ['date'],
    formats: {date: ['unix']},
    builders: {
      date: function () {
        return construct({type: 'date'});
      },
      unixtimestamp: function () {
        return construct({type: 'date', format: 'unix'});
      },
    },
    transformations: {
      date: {
        unix: function (value) {
          var asNumber = parseInt(value, 10);
          if (!_.isNaN(asNumber)) {
            value = asNumber;
          }

          if (typeof value === 'number') {
            return new Date(value * 1000);
          } else {
            return value;
          }
        },
        __default: function (value) {
          if (typeof value === 'string' || typeof value === 'number') {
            var date = new Date(value);
            var dateWithTz = new Date(value + ' 00:00:00 GMT');

            if (_.isNaN(date.getTime())) {
              return value;
            } else if (_.isNaN(dateWithTz.getTime()) ||
                Math.abs(dateWithTz.getTime() - date.getTime()) > twoDaysInMiliseconds) {
              return date;
            } else {
              return dateWithTz;
            }
          } else {
            return value;
          }
        }
      },
    },
    validations: {
      date: {
        __default: function (value) {
          assert.typeof(value, 'date');
          assert.ok(!_.isNaN(value.getTime()), 'invalid date');
        }
      },
    }
  };
};
