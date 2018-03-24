const _ = require('lodash')
const utils = require('../utils')

describe('initialize database', () => {
  const state = utils.state()

  utils.steps.cleanAndSync(state)

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
    it('should have created a users table', async () => {
      const [results] = await state.sequelize.query('describe users')
      expect(toTable(results)).toEqual({
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

    it('should have created the additional indexes', () => {
      return state.sequelize.query('show index from users').then(([results]) => {
        const indexes = _.filter(results, {Key_name: 'users_email_password'})
        expect(indexes).toHaveLength(2)
      })
    })
  })

  describe('photos', () => {
    it('should have created a photos table', () => {
      return state.sequelize.query('describe photos').then(([results]) => {
        expect(toTable(results)).toEqual({
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
