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
  enum(options: any[]): IModel
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
  enum?: any[]

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
}

export interface IValidatorOptions {
  types: string[]
  formats: IValidatorFormats
  coerce: IValidatorCoerce
  validations: IValidatorValidations
}

export interface IValidateOptions {
  failLoudly?: boolean
}

export const FALLBACK_FORMAT = '___FALLBACK_FORMAT___'
export const ALL_FORMATS = '___ALL_FORMATS___'
export const PHASES = Object.keys(ValidationPhase).map(k => ValidationPhase[k as any])
