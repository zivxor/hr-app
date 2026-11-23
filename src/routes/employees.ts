/*
 * employees.ts
 * CRUD routes for the EMPLOYEE table.
 * All SQL uses ? placeholders (parameterized) to prevent SQL injection.
 * Database errors are thrown to the error handler in server.ts, which
 * converts them with friendlyError.
 */
import { Router } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../db.js";
import { validate, type Rules } from "../validation.js";

const router = Router();

// Columns the user can set. employee_id is AUTO_INCREMENT, so it is never sent.
const rules = {
  first_name:    { label: "First name", type: "text", required: true, maxLength: 50 },
  last_name:     { label: "Last name", type: "text", required: true, maxLength: 50 },
  email:         { label: "Email", type: "text", required: true, maxLength: 100, email: true },
  hire_date:     { label: "Hire date", type: "date", required: true },
  department_id: { label: "Department", type: "int", required: true, min: 1 },
  job_role_id:   { label: "Job role", type: "int", required: true, min: 1 },
} satisfies Rules;

// READ: all employees, with department and job title joined in for readability
router.get("/", async (_req, res) => {
  const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT e.employee_id, e.first_name, e.last_name, e.email, e.hire_date,
           e.department_id, d.department_name, e.job_role_id, j.title
    FROM EMPLOYEE e
    JOIN DEPARTMENT d ON d.department_id = e.department_id
    JOIN JOB_ROLE  j ON j.job_role_id   = e.job_role_id
    ORDER BY e.employee_id`);
  res.json(rows);
});

// CREATE: insert a new employee
router.post("/", async (req, res) => {
  const e = validate(req.body, rules);
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO EMPLOYEE (first_name, last_name, email, hire_date, department_id, job_role_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [e.first_name, e.last_name, e.email, e.hire_date, e.department_id, e.job_role_id]
  );
  res.status(201).json({ message: "Employee created.", employee_id: result.insertId });
});

// UPDATE: edit an existing employee by ID
router.put("/:id", async (req, res) => {
  const e = validate(req.body, rules);
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE EMPLOYEE
     SET first_name = ?, last_name = ?, email = ?, hire_date = ?, department_id = ?, job_role_id = ?
     WHERE employee_id = ?`,
    [e.first_name, e.last_name, e.email, e.hire_date, e.department_id, e.job_role_id, req.params.id]
  );
  // affectedRows = 0 means no employee had that ID
  if (result.affectedRows === 0) return res.status(404).json({ error: "Employee not found." });
  res.json({ message: "Employee updated." });
});

// DELETE: remove an employee by ID.
// What happens to related rows is decided by the foreign keys in schema.sql:
//  - SALARY, LEAVE_REQUEST, PERFORMANCE_REVIEW use ON DELETE RESTRICT, so an employee
//    with pay history, leave requests or reviews cannot be deleted (HR records must be kept).
//    Every seeded employee has salary rows, so only newly added employees can be deleted.
//  - EMPLOYEE_PHONE, DEPENDENT, ASSIGNED_TO, ENROLLS_IN use ON DELETE CASCADE and are removed too.
//  - DEPARTMENT.manager_id uses ON DELETE SET NULL, so a deleted manager leaves the
//    department without a manager instead of blocking the delete.
router.delete("/:id", async (req, res) => {
  const [result] = await pool.execute<ResultSetHeader>(
    "DELETE FROM EMPLOYEE WHERE employee_id = ?",
    [req.params.id]
  );
  if (result.affectedRows === 0) return res.status(404).json({ error: "Employee not found." });
  res.json({ message: "Employee deleted." });
});

export default router;
