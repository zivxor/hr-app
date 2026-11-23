# HR Management System (CP363 Assignment 6)

**Group 13: Employee Performance & HR Management System**
Shermeen Syeda, Luka Zivkovic

A web application for the MySQL database designed in Assignments 1–5. It supports
create / read / update / delete on seven tables and runs the saved queries from
Assignments 3 and 5.

## Requirements

- **Node.js** 20 or newer (tested with Node 24)
- **MySQL** 8.0 or newer (needs window functions and `EXCEPT`, used by the A5 queries)

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create `.env`** by copying the example and entering your MySQL login:

   ```bash
   cp .env.example .env
   ```

   | Variable      | Meaning                                                    |
   |---------------|------------------------------------------------------------|
   | `DB_HOST`     | MySQL host, usually `localhost`                            |
   | `DB_PORT`     | MySQL port, usually `3306`                                 |
   | `DB_USER`     | MySQL user name                                            |
   | `DB_PASSWORD` | MySQL password                                             |
   | `DB_NAME`     | Must be `cp363_a2_group13` (the name `schema.sql` creates) |
   | `PORT`        | Port for the web app (default `3000`)                      |

3. **Create and load the database.** Run these three scripts in this order, for example
   in MySQL Workbench (File → Open SQL Script, then run):

   1. `sql/schema.sql`: creates the database and the 14 tables
   2. `sql/populate.sql`: inserts the sample data
   3. `sql/db_objects.sql`: creates the views, stored functions, procedures and index
      that the saved queries use

   Once the app is running, the **Reset database** button reruns all three scripts for you.

## Running

```bash
npm start
```

Then open the URL it prints, e.g. **http://localhost:3000**.
(`npm run dev` does the same but restarts automatically when a source file changes.)

## Features

- **CRUD for 7 tables:** Employees, Departments, Leave Requests, Projects, Project
  Assignments (`ASSIGNED_TO`), Training Programs and Dependents. Each tab has a data table
  with Add, Edit and Delete.
- **Foreign keys as dropdowns:** department, job role, employee, project and manager are
  chosen from lists loaded from the database.
- **Composite keys:** Dependents (`employee_id` + `dependent_name`) and Assignments
  (`employee_id` + `project_id`) are addressed by both key parts. Key fields are locked when
  editing.
- **Foreign key rules respected, with clear messages:** e.g. deleting an employee with
  salary history is refused (`ON DELETE RESTRICT`) and the message names the blocking
  table. Deleting a project also removes its assignments (`CASCADE`). Deleting a department
  manager leaves the department without a manager (`SET NULL`). Delete dialogs explain
  these effects before you confirm.
- **Saved queries:** the Queries tab lists every file in `sql/queries/` (A3 Queries 1–10,
  A3 Views 2–3, A5 Q1–Q8, A5 View 3) and runs the chosen one exactly as written, showing
  the result with its column headers.
- **Validation on both sides:** required fields, text lengths, numbers and ranges, real
  dates, allowed values, and date order (e.g. a leave request's end date cannot be
  before its start date). The browser checks first, and the server checks again because
  requests can bypass the UI.
- **SQL injection safe:** every query with user input uses `?` placeholders.
- **Reset database:** restores the original sample data after testing (asks for
  confirmation first).

## Project structure

```
sql/
  schema.sql          tables, keys and constraints (from A2/A4)
  populate.sql        sample data (from A3)
  db_objects.sql      A3 views, A5 functions / procedures / view / index
  queries/            one .sql file per saved query; the first-line comment is its name
src/
  server.ts           Express app, route mounting, central error handler
  db.ts               connection settings and the shared connection pool
  errors.ts           MySQL error codes -> readable messages
  validation.ts       shared server-side input validation
  resetDatabase.ts    reruns the three SQL scripts (separate multi-statement connection)
  routes/             one router per table, plus lookups, queries and admin (reset)
public/
  index.html, style.css
  js/main.js          tabs, navigation, reset button
  js/tables.js        per-table definition: columns, form fields, delete warnings
  js/crudView.js      generic table + add/edit form, driven by tables.js
  js/queriesView.js   the Queries tab
  js/api.js, ui.js    fetch wrapper and shared UI helpers
```

## API overview

| Method | Path                                    | Purpose                       |
|--------|-----------------------------------------|-------------------------------|
| GET / POST | `/api/<table>`                      | list rows / create a row      |
| PUT / DELETE | `/api/<table>/:id`                | update / delete one row       |
| PUT / DELETE | `/api/dependents/:employeeId/:dependentName` | composite key        |
| PUT / DELETE | `/api/assignments/:employeeId/:projectId`    | composite key        |
| GET    | `/api/lookups`                          | dropdown values               |
| GET    | `/api/queries`, `/api/queries/:id`      | list / run a saved query      |
| POST   | `/api/admin/reset`                      | rebuild the database          |

`<table>` is one of `employees`, `departments`, `leave-requests`, `projects`,
`training-programs`, `dependents`, `assignments`.
