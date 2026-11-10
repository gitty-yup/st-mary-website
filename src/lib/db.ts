import { Pool, PoolClient, QueryResultRow, types } from 'pg';

// Return DATE columns as 'YYYY-MM-DD' strings, not JS Dates at local midnight.
types.setTypeParser(1082, (v: string) => v);

const globalForPool = globalThis as unknown as { __stmaryPool?: Pool };

function getPool(): Pool {
  if (!globalForPool.__stmaryPool) {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!connectionString) throw new Error('DATABASE_URL is not configured.');
    globalForPool.__stmaryPool = new Pool({ connectionString, max: 3, idleTimeoutMillis: 10_000 });
  }
  return globalForPool.__stmaryPool;
}

export type Queryable = Pick<PoolClient, 'query'>;

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []): Promise<T[]> {
  const res = await getPool().query<T>(text, params);
  return res.rows;
}

export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const result = await fn(client);
    await client.query('commit');
    return result;
  } catch (err) {
    await client.query('rollback').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}
