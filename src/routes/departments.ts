/*
 * departments.ts
 * CRUD routes for the DEPARTMENT table.
 * All SQL uses ? placeholders (parameterized) to prevent SQL injection.
 */
import { Router } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../db.js";
import { validate, type Rules } from "../validation.js";

const router = Router();

// manager_id is optional: it is the MANAGES relationship and may be NULL
// (a new department, or one whose manager was deleted, see DELETE in employees.ts).
// It is UNIQUE in the schema because one employee can manage only one department.
const rules = {
  department_name:  { label: "Department name", type: "text", required: true, maxLength: 50 },
  location:         { label: "Location", type: "text", required: true, maxLength: 100 },
  budget:           { label: "Budget", type: "decimal", required: true, min: 0, max: 9999999999.99 },
  department_email: { label: "Department email", type: "text", required: true, maxLength: 100, email: true },
  manager_id:       { label: "Manager", type: "int", min: 1 },
} satisfies Rules;

// READ: all departments. LEFT JOIN so departments without a manager still appear.
router.get("/", async (_req, res) => {
  const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT d.department_id, d.department_name, d.location, d.budget, d.department_email,
           d.manager_id, CONCAT(m.first_name, ' ', m.last_name) AS manager_name
    FROM DEPARTMENT d
    LEFT JOIN EMPLOYEE m ON m.employee_id = d.manager_id
    ORDER BY d.department_id`);
  res.json(rows);
});

// CREATE: insert a new department
router.post("/", async (req, res) => {
  const d = validate(req.body, rules);
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO DEPARTMENT (department_name, location, budget, department_email, manager_id)
     VALUES (?, ?, ?, ?, ?)`,
    [d.department_name, d.location, d.budget, d.department_email, d.manager_id]
  );
  res.status(201).json({ message: "Department created.", department_id: result.insertId });
});

// UPDATE: edit an existing department by ID
router.put("/:id", async (req, res) => {
  const d = validate(req.body, rules);
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE DEPARTMENT
     SET department_name = ?, location = ?, budget = ?, department_email = ?, manager_id = ?
     WHERE department_id = ?`,
    [d.department_name, d.location, d.budget, d.department_email, d.manager_id, req.params.id]
  );
  if (result.affectedRows === 0) return res.status(404).json({ error: "Department not found." });
  res.json({ message: "Department updated." });
});

// DELETE: remove a department by ID.
// EMPLOYEE.department_id uses ON DELETE RESTRICT, so a department that still has
// employees cannot be deleted; they must be moved to another department first.
router.delete("/:id", async (req, res) => {
  const [result] = await pool.execute<ResultSetHeader>(
    "DELETE FROM DEPARTMENT WHERE department_id = ?",
    [req.params.id]
  );
  if (result.affectedRows === 0) return res.status(404).json({ error: "Department not found." });
  res.json({ message: "Department deleted." });
});

export default router;
