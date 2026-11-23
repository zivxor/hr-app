/*
 * resetDatabase.ts
 * Restores the database to its original state by rerunning the setup scripts:
 *   1. sql/schema.sql     - drops and recreates the database and all 14 tables
 *   2. sql/populate.sql   - inserts the sample data
 *   3. sql/db_objects.sql - recreates the views, functions, procedures and index that
 *                           the saved queries need (schema.sql's DROP DATABASE removes them)
 * Used by the "Reset database" button so deletes can be tested and then undone.
 */
import mysql from "mysql2/promise";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { DB_NAME, serverOptions } from "./db.js";

const SQL_DIR = fileURLToPath(new URL("../sql/", import.meta.url));
const SCRIPTS = ["schema.sql", "populate.sql", "db_objects.sql"];

// Splits a script into chunks that can be sent to MySQL, honouring DELIMITER lines.
// DELIMITER is a client-side command (Workbench / mysql CLI), not SQL, so the server would
// reject it. Normal ';'-terminated SQL is sent as one multi-statement chunk; each
// statement written under a custom delimiter (e.g. CREATE FUNCTION ... END //) is sent on
// its own, because its body contains ';' characters that must not end the statement.
export function splitScript(script: string): string[] {
  const chunks: string[] = [];
  let delimiter = ";";
  let buffer: string[] = [];

  const flush = () => {
    const chunk = buffer.join("\n").trim();
    if (chunk) chunks.push(chunk);
    buffer = [];
  };

  for (const line of script.split(/\r?\n/)) {
    const directive = line.match(/^\s*DELIMITER\s+(\S+)\s*$/i);
    if (directive?.[1]) {
      flush();
      delimiter = directive[1];
    } else if (delimiter !== ";" && line.trimEnd().endsWith(delimiter)) {
      // End of one custom-delimited statement: drop the delimiter and send it alone
      buffer.push(line.trimEnd().slice(0, -delimiter.length));
      flush();
    } else {
      buffer.push(line);
    }
  }
  flush();
  return chunks;
}

let resetRunning = false;

export async function resetDatabase(): Promise<void> {
  // Two overlapping resets would drop the database underneath each other
  if (resetRunning) throw new Error("A reset is already running.");
  resetRunning = true;

  // schema.sql hard-codes the database name. If .env points the app at a different
  // database, the reset would rebuild one database while the app reads another.
  const schema = await readFile(SQL_DIR + "schema.sql", "utf8");
  if (!new RegExp(`USE\\s+${DB_NAME}\\s*;`, "i").test(schema)) {
    resetRunning = false;
    throw new Error(`schema.sql does not create the database named in .env (DB_NAME=${DB_NAME}).`);
  }

  // A separate, short-lived connection with multipleStatements enabled: the scripts contain
  // many statements each. The shared pool keeps it disabled, so user input can never run
  // more than one statement. No database is selected, since schema.sql drops and creates it.
  const connection = await mysql.createConnection({ ...serverOptions, multipleStatements: true });
  try {
    for (const file of SCRIPTS) {
      const script = file === "schema.sql" ? schema : await readFile(SQL_DIR + file, "utf8");
      for (const chunk of splitScript(script)) {
        await connection.query(chunk);
      }
    }
  } finally {
    await connection.end();
    resetRunning = false;
  }
}
