export interface IModel {
  type(type: string): IModel
  format(format: string): IModel
  required(required?: boolean): IModel
  optional(optional?: boolean): IModel
  nullable(nullable?: boolean): IModel
  strict(strict?: boolean): IModel
  default(value?: any): IModel
  options(...options: any[]): IModel
}

export interface IModelSpecification {
  type?: string,
  format?: string,
  required?: boolean,
  optional?: boolean,
  nullable?: boolean,
  strict?: boolean,
  default?: any,
  options?: any[],
}

export interface IModelOptions {
  types: string[],
  formats: {[typeName: string]: string[]},
}
