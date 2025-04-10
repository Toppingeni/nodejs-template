import sequelize from './sequelize'
import { getConfig } from './config'

export { getConfig }

export const connect = async () => {
  try {
    await sequelize.authenticate()
    console.log('Sequelize connection established successfully')
    return true
  } catch (error) {
    console.error('Unable to connect to the database:', error)
    return false
  }
}

export default sequelize
