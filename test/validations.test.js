const Model = relativeRequire('Model')

defineTest('validations.js', validations => {
  describe('#undefined', () => {
    const validate = validations.undefined.__default

    it('should pass when undefined', () => {
      testPassingValues([undefined], validate)
    })

    it('should fail when not undefined', () => {
      testFailingValues([null, false, 1, 'foo', {}, [], new Date()], validate)
    })
  })

  describe('#boolean', () => {
    const validate = validations.boolean.__default

    it('should pass when boolean', () => {
      testPassingValues([true, false], validate)
    })

    it('should fail when not boolean', () => {
      testFailingValues([null, 0, 'true', {}, []], validate)
    })
  })

  describe('#number', () => {
    const validate = validations.number.__default

    it('should pass when number', () => {
      testPassingValues([0, 1.232, 1253252, -9988723], validate)
    })

    it('should fail when not number', () => {
      testFailingValues([null, true, '', 'true', new Date()], validate)
    })

    it('should respect options', () => {
      const model = new Model({type: 'number', options: [1, 15, 56]})
      testPassingValues([1, 15, 56], validate, model)
      testFailingValues([23, 53, 'other'], validate, model)
    })
  })

  describe('#string', () => {
    const validate = validations.string.__default

    it('should pass when string', () => {
      testPassingValues(['', 'foo', 'something long', '123'], validate)
    })

    it('should fail when not string', () => {
      testFailingValues([null, true, 12, 0, {}, new Date()], validate)
    })

    it('should respect options', () => {
      const model = new Model({type: 'string', options: ['blue', 'red', 'yellow']})
      testPassingValues(['blue', 'red', 'yellow'], validate, model)
      testFailingValues(['green', 'purple', 76, {}], validate, model)
    })
  })

  describe('#object', () => {
    const validate = validations.object.__default

    context('when not strict', () => {
      let model
      beforeEach(() => {
        model = new Model({type: 'object'})
      })

      it('should pass when object', () => {
        testPassingValues([new Date(), {foo: 'bar'}, null, []], validate, model)
      })

      it('should fail when not object', () => {
        testFailingValues([true, 12, '2011-01-01'], validate, model)
      })
    })

    context('when strict', () => {
      let model
      beforeEach(() => {
        model = new Model({
          type: 'object',
          strict: true,
          children: {id: new Model({type: 'number'})},
        })
      })

      it('should pass when object', () => {
        testPassingValues([{}, {id: 1}], validate, model)
      })

      it('should fail when not object', () => {
        testFailingValues([true, 12, '2011-01-01'], validate, model)
      })

      it('should fail when object has unknown keys', () => {
        testFailingValues([[1], {foo: 1}, {id: 1, other: ''}], validate, model)
      })
    })
  })

  describe('#array', () => {
    const validate = validations.array.__default

    it('should pass when array', () => {
      testPassingValues([[], [1, 2, 3]], validate)
    })

    it('should fail when not array', () => {
      testFailingValues([null, true, 1, 'array', {0: 1, 1: 2}], validate)
    })
  })
})
