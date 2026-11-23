/*
 * dependents.ts
 * CRUD routes for the DEPENDENT table.
 * All SQL uses ? placeholders (parameterized) to prevent SQL injection.
 *
 * DEPENDENT is a weak entity: it has no ID of its own and is identified by its owner
 * plus a partial key, PRIMARY KEY (employee_id, dependent_name). So a single row is
 * addressed by both parts in the URL: /api/dependents/:employeeId/:dependentName
 * (the client URL-encodes the name, since names contain spaces).
 */
import { Router } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../db.js";
import { validate, type DateOrder, type Rules } from "../validation.js";

const router = Router();

// The values used in populate.sql. The columns are plain VARCHARs, so these lists are
// application rules that keep new data consistent with the existing data.
const RELATIONSHIPS = ["Spouse", "Child"] as const;
const COVERAGE_STATUSES = ["Active", "Inactive"] as const;

// The two primary key columns, only accepted when creating a dependent
const keyRules = {
  employee_id:    { label: "Employee", type: "int", required: true, min: 1 },
  dependent_name: { label: "Dependent name", type: "text", required: true, maxLength: 100 },
} satisfies Rules;

// The non-key columns, accepted on both create and update
const detailRules = {
  relationship_type:   { label: "Relationship", type: "text", required: true, maxLength: 30, oneOf: RELATIONSHIPS },
  date_of_birth:       { label: "Date of birth", type: "date", required: true },
  coverage_start_date: { label: "Coverage start", type: "date", required: true },
  coverage_status:     { label: "Coverage status", type: "text", required: true, maxLength: 20, oneOf: COVERAGE_STATUSES },
} satisfies Rules;

// Benefits coverage cannot begin before the dependent was born
const dateOrders: DateOrder[] = [
  { start: "date_of_birth", end: "coverage_start_date", message: "Coverage start cannot be before date of birth." },
];

// READ: all dependents with the owning employee's name
router.get("/", async (_req, res) => {
  const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT d.employee_id, CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
           d.dependent_name, d.relationship_type, d.date_of_birth,
           d.coverage_start_date, d.coverage_status
    FROM DEPENDENT d
    JOIN EMPLOYEE e ON e.employee_id = d.employee_id
    ORDER BY d.employee_id, d.dependent_name`);
  res.json(rows);
});

// CREATE: insert a new dependent. A second dependent with the same name under the
// same employee violates the composite primary key and is reported as a duplicate.
router.post("/", async (req, res) => {
  const d = validate(req.body, { ...keyRules, ...detailRules }, dateOrders);
  await pool.execute<ResultSetHeader>(
    `INSERT INTO DEPENDENT (employee_id, dependent_name, relationship_type, date_of_birth,
                            coverage_start_date, coverage_status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [d.employee_id, d.dependent_name, d.relationship_type, d.date_of_birth, d.coverage_start_date, d.coverage_status]
  );
  res.status(201).json({ message: "Dependent created." });
});

// UPDATE: edit a dependent's details. The key columns are deliberately not editable:
// they identify the row, so changing them would really be a different dependent.
// To fix a misspelled name, delete the dependent and add it again.
router.put("/:employeeId/:dependentName", async (req, res) => {
  const d = validate(req.body, detailRules, dateOrders);
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE DEPENDENT
     SET relationship_type = ?, date_of_birth = ?, coverage_start_date = ?, coverage_status = ?
     WHERE employee_id = ? AND dependent_name = ?`,
    [d.relationship_type, d.date_of_birth, d.coverage_start_date, d.coverage_status,
     req.params.employeeId, req.params.dependentName]
  );
  if (result.affectedRows === 0) return res.status(404).json({ error: "Dependent not found." });
  res.json({ message: "Dependent updated." });
});

// DELETE: remove one dependent. Both key parts are required in the WHERE clause,
// otherwise every dependent of that employee would be deleted.
// No other table references DEPENDENT, so this delete is never blocked.
router.delete("/:employeeId/:dependentName", async (req, res) => {
  const [result] = await pool.execute<ResultSetHeader>(
    "DELETE FROM DEPENDENT WHERE employee_id = ? AND dependent_name = ?",
    [req.params.employeeId, req.params.dependentName]
  );
  if (result.affectedRows === 0) return res.status(404).json({ error: "Dependent not found." });
  res.json({ message: "Dependent deleted." });
});

export default router;
