/*
 * server.ts
 * Entry point: starts the Express server, mounts the API routes and serves the UI.
 */
import express, { type NextFunction, type Request, type Response } from "express";
import { fileURLToPath } from "node:url";
import { friendlyError } from "./errors.js";
import admin from "./routes/admin.js";
import assignments from "./routes/assignments.js";
import departments from "./routes/departments.js";
import dependents from "./routes/dependents.js";
import employees from "./routes/employees.js"; // note: .js extension is required with NodeNext
import leaveRequests from "./routes/leaveRequests.js";
import lookups from "./routes/lookups.js";
import projects from "./routes/projects.js";
import queries from "./routes/queries.js";
import trainingPrograms from "./routes/trainingPrograms.js";

// Resolve folders from this file's location, so `npm start` works from any working directory
const PUBLIC_DIR = fileURLToPath(new URL("../public", import.meta.url));

const app = express();
app.use(express.json());          // parse JSON request bodies
app.use(express.static(PUBLIC_DIR)); // serve the frontend from /public

// API routes, one router per table or feature
app.use("/api/employees", employees);
app.use("/api/departments", departments);
app.use("/api/leave-requests", leaveRequests);
app.use("/api/projects", projects);
app.use("/api/training-programs", trainingPrograms);
app.use("/api/dependents", dependents);
app.use("/api/assignments", assignments);
app.use("/api/lookups", lookups);
app.use("/api/queries", queries);
app.use("/api/admin", admin);

// Unknown API paths answer with JSON instead of Express's default HTML page
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Unknown API route." });
});

// Central error handler. Express 5 forwards errors thrown in async route handlers here,
// so routes don't need their own try/catch. friendlyError turns MySQL error codes into
// readable messages (e.g. a delete blocked by ON DELETE RESTRICT).
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  // Malformed JSON body: express.json() marks these with type 'entity.parse.failed'
  if ((err as { type?: string }).type === "entity.parse.failed") {
    res.status(400).json({ error: "Request body is not valid JSON." });
    return;
  }
  const { status, message } = friendlyError(err);
  if (status === 500) console.error(err); // log only unexpected errors
  res.status(status).json({ error: message });
});

const PORT = Number(process.env.PORT ?? 3000);
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
