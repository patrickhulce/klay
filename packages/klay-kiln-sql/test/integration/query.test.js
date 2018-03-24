const utils = require('../utils')

describe('query objects', () => {
  const state = utils.state()
  let userModel, photoModel

  beforeEach(() => {
    userModel = state.models && state.models.user
    photoModel = state.models && state.models.photo
  })

  utils.steps.cleanAndSync(state)
  utils.steps.insertFixtureData(state)

  describe('find', () => {
    it('should find users based on filters', () => {
      return userModel
        .find({
          order: [{property: ['age'], direction: 'desc'}],
          where: {age: {$gte: 21}, isAdmin: false},
        })
        .then(items => {
          expect(items).toHaveLength(3)
          expect(items[0]).toHaveProperty('email', 'jack.doe@example.com')
          expect(items[1]).toHaveProperty('email', 'smith@example.com')
          expect(items[2]).toHaveProperty('email', 'jill.doe@example.com')
        });
    })

    it('should find users based on more filters', () => {
      return userModel
        .find({
          limit: 2,
          offset: 1,
          order: [{property: ['age'], direction: 'asc'}],
          where: {lastName: {$ne: 'Smith'}},
        })
        .then(items => {
          expect(items).toHaveLength(2)
          expect(items[0]).toHaveProperty('email', 'jill.doe@example.com')
          expect(items[1]).toHaveProperty('email', 'jack.doe@example.com')
        });
    })

    it('should find photos', () => {
      return photoModel
        .find({order: [{property: ['aspectRatio'], direction: 'asc'}]})
        .then(items => {
          expect(items).toHaveLength(7)
          expect(items[0])
            .toHaveProperty('metadata', {type: 'psd', width: 200, height: 300})
        });
    })
  })

  describe('findOne', () => {
    it('should find a single user', () => {
      return userModel.findOne({where: {email: 'smith@example.com'}}).then(item => {
        expect(item).toHaveProperty('lastName', 'Smith')
        expect(item).toHaveProperty('email', 'smith@example.com')
      });
    })
  })

  describe('findById', () => {
    it('should find a single user by id', () => {
      return userModel.findOne({where: {email: 'smith@example.com'}}).then(itemA => {
        return userModel.findById(itemA.id).then(itemB => {
          expect(itemA).toEqual(itemB)
        });
      });
    })

    it('should find a single photo by id', () => {
      return photoModel.findOne({where: {aspectRatio: 0.66}}).then(itemA => {
        return photoModel.findById(itemA.id).then(itemB => {
          expect(itemA).toEqual(itemB)
        });
      });
    })
  })

  describe('count', () => {
    it('should count number of photos', async () => {
      expect(await photoModel.count({where: {aspectRatio: {$gt: 1}}})).toEqual(4);
    })
  })

  describe.skip('queryBuilder', () => {
    it('should filter', async () => {
      const result = await userModel
        .queryBuilder()
        .where('firstName', 'Jill')
        .fetchResult()
      expect(result).toHaveProperty('email', 'jill.doe@example.com')
    })

    it('should sort', async () => {
      const result = await userModel
        .queryBuilder()
        .orderBy([['email', 'desc']])
        .fetchResult()
      expect(result).toHaveProperty('email', 'smith@example.com')
    })

    it('should limit the number of records returned', async () => {
      const results = await userModel
        .queryBuilder()
        .limit(3)
        .fetchResults()
      expect(results).toHaveLength(3)
    })

    it('should skip the requested number of records', async () => {
      const result = await userModel
        .queryBuilder()
        .offset(3)
        .fetchResults()
      expect(result).toHaveLength(3)
    })

    it('should limit the fields returned', async () => {
      const result = await userModel
        .queryBuilder()
        .where('email', 'john.doe@example.com')
        .fields(['firstName', 'lastName'])
        .fetchResult()
      expect(result).toEqual({firstName: 'John', lastName: 'Doe'})
    })

    it('should fetch the count', async () => {
      const result = await userModel
        .queryBuilder()
        .where('firstName', 'John')
        .where('lastName', 'Doe')
        .where('isAdmin', true)
        .fields(['firstName', 'lastName'])
        .fetchCount()
      expect(result).toEqual(1)
    })
  })
})
