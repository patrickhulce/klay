const _ = require('lodash')
const utils = require('../utils')

describe('initialize database', () => {
  const state = utils.state()

  utils.steps.cleanAndSync(state)

  describe('users', () => {
    it('should have created a users table', async () => {
      expect(await state.queryInterface.describeTable('users')).toMatchSnapshot()
    })

    it('should have created the additional indexes', () => {
      return state.sequelize.query('show index from users').then(([results]) => {
        const emailPasswordIndex = _.filter(results, {Key_name: 'users_email_asc__password_asc'})
        expect(emailPasswordIndex).toHaveLength(2)
        const nameIndex = _.filter(results, {Key_name: 'users_unique_firstname_lastname'})
        expect(nameIndex).toHaveLength(2)
      })
    })
  })

  describe('photos', () => {
    it('should have created a photos table', async () => {
      expect(await state.queryInterface.describeTable('photos')).toMatchSnapshot()
    })
  })
})
