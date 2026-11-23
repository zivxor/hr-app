/*
 * lookups.ts
 * Read-only lists used to fill the foreign-key dropdowns in the UI forms
 * (e.g. choose a department and job role when adding an employee).
 * Returned in one request so a form never has to wait on several calls.
 */
import { Router } from "express";
import type { RowDataPacket } from "mysql2";
import { pool } from "../db.js";

const router = Router();

// Each list is shaped as { id, label } so the client can build any <select> the same way
router.get("/", async (_req, res) => {
  const [[employees], [departments], [jobRoles], [projects]] = await Promise.all([
    pool.query<RowDataPacket[]>(
      "SELECT employee_id AS id, CONCAT(first_name, ' ', last_name) AS label FROM EMPLOYEE ORDER BY first_name, last_name"
    ),
    pool.query<RowDataPacket[]>(
      "SELECT department_id AS id, department_name AS label FROM DEPARTMENT ORDER BY department_name"
    ),
    pool.query<RowDataPacket[]>(
      "SELECT job_role_id AS id, title AS label FROM JOB_ROLE ORDER BY title"
    ),
    pool.query<RowDataPacket[]>(
      "SELECT project_id AS id, project_name AS label FROM PROJECT ORDER BY project_name"
    ),
  ]);
  res.json({ employees, departments, jobRoles, projects });
});

export default router;
