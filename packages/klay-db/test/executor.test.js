const _ = require('lodash')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

const ModelContext = require('klay').ModelContext
const DatabaseExtension = require('../lib/extension').DatabaseExtension
const Executor = require('../lib/executor').DatabaseExecutor

const expect = chai.expect
chai.use(chaiAsPromised)

describe('lib/executor.ts', () => {
  let model, executor, executorMinimal, executorData, transaction

  beforeEach(() => {
    const context = new ModelContext()
    context.use(new DatabaseExtension())

    model = context
      .object()
      .children({
        id: context.integerID(),
        x: context
          .integer()
          .constrain({type: 'unique'})
          .required(),
        y: context
          .integer()
          .constrain({type: 'immutable'})
          .automanage({event: 'create', supplyWith: v => v.setValue(1)}),
        z: context.integer().automanage({event: '*', supplyWith: v => v.setValue(2)}),
      })
      .constrain({
        type: 'custom',
        meta: {
          evaluate(data) {
            if (data.record.x > 100) {
              throw new Error('x is too big')
            }
          },
        },
      })

    executorMinimal = {
      transaction(f) {
        transaction = {}
        return f(transaction)
      },
      count(query) {
        return executorMinimal.find(query).length
      },
      find(query) {
        return _.filter(executorData, query.where)
      },
      findById(id) {
        return _.filter(executorData, {id})[0]
      },
      save(object) {
        if (!object.id) {
          object.id = executorData.length ? _.maxBy(executorData, 'id').id + 1 : 1
        }

        executorMinimal.destroyById(object.id)
        executorData.push(object)
        return object
      },
      destroyById(id) {
        executorData = executorData.filter(item => item.id !== id)
      },
    }

    executor = new Executor(model, executorMinimal)
    executorData = []
  })

  describe('.findOne', () => {
    it('should find exactly one record', async () => {
      executorData = [{id: 1, x: 1}, {id: 2, x: 2}]
      const result = await executor.findOne({where: {x: 1}})
      expect(result).to.eql({id: 1, x: 1})
    })

    it('should not find missing records', async () => {
      executorData = [{id: 1, x: 1}, {id: 2, x: 2}]
      const result = await executor.findOne({where: {x: 3}})
      expect(result).to.eql(undefined)
    })

    it('should throw on multiple records', async () => {
      executorData = [{id: 1, x: 1, y: 1}, {id: 2, x: 2, y: 1}]
      await expect(executor.findOne({where: {y: 1}})).to.be.rejectedWith(/single result/)
    })
  })

  describe('.create', () => {
    it('should create a value', async () => {
      const result = await executor.create({x: 2})
      const expected = {id: 1, x: 2, y: 1, z: 2}
      expect(result).to.eql(expected)
      expect(executorData).to.eql([expected])
    })

    it('should not create value with primary key', async () => {
      await expect(executor.create({id: 1, x: 1})).to.be.rejectedWith(/existing ID/)
      expect(executorData).to.eql([])
    })

    it('should not create value with validation errors', async () => {
      await expect(executor.create({})).to.be.rejectedWith(/be defined/)
      expect(executorData).to.eql([])
    })

    it('should not create value with uniqueness errors', async () => {
      executorData = [{id: 1, x: 1}]
      await expect(executor.create({x: 1})).to.be.rejectedWith(/violates unique/)
      expect(executorData).to.eql([{id: 1, x: 1}])
    })

    it('should not create value with custom errors', async () => {
      await expect(executor.create({x: 200})).to.be.rejectedWith(/x is too big/)
      expect(executorData).to.eql([])
    })
  })

  describe('.update', () => {
    it('should update a value', async () => {
      executorData = [{id: 1, x: 2, y: 1}]
      const result = await executor.update({id: 1, x: 3, y: 1})
      const expected = {id: 1, x: 3, y: 1, z: 2}
      expect(result).to.eql(expected)
      expect(executorData).to.eql([expected])
    })

    it('should not update non-existent value', async () => {
      await expect(executor.update({id: 1, x: 1})).to.be.rejectedWith(/cannot find/)
      expect(executorData).to.have.length(0)
    })

    it('should not update value with validation errors', async () => {
      executorData = [{id: 1, x: 2, y: 1}]
      await expect(executor.update({id: 1, y: 1})).to.be.rejectedWith(/be defined/)
      expect(executorData).to.eql([{id: 1, x: 2, y: 1}])
    })

    it('should not update value with immutable errors', async () => {
      executorData = [{id: 1, x: 1, y: 1}]
      await expect(executor.update({id: 1, x: 1, y: 2})).to.be.rejectedWith(/violates immutable/)
      expect(executorData).to.eql([{id: 1, x: 1, y: 1}])
    })

    it('should not update value with uniqueness errors', async () => {
      executorData = [{id: 1, x: 1}, {id: 2, x: 2}]
      await expect(executor.update({id: 2, x: 1})).to.be.rejectedWith(/violates unique/)
      expect(executorData).to.eql([{id: 1, x: 1}, {id: 2, x: 2}])
    })

    it('should not update value with custom errors', async () => {
      executorData = [{id: 1, x: 1}]
      await expect(executor.update({id: 1, x: 200})).to.be.rejectedWith(/x is too big/)
      expect(executorData).to.eql([{id: 1, x: 1}])
    })
  })

  describe('.upsert', () => {
    it('should create when non-matching', async () => {
      const result = await executor.upsert({x: 2})
      const expected = {id: 1, x: 2, y: 1, z: 2}
      expect(result).to.eql(expected)
      expect(executorData).to.eql([expected])
    })

    it('should update when has id', async () => {
      executorData = [{id: 1, x: 1, y: 1}]
      const result = await executor.upsert({id: 1, x: 3, y: 1})
      const expected = {id: 1, x: 3, y: 1, z: 2}
      expect(result).to.eql(expected)
      expect(executorData).to.eql([expected])
    })

    it('should update when matches unique', async () => {
      executorData = [{id: 1, x: 1, y: 1}]
      const result = await executor.upsert({x: 1})
      const expected = {id: 1, x: 1, y: 1, z: 2}
      expect(result).to.eql(expected)
      expect(executorData).to.eql([expected])
    })
  })

  describe('.patch', () => {
    it('should update values specified', async () => {
      executorData = [{id: 1, x: 1, y: 1}]
      const result = await executor.patch(1, {x: 2})
      const expected = {id: 1, x: 2, y: 1, z: 2}
      expect(result).to.eql(expected)
      expect(executorData).to.eql([expected])
    })

    it('should fail when id does not exist', async () => {
      executorData = [{id: 1, x: 1}]
      await expect(executor.patch(2, {x: 2})).to.be.rejectedWith(/without ID/)
      expect(executorData).to.eql([{id: 1, x: 1}])
    })

    it('should fail when violates constraints', async () => {
      executorData = [{id: 1, x: 1}, {id: 2, x: 2}]
      await expect(executor.patch(2, {x: 1})).to.be.rejectedWith(/violates unique/)
      expect(executorData).to.eql([{id: 1, x: 1}, {id: 2, x: 2}])
    })
  })

  describe('.destroy', () => {
    it('should destroy all by query', async () => {
      executorData = [{id: 1, x: 1, y: 1}, {id: 2, x: 2, y: 2}, {id: 3, x: 3, y: 1}]
      await executor.destroy({where: {y: 1}})
      expect(executorData).to.eql([{id: 2, x: 2, y: 2}])
    })
  })

  describe('.destroyOne', () => {
    it('should destroy one by query', async () => {
      executorData = [{id: 1, x: 1, y: 1}, {id: 2, x: 2, y: 2}, {id: 3, x: 3, y: 1}]
      await executor.destroyOne({where: {y: 2}})
      expect(executorData).to.have.length(2)
      expect(executorData[1].id).to.equal(3)
    })

    it('should do nothing when none match', async () => {
      executorData = [{id: 1, x: 1, y: 1}, {id: 2, x: 2, y: 2}, {id: 3, x: 3, y: 1}]
      await executor.destroyOne({where: {y: 4}})
      expect(executorData).to.have.length(3)
    })

    it('should fail to destroy when ambiguous', async () => {
      executorData = [{id: 1, x: 1, y: 1}, {id: 2, x: 2, y: 2}, {id: 3, x: 3, y: 1}]
      await expect(executor.destroyOne({where: {y: 1}})).to.be.rejectedWith(/single result/)
      expect(executorData).to.have.length(3)
    })
  })
})
