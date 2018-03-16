import {IKiln, Kiln} from '../../lib'
import {SQLDialect, SQLExtension} from '../../lib'
import {RouterExtension, RouteExtension, ActionType} from '../../lib'

import {userModel} from './models/user'

export const kiln: IKiln = new Kiln()

export enum ModelId {
  User = 'user',
}

kiln.addModel({name: ModelId.User, model: userModel, meta: {plural: 'example_users'}})

const sqlOptions = {
  host: process.env.KLAY_MYSQL_HOST || 'localhost',
  database: process.env.KLAY_MYSQL_DB,
  user: process.env.KLAY_MYSQL_USER,
  password: process.env.KLAY_MYSQL_PASSWORD || '',
  dialect: SQLDialect.MySQL,
}

export const sqlExtension = new SQLExtension(sqlOptions)
kiln.addExtension({extension: sqlExtension})

const routeExtension = new RouteExtension({type: ActionType.List})
kiln.addExtension({extension: routeExtension})

const routerExtension = new RouterExtension({})
kiln.addExtension({extension: routerExtension})
