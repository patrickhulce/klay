import {defaultModelContext} from 'klay-core'
import {IKiln} from 'klay-kiln'
import {startCase} from 'lodash'
import {Spec} from 'swagger-schema-official'

import {IRouter} from '../typedefs'

import {SwaggerSchemaCache} from './cache'
import {getSchema} from './components'
import {buildPaths} from './paths'

export function buildSpecification(kiln: IKiln, router: IRouter, overrides?: Partial<Spec>): Spec {
  const schemaCache = new SwaggerSchemaCache()
  for (const kilnModel of kiln.getModels()) {
    const arrayModel = defaultModelContext.array().children(kilnModel.model)
    getSchema(kilnModel.model, schemaCache, startCase(kilnModel.name))
    getSchema(arrayModel, schemaCache, `${startCase(kilnModel.meta.plural)}List`)
  }

  return {
    swagger: '2.0',
    basePath: '/',
    produces: ['application/json'],
    host: 'localhost',
    schemes: ['http'],
    info: {
      title: 'Title',
      version: 'Version',
    },
    paths: buildPaths(router, schemaCache),
    definitions: schemaCache.getUniqueSchemas(),
    ...overrides,
  }
}
