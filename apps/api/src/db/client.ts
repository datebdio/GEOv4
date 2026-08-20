import { drizzle, type MySql2Database } from 'drizzle-orm/mysql2';
import mysql, { type Pool } from 'mysql2/promise';
import * as schema from './schema.js';

export interface DatabaseConnection {
  db: MySql2Database<typeof schema>;
  pool: Pool;
}

export function connectDatabase(url = process.env.DATABASE_URL): DatabaseConnection {
  if (!url) throw new Error('DATABASE_URL is required');
  const pool = mysql.createPool({ uri: url, connectionLimit: 10, enableKeepAlive: true });
  return { db: drizzle(pool, { schema, mode: 'default' }), pool };
}
