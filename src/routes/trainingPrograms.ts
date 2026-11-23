/*
 * trainingPrograms.ts
 * CRUD routes for the TRAINING_PROGRAM table.
 * All SQL uses ? placeholders (parameterized) to prevent SQL injection.
 */
import { Router } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../db.js";
import { validate, type Rules } from "../validation.js";

const router = Router();

// Must match the chk_training_program_delivery_method CHECK constraint in schema.sql
const DELIVERY_METHODS = ["In-person", "Online", "Hybrid"] as const;

// duration_hours has a CHECK (duration_hours > 0), so the minimum here is 1
const rules = {
  program_name:      { label: "Program name", type: "text", required: true, maxLength: 100 },
  provider:          { label: "Provider", type: "text", required: true, maxLength: 100 },
  duration_hours:    { label: "Duration (hours)", type: "int", required: true, min: 1, max: 10000 },
  training_category: { label: "Category", type: "text", required: true, maxLength: 50 },
  delivery_method:   { label: "Delivery method", type: "text", required: true, maxLength: 30, oneOf: DELIVERY_METHODS },
} satisfies Rules;

// READ: all training programs, with how many employees are enrolled in each
router.get("/", async (_req, res) => {
  const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT t.training_id, t.program_name, t.provider, t.duration_hours, t.training_category,
           t.delivery_method, COUNT(e.employee_id) AS enrollments
    FROM TRAINING_PROGRAM t
    LEFT JOIN ENROLLS_IN e ON e.training_id = t.training_id
    GROUP BY t.training_id, t.program_name, t.provider, t.duration_hours, t.training_category, t.delivery_method
    ORDER BY t.training_id`);
  res.json(rows);
});

// CREATE: insert a new training program
router.post("/", async (req, res) => {
  const t = validate(req.body, rules);
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO TRAINING_PROGRAM (program_name, provider, duration_hours, training_category, delivery_method)
     VALUES (?, ?, ?, ?, ?)`,
    [t.program_name, t.provider, t.duration_hours, t.training_category, t.delivery_method]
  );
  res.status(201).json({ message: "Training program created.", training_id: result.insertId });
});

// UPDATE: edit an existing training program by ID
router.put("/:id", async (req, res) => {
  const t = validate(req.body, rules);
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE TRAINING_PROGRAM
     SET program_name = ?, provider = ?, duration_hours = ?, training_category = ?, delivery_method = ?
     WHERE training_id = ?`,
    [t.program_name, t.provider, t.duration_hours, t.training_category, t.delivery_method, req.params.id]
  );
  if (result.affectedRows === 0) return res.status(404).json({ error: "Training program not found." });
  res.json({ message: "Training program updated." });
});

// DELETE: remove a training program by ID.
// ENROLLS_IN.training_id uses ON DELETE RESTRICT, so a program with any enrollment
// history cannot be deleted (completed training is part of an employee's record).
// In the sample data only program 6 (Supply Chain Fundamentals) has no enrollments.
router.delete("/:id", async (req, res) => {
  const [result] = await pool.execute<ResultSetHeader>(
    "DELETE FROM TRAINING_PROGRAM WHERE training_id = ?",
    [req.params.id]
  );
  if (result.affectedRows === 0) return res.status(404).json({ error: "Training program not found." });
  res.json({ message: "Training program deleted." });
});

export default router;
