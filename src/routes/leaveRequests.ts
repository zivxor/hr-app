/*
 * leaveRequests.ts
 * CRUD routes for the LEAVE_REQUEST table.
 * All SQL uses ? placeholders (parameterized) to prevent SQL injection.
 */
import { Router } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../db.js";
import { validate, type DateOrder, type Rules } from "../validation.js";

const router = Router();

// The leave types used in populate.sql. The column is a plain VARCHAR, so this list is an
// application rule that keeps new data consistent with the existing data.
const LEAVE_TYPES = ["Vacation", "Sick", "Personal", "Parental", "Bereavement"] as const;
// Must match the chk_leave_status CHECK constraint in schema.sql
const STATUSES = ["Pending", "Approved", "Rejected"] as const;

const rules = {
  employee_id:  { label: "Employee", type: "int", required: true, min: 1 },
  leave_type:   { label: "Leave type", type: "text", required: true, maxLength: 30, oneOf: LEAVE_TYPES },
  start_date:   { label: "Start date", type: "date", required: true },
  end_date:     { label: "End date", type: "date", required: true },
  status:       { label: "Status", type: "text", required: true, maxLength: 20, oneOf: STATUSES },
  request_date: { label: "Request date", type: "date", required: true },
} satisfies Rules;

// The database also enforces end_date >= start_date (chk_leave_dates), but checking
// here first gives the user a clear message instead of a constraint name.
const dateOrders: DateOrder[] = [
  { start: "start_date", end: "end_date", message: "End date cannot be before start date." },
];

// READ: all leave requests with the employee's name, newest first
router.get("/", async (_req, res) => {
  const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT l.leave_request_id, l.employee_id, CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
           l.leave_type, l.start_date, l.end_date, l.status, l.request_date
    FROM LEAVE_REQUEST l
    JOIN EMPLOYEE e ON e.employee_id = l.employee_id
    ORDER BY l.start_date DESC, l.leave_request_id DESC`);
  res.json(rows);
});

// CREATE: insert a new leave request
router.post("/", async (req, res) => {
  const l = validate(req.body, rules, dateOrders);
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO LEAVE_REQUEST (employee_id, leave_type, start_date, end_date, status, request_date)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [l.employee_id, l.leave_type, l.start_date, l.end_date, l.status, l.request_date]
  );
  res.status(201).json({ message: "Leave request created.", leave_request_id: result.insertId });
});

// UPDATE: edit an existing leave request by ID (e.g. approve or reject it)
router.put("/:id", async (req, res) => {
  const l = validate(req.body, rules, dateOrders);
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE LEAVE_REQUEST
     SET employee_id = ?, leave_type = ?, start_date = ?, end_date = ?, status = ?, request_date = ?
     WHERE leave_request_id = ?`,
    [l.employee_id, l.leave_type, l.start_date, l.end_date, l.status, l.request_date, req.params.id]
  );
  if (result.affectedRows === 0) return res.status(404).json({ error: "Leave request not found." });
  res.json({ message: "Leave request updated." });
});

// DELETE: remove a leave request by ID. No other table references LEAVE_REQUEST,
// so this delete is never blocked.
router.delete("/:id", async (req, res) => {
  const [result] = await pool.execute<ResultSetHeader>(
    "DELETE FROM LEAVE_REQUEST WHERE leave_request_id = ?",
    [req.params.id]
  );
  if (result.affectedRows === 0) return res.status(404).json({ error: "Leave request not found." });
  res.json({ message: "Leave request deleted." });
});

export default router;
