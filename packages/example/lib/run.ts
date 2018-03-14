import {sqlExtension} from './kiln'
import {app} from './app'

;(async () => {
  await sqlExtension.sync({force: true})
  app.listen(process.env.PORT || 3000)
})()

