/*
 * admin.ts
 * Maintenance actions for testing. The UI asks for confirmation before calling these.
 */
import { Router } from "express";
import { resetDatabase } from "../resetDatabase.js";

const router = Router();

// RESET: rebuild the database from the SQL scripts, undoing every change made in the app.
// POST rather than GET, so a browser prefetch or a pasted link can never trigger it.
router.post("/reset", async (_req, res) => {
  await resetDatabase();
  res.json({ message: "Database reset to the original sample data." });
});

export default router;
