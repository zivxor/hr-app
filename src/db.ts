/*
 * db.ts
 * Database connection settings and the shared connection pool.
 */
import mysql from "mysql2/promise";
import "dotenv/config";

// Reads a required setting from .env and stops with a clear message if it's missing
function requireEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined) {
    throw new Error(`Missing ${name} in .env`);
  }
  return value;
}

// Server login settings without a database selected.
// The reset script needs this form because schema.sql drops and recreates the database itself.
export const serverOptions = {
  host: requireEnv("DB_HOST"),
  port: Number(process.env.DB_PORT ?? 3306),
  user: requireEnv("DB_USER"),
  password: requireEnv("DB_PASSWORD"),
  dateStrings: true, // return dates as 'YYYY-MM-DD' strings instead of JS Date objects
};

export const DB_NAME = requireEnv("DB_NAME");

// Shared pool used by every route. multipleStatements stays off (the default) so a
// single request can never smuggle a second SQL statement into a query.
export const pool = mysql.createPool({ ...serverOptions, database: DB_NAME });
