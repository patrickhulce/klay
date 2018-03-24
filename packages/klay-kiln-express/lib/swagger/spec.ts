import {IKiln} from 'klay-kiln'
import {Spec} from 'swagger-schema-official'
import {IRouter} from '../typedefs'

export function buildSpecification(kiln: IKiln, router: IRouter): Spec {
  return {
    swagger: '2.0',
    info: {
      title: 'Title',
      version: 'Version',
    },
    paths: {},
  }
}
