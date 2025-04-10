import moment from 'moment'

export function convertParam(value: string | number | boolean | Date | null, format: 'mssql' | 'oracle'): string {
  if (value === null && typeof value === 'object') return 'NULL'
  if (Object.prototype.toString.call(value) === '[object Null]') return 'null'

  try {
    switch (typeof value) {
      case 'string':
        return `'${value}'`
      case 'number':
        return value.toString()
      case 'boolean':
        return value ? '1' : '0'
      case 'object':
        if (Object.prototype.toString.call(value) === '[object Date]') {
          return format === 'mssql'
            ? `CONVERT(DATETIME, '${value.toISOString()}',127)`
            : `TO_DATE('${moment(value).format('YYYY-MM-DD HH:mm:ss')}', 'YYYY-MM-DD HH24:MI:SS')`
        }

        throw new Error('Unsupported type:' + typeof value + Object.prototype.toString.call(value))
      default:
        throw new Error('Unsupported type:' + typeof value + Object.prototype.toString.call(value))
    }
  } catch (err) {
    throw err
  }
}

export function convertSQL(
  format: 'mssql' | 'oracle',
  sql: string,
  params?: Record<string, string | number | boolean | Date | null>,
  clobData?: string[]
): string {
  if (!params) return sql

  try {
    const keys = Object.keys(params)

    if (keys.length === 0) return sql
    const key = keys.shift() || ''
    const value = convertParam(params[key], format)

    delete params[key]

    const _sql = clobData?.includes(key)
      ? sql
      : sql
          .replace(new RegExp(`:${key}\\b`, 'g'), value)
          .replace(new RegExp(`@${key}\\b`, 'g'), value)
          .replace(new RegExp(`:${key.toUpperCase()}\\b`, 'g'), value)
          .replace(new RegExp(`@${key.toUpperCase()}\\b`, 'g'), value)

    return convertSQL(format, _sql, params)
  } catch (err) {
    throw err
  }
}
