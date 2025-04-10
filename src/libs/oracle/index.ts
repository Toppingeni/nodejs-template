import oracledb, { initOracleClient } from 'oracledb'

import { oracleConnection } from './oracledb'
import type { CommandsSpType } from '@/types/oracleType'
import { convertSQL } from '@/utils/sqlHelper'

if (process.env.ORACLE_CLIENT_PATH) {
  console.log('ORACLE_CLIENT_PATH', process.env.ORACLE_CLIENT_PATH)

  try {
    initOracleClient({ libDir: process.env.ORACLE_CLIENT_PATH })
  } catch (err) {
    console.error('Failed to initialize Oracle Client:', err)
    throw new Error('Cannot load Oracle Client. Ensure ORACLE_CLIENT_PATH is set correctly.')
  }
} else {
  console.warn('ORACLE_CLIENT_PATH is not set. Ensure the Oracle Client is installed and configured.')
}

class Oracle {
  dbName: string
  options = {
    autoCommit: false,
    outFormat: oracledb.OUT_FORMAT_OBJECT
  }
  optionExecuteMany = {
    autoCommit: false,
    batchErrors: true
  }
  constructor(dbName: string) {
    this.dbName = dbName
  }

  /*
  For Function query, queries, command, and commands

  Read on => https://node-oracledb.readthedocs.io/en/latest/user_guide/sql_execution.html
  Example:
  const sql = `SELECT * FROM mytab WHERE id = :id`
  const params = { id: 101 }
  const result = await command(sql, params, options)
  */
  async query<T>(sql: string, params: oracledb.BindParameters[] = []) {
    return await oracleConnection(this.dbName, async connection => {
      try {
        const result = await connection.execute<T>(sql, params, this.options)

        return result.rows ? result.rows : []
      } catch (error: any) {
        console.error(error)
        throw new Error(error.message || 'Error querying Oracle database')
      }
    })
  }

  async queries<T>(queries: { sql: string; params: oracledb.BindParameters[] }[]) {
    await oracleConnection(this.dbName, async connection => {
      try {
        const results = await Promise.all(
          queries.map(async query => {
            const result = await connection.execute<T>(query.sql, query.params, this.options)

            return result.rows ? result.rows : []
          })
        )

        return results
      } catch (error: any) {
        console.error(error)
        throw new Error(error.message || 'Error querying Oracle database')
      }
    })
  }

  async command<T>(sql: string, params: oracledb.BindParameters[] = []) {
    return await oracleConnection(this.dbName, async connection => {
      try {
        const result = await connection.execute<T>(sql, params, this.options)

        if (result.rowsAffected && result.rowsAffected > 0) {
          await connection.commit()
        }

        return result
      } catch (error: any) {
        console.error(error)
        throw new Error(error.message || 'Error executing Oracle command')
      }
    })
  }

  async commands<T>(commands: { sql: string; params: oracledb.BindParameters[] }[]) {
    return await oracleConnection(this.dbName, async connection => {
      try {
        const results = await Promise.all(
          commands.map(async command => {
            const result = await connection.execute<T>(command.sql, command.params, this.options)

            return result
          })
        )

        if (results.some(result => result.rowsAffected && result.rowsAffected > 0)) {
          await connection.commit()
        }

        return results
      } catch (error: any) {
        console.error(error)
        throw new Error(error.message || 'Error executing Oracle command')
      }
    })
  }

  /*
  Read on => https://node-oracledb.readthedocs.io/en/latest/user_guide/batch_statement.html#handling-data-errors-with-executemany
  Example:
  const sql = `INSERT INTO mytab VALUES (:1, :2)`
  const binds = [
    [101, 'Alpha'],
    [102, 'Beta'],
    [103, 'Gamma']
  ]
  const options = {
    bindDefs: {
      1: { type: oracledb.NUMBER },
      2: { type: oracledb.STRING, maxSize: 20 }
    }
  }
  await commandMany(sql, binds, options)
  */
  async commandMany<T>(sql: string, params: oracledb.BindParameters[], bindDefs: oracledb.BindDefinition) {
    return await oracleConnection(this.dbName, async connection => {
      try {
        const options = { ...this.optionExecuteMany, bindDefs } as oracledb.ExecuteManyOptions
        const result = await connection.executeMany<T>(sql, params, options)

        if (result.batchErrors && result.batchErrors.length > 0) {
          await connection.rollback()
          throw new Error(result.batchErrors[0].message)
        }

        return result
      } catch (error: any) {
        console.error(error)
        throw new Error(error.message || 'Error executing Oracle command')
      }
    })
  }

  /*

  Example:
   const spName = `KPDBA.PACK_COSTING.SP_GET_COST_ID`;
   const input: InOutParamsType = {
      AN_YEAR: {
        type: OracleDB.NUMBER,
        dir: OracleDB.BIND_IN,
        value: year,
      },
      AN_MONTH: {
        type: OracleDB.NUMBER,
        dir: OracleDB.BIND_IN,
        value: month,
      },
    };
    const out: InOutParamsType = {
      V_NEW_COST_ID: { type: oracledb.STRING, dir: OracleDB.BIND_OUT },
    };
    type SpOutputType = { V_NEW_COST_ID: string; }
    const res = await commandSp<SpOutputType>({
      spName
      output: out,
      input: input,
    });
    return res.output.V_NEW_COST_ID;
  */
  async commandSp<T>(queries: CommandsSpType): Promise<{ rowsAffected: number; output: T }> {
    try {
      const result = await this.commandsSp([queries])

      return result[0]
    } catch (error: any) {
      console.error(error)
      throw new Error(error.message || 'Error executing Oracle command')
    }
  }
  async commandsSp(queries: CommandsSpType[]): Promise<{ rowsAffected: number; output: any }[]> {
    return await oracleConnection(this.dbName, async connection => {
      try {
        const output = []
        const _sqlLog: string[] = []

        for await (const obj of queries) {
          const _sql = `
              BEGIN
              ${obj.spName}(${
                obj.input
                  ? Object.keys(obj.input)
                      .map(x => `:${x}`)
                      .join(', ')
                  : ''
              }${obj.input ? ',' : ''}${
                obj.output
                  ? Object.keys(obj.output)
                      .map(x => `:${x}`)
                      .join(', ')
                  : ''
              });
            END;`

          const convertParam = obj.input
            ? Object.keys(obj.input).reduce((pre, curr) => {
                return { ...pre, [curr]: obj.input![curr].value }
              }, {})
            : undefined

          const sql = convertSQL('oracle', _sql, convertParam)

          _sqlLog.push(sql)
          const bindOutput: any = {}

          if (obj.output !== undefined) {
            Object.keys(obj.output).forEach(x => {
              bindOutput[x] = { type: obj.output![x].type, dir: obj.output![x].dir, value: obj.output![x].value }
            })
          }

          const res = await connection.execute(sql, bindOutput, {
            autoCommit: false
          })

          output.push({ rowsAffected: res.rowsAffected || 0, output: res.outBinds })
        }

        await connection.commit()

        return Promise.resolve(output)
      } catch (error: any) {
        console.error(error)
        throw new Error(error.message || 'Error executing Oracle command')
      }
    })
  }
}

export default Oracle
