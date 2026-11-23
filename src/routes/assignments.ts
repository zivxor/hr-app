/*
 * assignments.ts
 * CRUD routes for the ASSIGNED_TO table (which employees work on which projects).
 * All SQL uses ? placeholders (parameterized) to prevent SQL injection.
 *
 * ASSIGNED_TO is the M:N relationship between EMPLOYEE and PROJECT, so its primary key
 * is the pair (employee_id, project_id) and one row is addressed by both parts:
 * /api/assignments/:employeeId/:projectId
 */
import { Router } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../db.js";
import { validate, type Rules } from "../validation.js";

const router = Router();

// The two primary key columns, only accepted when creating an assignment
const keyRules = {
  employee_id: { label: "Employee", type: "int", required: true, min: 1 },
  project_id:  { label: "Project", type: "int", required: true, min: 1 },
} satisfies Rules;

// The relationship's own attributes, accepted on both create and update.
// project_rating is optional (NULL = not rated yet, e.g. ongoing projects) and must be
// 1-5 when given; hours_worked is DECIMAL(6,2) and >= 0. Both mirror CHECKs in schema.sql.
const detailRules = {
  project_role:   { label: "Project role", type: "text", required: true, maxLength: 50 },
  assigned_date:  { label: "Assigned date", type: "date", required: true },
  project_rating: { label: "Rating", type: "int", min: 1, max: 5 },
  hours_worked:   { label: "Hours worked", type: "decimal", required: true, min: 0, max: 9999.99 },
} satisfies Rules;

// READ: all assignments with employee and project names
router.get("/", async (_req, res) => {
  const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT a.employee_id, CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
           a.project_id, p.project_name, a.project_role, a.assigned_date,
           a.project_rating, a.hours_worked
    FROM ASSIGNED_TO a
    JOIN EMPLOYEE e ON e.employee_id = a.employee_id
    JOIN PROJECT  p ON p.project_id  = a.project_id
    ORDER BY a.project_id, a.employee_id`);
  res.json(rows);
});

// CREATE: assign an employee to a project. Assigning the same employee to the same
// project twice violates the composite primary key and is reported as a duplicate.
router.post("/", async (req, res) => {
  const a = validate(req.body, { ...keyRules, ...detailRules });
  await pool.execute<ResultSetHeader>(
    `INSERT INTO ASSIGNED_TO (employee_id, project_id, project_role, assigned_date, project_rating, hours_worked)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [a.employee_id, a.project_id, a.project_role, a.assigned_date, a.project_rating, a.hours_worked]
  );
  res.status(201).json({ message: "Assignment created." });
});

// UPDATE: edit an assignment's details (role, hours, rating). The key columns are not
// editable because they identify the row; moving an employee to another project is
// done by deleting this assignment and creating a new one.
router.put("/:employeeId/:projectId", async (req, res) => {
  const a = validate(req.body, detailRules);
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE ASSIGNED_TO
     SET project_role = ?, assigned_date = ?, project_rating = ?, hours_worked = ?
     WHERE employee_id = ? AND project_id = ?`,
    [a.project_role, a.assigned_date, a.project_rating, a.hours_worked,
     req.params.employeeId, req.params.projectId]
  );
  if (result.affectedRows === 0) return res.status(404).json({ error: "Assignment not found." });
  res.json({ message: "Assignment updated." });
});

// DELETE: remove one assignment. Both key parts are required in the WHERE clause,
// otherwise all of the employee's (or project's) assignments would be deleted.
router.delete("/:employeeId/:projectId", async (req, res) => {
  const [result] = await pool.execute<ResultSetHeader>(
    "DELETE FROM ASSIGNED_TO WHERE employee_id = ? AND project_id = ?",
    [req.params.employeeId, req.params.projectId]
  );
  if (result.affectedRows === 0) return res.status(404).json({ error: "Assignment not found." });
  res.json({ message: "Assignment deleted." });
});

export default router;
