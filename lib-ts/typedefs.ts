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
  options(...options: any[]): IModel
  children(children: IModelChildrenInput): IModel
  pick(paths: string[]): IModel
  omit(paths: string[]): IModel
  merge(model: IModel): IModel
  coerce(coerce: IValidationFunction, phase?: ValidationPhase): IModel
  coerce(coerce: IModelCoercionMap): IModel
  validations(validations: IModelValidationInput | IModelValidationInput[]): IModel
}

export interface IModelSpecification {
  type?: string
  format?: string
  required?: boolean
  optional?: boolean
  nullable?: boolean
  strict?: boolean
  default?: any
  options?: any[]
  children?: IModel | IModelChild[]
  coerce?: IModelCoercionMap
  validations?: IModelValidationInput[]
}

export interface IValidatorOptions {
  types: string[]
  formats: {[typeName: string]: string[]}
  coerce: {[typeName: string]: {[formatName: string]: IModelCoercionMap}}
  validations: {[typeName: string]: {[formatName: string]: IModelValidationInput[]}}
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
  [phase: string]: IValidationFunction
}

export type IValidationFunction = (
  value: any,
  rootValue: any,
  pathToValue: string[],
) => IValidationResult

export interface IValidationResultError {
  message: string
  path?: string[]
  actual?: any
  expected?: any
}

export interface IValidationResult {
  value: any
  isFinished: boolean
  conforms: boolean
  errors: IValidationResultError[]
}

export enum ValidationPhase {
  Parse = 'parse',
  ValidateDefinition = 'validate-definition',
  TypeCoerce = 'type-coerce',
  FormatCoerce = 'format-coerce',
  ValidateValue = 'validate-value',
}
