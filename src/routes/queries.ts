/*
 * queries.ts
 * Runs the saved queries from previous assignments (A3 and A5), stored as one
 * .sql file per query in sql/queries/.
 *
 *   GET /api/queries      -> list of { id, name } (name = the file's first-line comment)
 *   GET /api/queries/:id  -> { name, columns, rows } for that query
 *
 * The SQL is sent to MySQL exactly as written in the file, so the app always shows the
 * same results as the queries submitted in earlier assignments.
 */
import { Router } from "express";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { FieldPacket, RowDataPacket } from "mysql2";
import { pool } from "../db.js";

const router = Router();

const QUERY_DIR = fileURLToPath(new URL("../../sql/queries/", import.meta.url));

type QueryFile = { id: string; name: string };

// Takes the display name from the file's first line: "/* A3 Query 1: ... */" or "-- ..."
function nameFromFirstLine(id: string, sql: string): string {
  const firstLine = sql.split("\n", 1)[0]?.trim() ?? "";
  const name = firstLine.replace(/^\/\*|\*\/$/g, "").replace(/^--/, "").trim();
  return name || id; // fall back to the file name if there is no comment
}

// Reads the folder on every request, so adding a .sql file needs no code change or restart.
// Files are sorted by name with numbers compared as numbers (a3_q1, a3_q2, ..., a3_q10,
// ..., a5_v3), so assignments stay grouped and q10 comes after q9 rather than after q1.
async function listQueryFiles(): Promise<QueryFile[]> {
  const files = (await readdir(QUERY_DIR))
    .filter((file) => file.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  return Promise.all(
    files.map(async (file) => {
      const id = file.slice(0, -".sql".length);
      return { id, name: nameFromFirstLine(id, await readFile(QUERY_DIR + file, "utf8")) };
    })
  );
}

// LIST: every saved query
router.get("/", async (_req, res) => {
  res.json(await listQueryFiles());
});

// RUN: execute one saved query and return its column headers and rows
router.get("/:id", async (req, res) => {
  // Only ids that match an existing file are accepted. Never building a path straight from
  // the URL means a request like /api/queries/..%2F..%2F.env cannot read other files.
  const query = (await listQueryFiles()).find((q) => q.id === req.params.id);
  if (!query) return res.status(404).json({ error: "Query not found." });

  const sql = await readFile(`${QUERY_DIR}${query.id}.sql`, "utf8");

  // rowsAsArray returns each row as an array in SELECT order. That keeps the columns in
  // the order the query defines them, and survives queries whose result has two columns
  // with the same name (objects would silently drop one of them).
  const [rows, fields] = (await pool.query({ sql, rowsAsArray: true })) as [RowDataPacket[], FieldPacket[]];
  res.json({ name: query.name, columns: fields.map((field) => field.name), rows });
});

export default router;
