const _ = require('lodash')
const steps = require('./steps')

describesql('initialize database', () => {
  const shared = steps.init()

  function toTable(results) {
    return _(results)
      .map(item => {
        const firstPass = _.pick(item, ['Type', 'Key', 'Extra'])
        return {
          name: item.Field,
          value: _.pickBy(firstPass, v => Boolean(v)),
        }
      })
      .keyBy('name')
      .mapValues('value')
      .value()
  }

  describe('users', () => {
    it('should have created a users table', () => {
      return shared.sequelize.query('describe users').spread(results => {
        toTable(results).should.eql({
          id: {Type: 'bigint(20)', Key: 'PRI', Extra: 'auto_increment'},
          age: {Type: 'bigint(20)'},
          isAdmin: {Type: 'tinyint(1)'},
          email: {Type: 'varchar(250)', Key: 'UNI'},
          firstName: {Type: 'varchar(100)', Key: 'MUL'},
          lastName: {Type: 'varchar(100)'},
          password: {Type: 'varchar(32)'},
          createdAt: {Type: 'datetime(6)'},
          updatedAt: {Type: 'datetime(6)'},
        })
      })
    })

    it('should have created the additional indexes', () => {
      return shared.sequelize.query('show index from users').spread(results => {
        _.filter(results, {Key_name: 'email_password'}).should.have.length(2)
      })
    })
  })

  describe('photos', () => {
    it('should have created a photos table', () => {
      return shared.sequelize.query('describe photos').spread(results => {
        toTable(results).should.eql({
          id: {Type: 'char(36)', Key: 'PRI'},
          ownerId: {Type: 'bigint(20)', Key: 'MUL'},
          aspectRatio: {Type: 'double'},
          metadata: {Type: 'text'},
          createdAt: {Type: 'datetime(6)'},
          updatedAt: {Type: 'datetime(6)'},
        })
      })
    })
  })
})
