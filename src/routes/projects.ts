/*
 * projects.ts
 * CRUD routes for the PROJECT table.
 * All SQL uses ? placeholders (parameterized) to prevent SQL injection.
 */
import { Router } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../db.js";
import { validate, type DateOrder, type Rules } from "../validation.js";

const router = Router();

// end_date is optional: NULL means the project is still ongoing (see populate.sql)
const rules = {
  project_name:        { label: "Project name", type: "text", required: true, maxLength: 100 },
  project_description: { label: "Description", type: "text", required: true, maxLength: 255 },
  start_date:          { label: "Start date", type: "date", required: true },
  end_date:            { label: "End date", type: "date" },
  budget:              { label: "Budget", type: "decimal", required: true, min: 0, max: 9999999999.99 },
} satisfies Rules;

// Mirrors the chk_project_dates CHECK constraint (end_date IS NULL OR end_date >= start_date)
const dateOrders: DateOrder[] = [
  { start: "start_date", end: "end_date", message: "End date cannot be before start date." },
];

// READ: all projects, with how many employees are assigned to each
router.get("/", async (_req, res) => {
  const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT p.project_id, p.project_name, p.project_description, p.start_date, p.end_date, p.budget,
           COUNT(a.employee_id) AS assigned_employees
    FROM PROJECT p
    LEFT JOIN ASSIGNED_TO a ON a.project_id = p.project_id
    GROUP BY p.project_id, p.project_name, p.project_description, p.start_date, p.end_date, p.budget
    ORDER BY p.project_id`);
  res.json(rows);
});

// CREATE: insert a new project
router.post("/", async (req, res) => {
  const p = validate(req.body, rules, dateOrders);
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO PROJECT (project_name, project_description, start_date, end_date, budget)
     VALUES (?, ?, ?, ?, ?)`,
    [p.project_name, p.project_description, p.start_date, p.end_date, p.budget]
  );
  res.status(201).json({ message: "Project created.", project_id: result.insertId });
});

// UPDATE: edit an existing project by ID
router.put("/:id", async (req, res) => {
  const p = validate(req.body, rules, dateOrders);
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE PROJECT
     SET project_name = ?, project_description = ?, start_date = ?, end_date = ?, budget = ?
     WHERE project_id = ?`,
    [p.project_name, p.project_description, p.start_date, p.end_date, p.budget, req.params.id]
  );
  if (result.affectedRows === 0) return res.status(404).json({ error: "Project not found." });
  res.json({ message: "Project updated." });
});

// DELETE: remove a project by ID.
// ASSIGNED_TO.project_id uses ON DELETE CASCADE, so the project's employee assignments
// are deleted with it (the UI warns about this before confirming).
router.delete("/:id", async (req, res) => {
  const [result] = await pool.execute<ResultSetHeader>(
    "DELETE FROM PROJECT WHERE project_id = ?",
    [req.params.id]
  );
  if (result.affectedRows === 0) return res.status(404).json({ error: "Project not found." });
  res.json({ message: "Project deleted." });
});

export default router;
