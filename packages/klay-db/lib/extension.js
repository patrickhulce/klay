const _ = require('lodash')
const Options = require('./Options')
const gatherDbOptions = require('./helpers/gatherDbOptions')

module.exports = function (extOptions) {
  extOptions = _.assign({
    footprint: 'large',
  }, extOptions)

  const delegateToOptions = function (name, prefix) {
    return function () {
      let options = new Options(this.spec.db || {})
      let args = _.slice(arguments)
      if (typeof prefix === 'string') {
        args = [prefix].concat(args)
      }

      options = options[name].apply(options, args)
      return this.db(options)
    }
  }

  const medium = {
    dbindex: delegateToOptions('index', '__childplaceholder__'),
    dbconstrain: delegateToOptions('constrain', '__childplaceholder__'),
    dbautomanage: delegateToOptions('automanage', '__childplaceholder__'),
    dbindexChildren: delegateToOptions('index'),
    dbconstrainChildren: delegateToOptions('constrain'),
    dbautomanageChildren: delegateToOptions('automanage'),
  }

  const large = {
    primaryKey(meta) {
      return this.dbconstrain('primary', meta)
    },
    unique(meta) {
      return this.dbconstrain('unique', meta)
    },
    immutable(meta) {
      return this.dbconstrain('immutable', meta)
    },
    autoincrement() {
      return this.dbautomanage('create', 'insert', 'autoincrement')
    },
  }

  const extras = {}
  if (extOptions.footprint === 'large') {
    _.assign(extras, medium, large)
  } else if (extOptions.footprint === 'medium') {
    _.assign(extras, medium)
  }

  return function (construct) {
    return {
      builders: {
        createdAt(type) {
          return construct({type: 'date'})
            .dbautomanage('create', type || 'date')
            .immutable()
            .required()
        },
        updatedAt(type) {
          return construct({type: 'date'})
            .dbautomanage('*', type || 'date')
            .required()
        },
        integerId() {
          return construct({type: 'number', format: 'integer'})
            .primaryKey().autoincrement()
        },
        uuidId() {
          return construct({type: 'string', format: 'uuid'})
            .dbautomanage('create', 'uuid')
            .primaryKey()
        },
      },
      hooks: {
        children() {
          if (this.spec.type !== 'object') {
            return
          }
          this.spec.db = gatherDbOptions(this.spec.db, this.spec.children).toObject()
        },
      },
      extend: _.assign({
        db(options) {
          options = new Options(options).toObject()
          return this._with({db: options})
        },
      }, extras),
    }
  }
}
