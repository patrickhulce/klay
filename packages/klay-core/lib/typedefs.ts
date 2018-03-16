import {values} from 'lodash'

export interface IModelContext {
  use(extension: IKlayExtension): IModelContext
  reset(): void

  any(): IModel
  boolean(): IModel
  number(): IModel
  integer(): IModel
  finite(): IModel
  string(): IModel
  uuid(): IModel
  alphanumeric(): IModel
  hex(): IModel
  ip(): IModel
  uri(): IModel
  domain(): IModel
  email(): IModel
  creditCard(): IModel
  array(): IModel
  object(): IModel
  date(): IModel
  unixTimestamp(): IModel
}

export interface IModel {
  isKlayModel: boolean
  spec: IModelSpecification

  reset(): IModel
  clone(): IModel
  validate(value: any, options?: IValidateOptions): IValidationResult

  type(type: string): IModel
  format(format: string): IModel
  required(required?: boolean): IModel
  optional(optional?: boolean): IModel
  nullable(nullable?: boolean): IModel
  strict(strict?: boolean): IModel
  default(value?: any): IModel
  min(min: number | Date): IModel
  max(max: number | Date): IModel
  size(size: number): IModel
  enum(options: IModelEnumOption[]): IModel
  applies(appliesFunc?: IModelAppliesFunction): IModel
  children(children: IModelChildrenInput): IModel
  pick(paths: string[]): IModel
  omit(paths: string[]): IModel
  merge(model: IModel): IModel
  coerce(coerce: ICoerceFunction, phase?: ValidationPhase): IModel
  coerce(coerce: IModelCoercionMap): IModel
  validations(validations: IModelValidationInput | IModelValidationInput[]): IModel
}

export interface IModelSpecification {
  type?: string
  format?: string

  required?: boolean
  optional?: boolean
  nullable?: boolean
  default?: any
  coerce?: IModelCoercionMap
  validations?: IModelValidationInput[]
  enum?: IModelEnumOption[]
  applies?: IModelAppliesFunction

  min?: number
  max?: number
  strict?: boolean
  children?: IModel | IModelChild[]
}

export type IModelEnumOption = string | number | IModel

export interface IModelChild {
  path: string
  model: IModel
}

export interface IModelChildrenMap {
  [key: string]: IModel
}

export type IModelAppliesFunction = (result: IValidationResult) => boolean

export type IModelChildrenInput = IModelChildrenMap | IModel | IModelChild[]

export type IModelValidationInput = IValidationFunction | RegExp

export interface IModelCoercionMap {
  [phase: string]: ICoerceFunction
}

export type ICoerceFunction = (
  value: IValidationResult,
  spec: IModelSpecification,
) => IIntermediateValidationResult

export type IValidationFunction = (
  value: IValidationResult,
  spec: IModelSpecification,
) => void

export interface IValidationResultError {
  message: string
  path?: string[]
  actual?: any
  expected?: any
  error?: Error
  details?: any
}

export interface IValidationError {
  isKlayValidationError: boolean
  message: string
  value: any
  conforms: boolean
  errors: IValidationResultError[]

  toJSON(): IValidationResultJSON
}

export interface IValidationResultJSON {
  value: any
  conforms: boolean
  errors: IValidationResultError[]
}

export interface IIntermediateValidationResult extends IValidationResultJSON {
  rootValue: any
  pathToValue: string[]
  isFinished: boolean
}

export interface IValidationResult extends IIntermediateValidationResult {
  setConforms(conforms: boolean): IValidationResult
  setValue(value: any): IValidationResult
  setIsFinished(value: boolean): IValidationResult
  setErrors(errors: IValidationResultError[]): IValidationResult
  markAsErrored(error: Error): IValidationResult

  assert(value: boolean, message: string): IValidationResult
  clone(): IValidationResult
  toJSON(): IValidationResultJSON
  toError(): IValidationError | undefined
}

export enum ModelType {
  Any = 'any',
  Undefined = 'undefined',
  Boolean = 'boolean',
  Number = 'number',
  String = 'string',
  Array = 'array',
  Object = 'object',
  Date = 'date',
}

export enum ValidationPhase {
  Parse = 'parse',
  ValidateDefinition = 'validate-definition',
  CoerceType = 'coerce-type',
  ValidateChildren = 'validate-children',
  ValidateEnum = 'validate-enum',
  ValidateValue = 'validate-value',
}

export enum ModelHookPhase {
  Construction = 'construction',
  SetChildren = 'set-children',
}

export interface IValidatorFormats {
  [typeName: string]: string[]
}

export interface IValidatorCoerce {
  [typeName: string]: {[formatName: string]: IModelCoercionMap}
}

export interface IValidatorValidations {
  [typeName: string]: {[formatName: string]: IModelValidationInput[]}
}

export interface IValidatorOptionsUnsafe {
  types?: string[]
  formats?: IValidatorFormats
  coerce?: IValidatorCoerce
  validations?: IValidatorValidations
  methods?: IValidatorMethods
  defaults?: IModelSpecification
  hooks?: IModelHooks
}

export interface IValidatorOptions {
  types: string[]
  formats: IValidatorFormats
  coerce: IValidatorCoerce
  validations: IValidatorValidations
  methods: IValidatorMethods
  defaults: IModelSpecification
  hooks: IModelHooks
}

export interface IKlayExtension extends IValidatorOptionsUnsafe {
  extendContext?: IContextExtensionMethod
}

export interface IValidateOptions {
  failLoudly?: boolean
}

export type IContextExtensionMethod = (context: IModelContext) => void

export type IModelHook = (model: IModel) => void

export type IModelMethod = (model: IModel, ...args: any[]) => IModel

export type IModelHooks = {
  [phase in ModelHookPhase]: IModelHook[]
}

export interface IValidatorMethods {
  [methodName: string]: IModelMethod
}

export const FALLBACK_FORMAT = '___FALLBACK_FORMAT___'
export const ALL_FORMATS = '___ALL_FORMATS___'
export const PHASES = values(ValidationPhase)
