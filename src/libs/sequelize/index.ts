import { initSequelize } from './sequelize'
import { getConfig } from './config'

import type { Sequelize } from 'sequelize'
let sequelize: Sequelize | null = null

// Initialize connection immediately
initSequelize()
  .then(conn => {
    sequelize = conn
  })
  .catch(error => {
    console.error('Unable to connect to the database:', error)
  })

export { getConfig }

export const connect = () => {
  return !!sequelize
}

export default () => {
  if (!sequelize) {
    throw new Error('Sequelize connection not initialized')
  }
  return sequelize
}
