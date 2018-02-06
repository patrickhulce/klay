import {values} from 'lodash'

export interface IModelContext {
  use(extension: IValidatorOptionsUnsafe): IModelContext
  reset(): void
  create(): IModel

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
  enum(options: any[]): IModel
  children(children: IModelChildrenInput): IModel
  pick(paths: string[]): IModel
  omit(paths: string[]): IModel
  merge(model: IModel): IModel
  coerce(coerce: ICoerceFunction, phase?: ValidationPhase): IModel
  coerce(coerce: IModelCoercionMap): IModel
  validations(validations: IModelValidationInput | IModelValidationInput[]): IModel
  validate(value: any, options?: IValidateOptions): IValidationResult
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
  enum?: any[]

  min?: number | Date
  max?: number | Date
  strict?: boolean
  children?: IModel | IModelChild[]
}

export interface IModelChild {
  path: string
  model: IModel
}

export interface IModelChildrenMap {
  [key: string]: IModel
}

export type IModelChildrenInput = IModelChildrenMap | IModel | IModelChild[]

export type IModelValidationInput = IValidationFunction | RegExp

export interface IModelCoercionMap {
  [phase: string]: ICoerceFunction
}

export type ICoerceFunction = (
  value: IInternalValidationResult,
  spec: IModelSpecification,
) => IIntermediateValidationResult

export type IValidationFunction = (
  value: IInternalValidationResult,
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

export interface IValidationResult {
  value: any
  conforms: boolean
  errors: IValidationResultError[]
}

export interface IIntermediateValidationResult extends IValidationResult {
  rootValue: any
  pathToValue: string[]
  isFinished: boolean
}

export interface IInternalValidationResult extends IIntermediateValidationResult {
  setValue(value: any): IInternalValidationResult
  setIsFinished(value: boolean): IInternalValidationResult
  markAsErrored(error: Error): IInternalValidationResult
}

export enum ModelType {
  Any = 'any',
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
}

export interface IValidatorOptions {
  types: string[]
  formats: IValidatorFormats
  coerce: IValidatorCoerce
  validations: IValidatorValidations
  methods: IValidatorMethods
}

export interface IValidateOptions {
  failLoudly?: boolean
}

export type IModelMethod = (model: IModel, ...args: any[]) => IModel

export interface IValidatorMethods {
  [methodName: string]: IModelMethod
}

export const FALLBACK_FORMAT = '___FALLBACK_FORMAT___'
export const ALL_FORMATS = '___ALL_FORMATS___'
export const PHASES = values(ValidationPhase)
