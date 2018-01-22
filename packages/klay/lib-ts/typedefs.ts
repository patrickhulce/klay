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
}

export interface IModelOptions {
  types: string[]
  formats: {[typeName: string]: string[]}
}

export interface IModelChild {
  path: string
  model: IModel
}

export interface IModelChildrenMap {
  [key: string]: IModel
}

export type IModelChildrenInput = IModelChildrenMap | IModel | IModelChild[]
