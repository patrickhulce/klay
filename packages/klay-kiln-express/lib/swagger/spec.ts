import {IKiln} from 'klay-kiln'
import {startCase} from 'lodash'
import {Spec} from 'swagger-schema-official'
import {IRouter} from '../typedefs'
import {SwaggerSchemaCache} from './cache'
import {getSchema} from './components'

export function buildSpecification(kiln: IKiln, router: IRouter): Spec {
  const schemaCache = new SwaggerSchemaCache()
  for (const kilnModel of kiln.getModels()) {
    getSchema(kilnModel.model, schemaCache, startCase(kilnModel.name))
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
    paths: {},
    definitions: schemaCache.getUniqueSchemas(),
  }
}
