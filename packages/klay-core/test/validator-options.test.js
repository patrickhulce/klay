const Options = require('../dist/validator-options').ValidatorOptions

const emptyObj = {___ALL_FORMATS___: {}, ___FALLBACK_FORMAT___: {}}
const emptyArr = {___ALL_FORMATS___: [], ___FALLBACK_FORMAT___: []}
describe('lib/validator-options.ts', () => {
  describe('#constructor', () => {
    it('creates successfully', () => {
      const types = ['string']
      const options = new Options({types})
      expect(options.types).toEqual(['string'])
      expect(options.types).not.toBe(types)
      expect(options.formats).toEqual({string: []})
      expect(options.coerce).toEqual({string: emptyObj})
      expect(options.validations).toEqual({string: emptyArr})
    })

    it('fills in missing formats', () => {
      const types = ['string']
      const formats = {string: ['name']}
      const options = new Options({types, formats})
      expect(options.types).toEqual(['string'])
      expect(options.types).not.toBe(types)
      expect(options.formats).toEqual({string: ['name']})
      expect(options.formats).not.toBe(formats)
      expect(options.coerce).toEqual({string: Object.assign({}, emptyObj, {name: {}})})
      expect(options.validations).toEqual({string: Object.assign({}, emptyArr, {name: []})})
    })

    it('allows partial definition', () => {
      const parseFn = () => ''
      const options = new Options({
        types: ['string'],
        validations: {string: {___ALL_FORMATS___: [1]}},
        coerce: {string: {___ALL_FORMATS___: {parse: parseFn}}},
      })

      expect(options.types).toEqual(['string'])
      expect(options.formats).toEqual({string: []})
      expect(options.coerce).toEqual({
        string: {___ALL_FORMATS___: {parse: parseFn}, ___FALLBACK_FORMAT___: {}},
      })
      expect(options.validations).toEqual({
        string: {___ALL_FORMATS___: [1], ___FALLBACK_FORMAT___: []},
      })
    })

    it('throws on invalid input', () => {
      expect(() => new Options({types: 'foo'})).toThrowError()
      expect(() => new Options({types: {}})).toThrowError()
      expect(() => new Options({types: ['string'], formats: {whaa: []}})).toThrowError()
      expect(() => new Options({types: ['string'], validations: {whaa: []}})).toThrowError()
      expect(() => new Options({types: ['string'], validations: {string: []}})).toThrowError()
      expect(() => new Options({hooks: {value: 1}})).toThrowError()
    })
  })

  describe('.clone', () => {
    it('deep clones the options', () => {
      const original = {types: ['string']}
      const optionsA = new Options(original)
      const optionsB = optionsA.clone()
      optionsA.types.push('a')
      optionsB.types.push('b')
      expect(original.types).toEqual(['string'])
      expect(optionsA.types).toEqual(['string', 'a'])
      expect(optionsB.types).toEqual(['string', 'b'])
    })

    it('deep clones the nested objects', () => {
      const parseFn = () => ''
      const allFormatsCoerce = {parse: parseFn}
      const coerce = {string: {___ALL_FORMATS___: allFormatsCoerce}}
      const original = {types: ['string'], coerce}
      const optionsA = new Options(original)
      const optionsB = optionsA.clone()
      optionsA.coerce.string.___ALL_FORMATS___.foo = 1
      optionsB.coerce.string.___ALL_FORMATS___.bar = 2
      expect(original.coerce.string.___ALL_FORMATS___).toEqual({parse: parseFn})
      expect(optionsA.coerce.string.___ALL_FORMATS___).toEqual({parse: parseFn, foo: 1})
      expect(optionsB.coerce.string.___ALL_FORMATS___).toEqual({parse: parseFn, bar: 2})
    })
  })

  describe('#from', () => {
    it('fills in missing properties', () => {
      const input = {types: ['string']}
      const options = Options.from(input)
      expect(options).not.toBe(input)
      expect(options.types).toEqual(['string'])
      expect(options.formats).toEqual({string: []})
      expect(options.coerce).toEqual({string: emptyObj})
      expect(options.validations).toEqual({string: emptyArr})
    })

    it('reuses existing options', () => {
      const input = new Options({types: ['string']})
      const options = Options.from(input)
      expect(options).toBe(input)
    })
  })

  describe('#merge', () => {
    it('merges two options without touching original', () => {
      const methodA = () => 1
      const methodB = () => 2
      const inputA = {types: ['string'], methods: {methodA}}
      const inputB = {types: ['number'], methods: {methodB}}
      const options = Options.merge(inputA, inputB)
      expect(options).toEqual({
        defaults: {},
        hooks: {},
        types: ['string', 'number'],
        formats: {string: [], number: []},
        methods: {methodA, methodB},
        coerce: {
          string: emptyObj,
          number: emptyObj,
        },
        validations: {
          string: emptyArr,
          number: emptyArr,
        },
      })

      expect(inputA).toEqual({types: ['string'], methods: {methodA}})
      expect(inputB).toEqual({types: ['number'], methods: {methodB}})
    })

    it('merges defaults', () => {
      const inputA = {defaults: {required: true, type: 'object'}}
      const inputB = {defaults: {required: false, type: 'string'}}
      const inputC = {defaults: {type: 'number'}}
      const options = Options.merge(inputA, inputB, inputC)
      expect(options.defaults).toEqual({required: false, type: 'number'})
    })

    it('merges hooks', () => {
      const hookA = () => 1
      const hookB = () => 2
      const inputA = {hooks: {construction: [hookA]}}
      const inputB = {hooks: {construction: [hookB]}}
      const inputC = {hooks: {'set-children': [hookB]}}
      const options = Options.merge(inputA, inputB, inputC)
      expect(options.hooks).toEqual({
        'construction': [hookA, hookB],
        'set-children': [hookB],
      })
    })

    it('merges more than two options', () => {
      const inputA = {types: ['string']}
      const inputB = {types: ['number']}
      const inputC = {types: ['array']}
      const inputD = {types: ['object']}
      const options = Options.merge(inputA, inputB, inputC, inputD)
      expect(options.types).toEqual(['string', 'number', 'array', 'object'])
    })

    it('dedupes types', () => {
      const inputA = {types: ['string']}
      const inputB = {types: ['number', 'string']}
      const options = Options.merge(inputA, inputB)
      expect(options.types).toEqual(['string', 'number'])
    })
  })
})
