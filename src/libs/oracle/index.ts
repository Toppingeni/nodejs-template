import oracledb from 'oracledb';
import { oracleConnection } from './oracledb';
import { CommandsSpType } from '../../types/oracleType';
import { convertSQL } from '../../utils/sqlHelper';
import { logger } from '../../utils/logger';

/**
 * Oracle Database utility class
 * ให้บริการ CRUD operations และ stored procedure calls
 */
class Oracle {
  dbName: string;
  appID: string;
  options = {
    autoCommit: false,
    outFormat: oracledb.OUT_FORMAT_OBJECT,
  };
  optionExecuteMany = {
    autoCommit: false,
    batchErrors: true,
  };

  constructor(dbName?: string, appID?: string) {
    this.dbName = dbName || process.env.ORACLE_DB_NAME!;
    this.appID = appID || process.env.APP_ID!;
  }

  /**
   * Execute SELECT query
   * @param sql - SQL query string
   * @param params - Query parameters
   * @param options - Execute options
   * @returns Query results
   */
  async query<T>(sql: string, params: oracledb.BindParameters = {}, options?: oracledb.ExecuteOptions): Promise<T[]> {
    return await oracleConnection(this.dbName, async (connection) => {
      const startTime = Date.now();
      try {
        const result = await connection.execute<T>(sql, params, {
          ...this.options,
          ...options,
        });

        const duration = Date.now() - startTime;
        logger.logSQL(sql, params, duration);

        return result.rows ? result.rows : [];
      } catch (error: unknown) {
        logger.logSQLError(sql, params, error);
        console.error(error);
        const message = error instanceof Error ? error.message : 'Error querying Oracle database';
        throw new Error(message);
      }
    });
  }

  /**
   * Execute multiple SELECT queries
   * @param queries - Array of query objects
   * @returns Array of query results
   */
  async queries<T>(queries: { sql: string; params: oracledb.BindParameters }[]) {
    await oracleConnection(this.dbName, async (connection) => {
      try {
        const results = await Promise.all(
          queries.map(async (query) => {
            const startTime = Date.now();
            try {
              const result = await connection.execute<T>(query.sql, query.params, this.options);
              const duration = Date.now() - startTime;
              logger.logSQL(query.sql, query.params, duration);

              return result.rows ? result.rows : [];
            } catch (error: unknown) {
              logger.logSQLError(query.sql, query.params, error);
              throw error;
            }
          }),
        );

        return results;
      } catch (error: unknown) {
        console.error(error);
        const message = error instanceof Error ? error.message : 'Error querying Oracle database';
        throw new Error(message);
      }
    });
  }

  /**
   * Execute INSERT/UPDATE/DELETE command
   * @param sql - SQL command string
   * @param params - Command parameters
   * @returns Execute result
   */
  async command<T>(sql: string, params: oracledb.BindParameters) {
    return await oracleConnection(this.dbName, async (connection) => {
      const startTime = Date.now();
      try {
        const result = await connection.execute<T>(sql, params, this.options);

        if (result.rowsAffected && result.rowsAffected > 0) {
          await connection.commit();
        }

        const duration = Date.now() - startTime;
        logger.logSQL(sql, params, duration);

        return result;
      } catch (error: unknown) {
        logger.logSQLError(sql, params, error);
        console.error(error);
        const message = error instanceof Error ? error.message : 'Error executing Oracle command';
        throw new Error(message);
      }
    });
  }

  /**
   * Execute multiple commands in a single transaction with callback
   * @param commands - Array of command objects
   * @param callback - Optional callback function to execute after commands, determines commit/rollback
   * @returns Array of execute results
   */
  async commands<T>(commands: { sql: string; params: oracledb.BindParameters }[], callback?: (results: oracledb.Result<T>[]) => Promise<void> | void) {
    return await oracleConnection(this.dbName, async (connection) => {
      try {
        const results = await Promise.all(
          commands.map(async (command) => {
            const startTime = Date.now();
            try {
              const result = await connection.execute<T>(command.sql, command.params, this.options);
              const duration = Date.now() - startTime;
              logger.logSQL(command.sql, command.params, duration);

              return result;
            } catch (error: unknown) {
              logger.logSQLError(command.sql, command.params, error);
              throw error;
            }
          }),
        );

        // ถ้ามี callback ให้เรียกใช้ก่อน
        if (callback) {
          try {
            await callback(results);
            // ถ้า callback สำเร็จ ให้ commit
            await connection.commit();
          } catch (callbackError) {
            // ถ้า callback ไม่สำเร็จ ให้ rollback และ throw error
            await connection.rollback();
            throw callbackError;
          }
        } else {
          // ถ้าไม่มี callback ให้ใช้ logic เดิม
          if (results.some((result: oracledb.Result<T>) => result.rowsAffected && result.rowsAffected > 0)) {
            await connection.commit();
          }
        }

        return results;
      } catch (error: unknown) {
        // ถ้าเกิด error ในการ execute commands ให้ rollback
        await connection.rollback();
        console.error(error);
        const message = error instanceof Error ? error.message : 'Error executing Oracle command';
        throw new Error(message);
      }
    });
  }

  /**
   * Execute batch INSERT/UPDATE/DELETE with executeMany
   * @param sql - SQL command string
   * @param params - Array of parameters for batch execution
   * @param bindDefs - Bind definitions
   * @returns Execute many result
   */
  async commandMany<T>(sql: string, params: oracledb.BindParameters[], bindDefs: oracledb.BindDefinition) {
    return await oracleConnection(this.dbName, async (connection) => {
      try {
        const startTime = Date.now();
        const options = {
          ...this.optionExecuteMany,
          bindDefs,
        } as oracledb.ExecuteManyOptions;
        const result = await connection.executeMany<T>(sql, params, options);

        if (result.batchErrors && result.batchErrors.length > 0) {
          await connection.rollback();
          logger.logSQLError(sql, params, result.batchErrors);
          throw new Error(result.batchErrors[0].message);
        }

        const duration = Date.now() - startTime;
        logger.logSQL(sql, params, duration);

        return result;
      } catch (error: unknown) {
        logger.logSQLError(sql, params, error);
        console.error(error);
        const message = error instanceof Error ? error.message : 'Error executing Oracle command';
        throw new Error(message);
      }
    });
  }

  /**
   * Execute single stored procedure
   * @param queries - Stored procedure configuration
   * @returns Stored procedure result
   */
  async commandSp<T>(queries: CommandsSpType): Promise<{ rowsAffected: number; output: T }> {
    try {
      const result = await this.commandsSp([queries]);

      return result[0] as { rowsAffected: number; output: T };
    } catch (error: unknown) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'Error executing Oracle command';
      throw new Error(message);
    }
  }

  /**
   * Execute multiple stored procedures
   * @param queries - Array of stored procedure configurations
   * @returns Array of stored procedure results
   */
  async commandsSp(queries: CommandsSpType[]): Promise<{ rowsAffected: number; output: Record<string, unknown> }[]> {
    return await oracleConnection(this.dbName, async (connection) => {
      try {
        const startTime = Date.now();
        const output: {
          rowsAffected: number;
          output: Record<string, unknown>;
        }[] = [];

        for await (const obj of queries) {
          const _sql = `
              BEGIN
              ${obj.spName}(${
                obj.input
                  ? Object.keys(obj.input)
                      .map((x) => `:${x}`)
                      .join(', ')
                  : ''
              }${obj.input ? ',' : ''}${
                obj.output
                  ? Object.keys(obj.output)
                      .map((x) => `:${x}`)
                      .join(', ')
                  : ''
              });
            END;`;

          const convertParam = obj.input
            ? Object.keys(obj.input).reduce((pre, curr) => {
                return { ...pre, [curr]: obj.input![curr].value };
              }, {})
            : undefined;

          const sql = convertSQL('oracle', _sql, convertParam);

          const bindOutput: Record<string, unknown> = {};

          if (obj.output !== undefined) {
            Object.keys(obj.output).forEach((x) => {
              bindOutput[x] = {
                type: obj.output![x].type,
                dir: obj.output![x].dir,
                value: obj.output![x].value,
              };
            });
          }
          const callStartTime = Date.now();
          try {
            const res = await connection.execute(sql, bindOutput as oracledb.BindParameters, {
              autoCommit: false,
            });

            const duration = Date.now() - callStartTime;
            logger.LogSqlResult(sql, [convertParam], duration, res.rowsAffected, (res.outBinds as Record<string, unknown>) || {});

            output.push({
              rowsAffected: res.rowsAffected || 0,
              output: (res.outBinds as Record<string, unknown>) || {},
            });
          } catch (error: unknown) {
            const duration = Date.now() - callStartTime;
            logger.logSQLError(sql, convertParam, error);
            throw error;
          }
        }

        await connection.commit();

        return Promise.resolve(output);
      } catch (error: unknown) {
        console.error(error);
        const message = error instanceof Error ? error.message : 'Error executing Oracle command';
        throw new Error(message);
      }
    });
  }

  /**
   * Get SQL statement from SQL_TAB_OPPN table
   * @param sqlNo - SQL number
   * @param _appId - Application ID (optional)
   * @returns SQL statement string
   */
  async getSqlStmt(sqlNo: number, _appId?: number): Promise<string> {
    const appId = _appId ?? this.appID;
    const sqlTab = `SELECT  SQL_STMT FROM KPDBA.SQL_TAB_OPPN sto WHERE app_id = ${appId} AND sql_no = ${sqlNo}`;
    try {
      const startTime = Date.now();
      const result = await this.query<{ SQL_STMT: string }>(sqlTab, [], {
        fetchInfo: {
          SQL_STMT: { type: oracledb.STRING as unknown as number },
        },
      });

      const duration = Date.now() - startTime;
      logger.logSQL(sqlTab, [], duration);

      return result[0].SQL_STMT;
    } catch (error: unknown) {
      const appId = _appId ?? this.appID;
      logger.logSQLError(sqlTab, [], error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(message);
    }
  }

  /**
   * Execute query from SQL_TAB_OPPN table
   * @param sqlNo - SQL number
   * @param params - Query parameters
   * @returns Query results
   */
  async queryFromSqlTab<T>(sqlNo: number, params: oracledb.BindParameters): Promise<T[]> {
    try {
      const sql = await this.getSqlStmt(sqlNo);
      const result = await this.query<T>(sql as string, params);
      return result;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(message);
    }
  }

  /**
   * Execute command from SQL_TAB_OPPN table
   * @param sqlNo - SQL number
   * @param params - Command parameters
   * @returns Command result
   */
  async commandFromSqlTab<T>(sqlNo: number, params: oracledb.BindParameters): Promise<oracledb.Result<T>> {
    try {
      const sql = await this.getSqlStmt(sqlNo);
      const result = await this.command<T>(sql as string, params);
      return result;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(message);
    }
  }
}

// Export singleton instance
const oracleInstance = new Oracle(process.env.ORACLE_DB_NAME || 'ORCL', process.env.APP_ID || '');
export { oracleInstance as oracle };
export default Oracle;
