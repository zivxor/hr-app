/*
 * tables.js
 * Describes each table shown in the UI: its API endpoint, the columns of the data table,
 * the fields of the add/edit form, and the warning shown before a delete.
 * crudView.js reads these definitions, so every table tab works the same way.
 *
 * Form field options:
 *   type       text | email | number | date | textarea | select
 *   lookup     fill a <select> from /api/lookups (employees, departments, jobRoles, projects)
 *   options    fixed <select> choices (must match the server's allowed values)
 *   key        part of a composite primary key: set when adding, locked when editing
 *   required, maxLength, min, max, step    become HTML validation attributes
 *   defaultToday  pre-fill today's date in the add form
 *
 * The limits mirror the column sizes and CHECK constraints in schema.sql. The server
 * checks everything again (src/validation.ts); these give the user instant feedback.
 */

const endBeforeStart = "End date cannot be before start date.";

export const TABLES = {
  employees: {
    title: "Employees",
    singular: "employee",
    endpoint: "/api/employees",
    path: (r) => r.employee_id,
    describe: (r) => `${r.first_name} ${r.last_name}`,
    deleteWarning:
      "Employees with salary history, leave requests or performance reviews cannot be deleted (ON DELETE RESTRICT), " +
      "so this only works for newly added employees. Their phone numbers, dependents, project assignments and " +
      "training enrollments are deleted with them (CASCADE). A department they manage is left without a manager (SET NULL).",
    columns: [
      { key: "employee_id", label: "ID" },
      { key: "first_name", label: "First name" },
      { key: "last_name", label: "Last name" },
      { key: "email", label: "Email" },
      { key: "hire_date", label: "Hire date" },
      { key: "department_name", label: "Department" },
      { key: "title", label: "Job title" },
    ],
    fields: [
      { name: "first_name", label: "First name", type: "text", required: true, maxLength: 50 },
      { name: "last_name", label: "Last name", type: "text", required: true, maxLength: 50 },
      { name: "email", label: "Email", type: "email", required: true, maxLength: 100 },
      { name: "hire_date", label: "Hire date", type: "date", required: true, defaultToday: true },
      { name: "department_id", label: "Department", type: "select", lookup: "departments", required: true },
      { name: "job_role_id", label: "Job role", type: "select", lookup: "jobRoles", required: true },
    ],
  },

  departments: {
    title: "Departments",
    singular: "department",
    endpoint: "/api/departments",
    path: (r) => r.department_id,
    describe: (r) => r.department_name,
    deleteWarning: "A department that still has employees cannot be deleted (ON DELETE RESTRICT). Move its employees first.",
    columns: [
      { key: "department_id", label: "ID" },
      { key: "department_name", label: "Name" },
      { key: "location", label: "Location" },
      { key: "budget", label: "Budget", align: "right" },
      { key: "department_email", label: "Email" },
      { key: "manager_name", label: "Manager", nullText: "No manager" },
    ],
    fields: [
      { name: "department_name", label: "Department name", type: "text", required: true, maxLength: 50 },
      { name: "location", label: "Location", type: "text", required: true, maxLength: 100 },
      { name: "budget", label: "Budget", type: "number", required: true, min: 0, step: "0.01" },
      { name: "department_email", label: "Department email", type: "email", required: true, maxLength: 100 },
      // Optional: MANAGES may be empty. One employee can manage only one department (UNIQUE).
      { name: "manager_id", label: "Manager", type: "select", lookup: "employees" },
    ],
  },

  leaveRequests: {
    title: "Leave Requests",
    singular: "leave request",
    endpoint: "/api/leave-requests",
    path: (r) => r.leave_request_id,
    describe: (r) => `${r.leave_type} leave for ${r.employee_name} (${r.start_date})`,
    columns: [
      { key: "leave_request_id", label: "ID" },
      { key: "employee_name", label: "Employee" },
      { key: "leave_type", label: "Type" },
      { key: "start_date", label: "Start" },
      { key: "end_date", label: "End" },
      { key: "status", label: "Status", badge: true },
      { key: "request_date", label: "Requested" },
    ],
    fields: [
      { name: "employee_id", label: "Employee", type: "select", lookup: "employees", required: true },
      { name: "leave_type", label: "Leave type", type: "select", required: true,
        options: ["Vacation", "Sick", "Personal", "Parental", "Bereavement"] },
      { name: "start_date", label: "Start date", type: "date", required: true },
      { name: "end_date", label: "End date", type: "date", required: true },
      { name: "status", label: "Status", type: "select", required: true, options: ["Pending", "Approved", "Rejected"] },
      { name: "request_date", label: "Request date", type: "date", required: true, defaultToday: true },
    ],
    dateOrders: [{ start: "start_date", end: "end_date", message: endBeforeStart }],
  },

  projects: {
    title: "Projects",
    singular: "project",
    endpoint: "/api/projects",
    path: (r) => r.project_id,
    describe: (r) => r.project_name,
    deleteWarning: "All employee assignments to this project are deleted with it (ON DELETE CASCADE).",
    columns: [
      { key: "project_id", label: "ID" },
      { key: "project_name", label: "Name" },
      { key: "project_description", label: "Description" },
      { key: "start_date", label: "Start" },
      { key: "end_date", label: "End", nullText: "Ongoing" },
      { key: "budget", label: "Budget", align: "right" },
      { key: "assigned_employees", label: "Assigned", align: "right" },
    ],
    fields: [
      { name: "project_name", label: "Project name", type: "text", required: true, maxLength: 100 },
      { name: "start_date", label: "Start date", type: "date", required: true },
      { name: "end_date", label: "End date (empty = ongoing)", type: "date" },
      { name: "budget", label: "Budget", type: "number", required: true, min: 0, step: "0.01" },
      { name: "project_description", label: "Description", type: "textarea", required: true, maxLength: 255 },
    ],
    dateOrders: [{ start: "start_date", end: "end_date", message: endBeforeStart }],
  },

  // ASSIGNED_TO: composite primary key (employee_id, project_id)
  assignments: {
    title: "Project Assignments",
    singular: "assignment",
    endpoint: "/api/assignments",
    path: (r) => `${r.employee_id}/${r.project_id}`,
    describe: (r) => `${r.employee_name} on ${r.project_name}`,
    columns: [
      { key: "employee_name", label: "Employee" },
      { key: "project_name", label: "Project" },
      { key: "project_role", label: "Role" },
      { key: "assigned_date", label: "Assigned" },
      { key: "project_rating", label: "Rating", align: "right", nullText: "Not rated" },
      { key: "hours_worked", label: "Hours", align: "right" },
    ],
    fields: [
      { name: "employee_id", label: "Employee", type: "select", lookup: "employees", required: true, key: true },
      { name: "project_id", label: "Project", type: "select", lookup: "projects", required: true, key: true },
      { name: "project_role", label: "Project role", type: "text", required: true, maxLength: 50 },
      { name: "assigned_date", label: "Assigned date", type: "date", required: true, defaultToday: true },
      { name: "project_rating", label: "Rating 1-5 (empty = not rated)", type: "number", min: 1, max: 5, step: "1" },
      { name: "hours_worked", label: "Hours worked", type: "number", required: true, min: 0, max: 9999.99, step: "0.01" },
    ],
  },

  trainingPrograms: {
    title: "Training Programs",
    singular: "training program",
    endpoint: "/api/training-programs",
    path: (r) => r.training_id,
    describe: (r) => r.program_name,
    deleteWarning: "Programs with any enrollments cannot be deleted (ON DELETE RESTRICT).",
    columns: [
      { key: "training_id", label: "ID" },
      { key: "program_name", label: "Program" },
      { key: "provider", label: "Provider" },
      { key: "duration_hours", label: "Hours", align: "right" },
      { key: "training_category", label: "Category" },
      { key: "delivery_method", label: "Delivery" },
      { key: "enrollments", label: "Enrollments", align: "right" },
    ],
    fields: [
      { name: "program_name", label: "Program name", type: "text", required: true, maxLength: 100 },
      { name: "provider", label: "Provider", type: "text", required: true, maxLength: 100 },
      { name: "duration_hours", label: "Duration (hours)", type: "number", required: true, min: 1, step: "1" },
      { name: "training_category", label: "Category", type: "text", required: true, maxLength: 50 },
      { name: "delivery_method", label: "Delivery method", type: "select", required: true, options: ["In-person", "Online", "Hybrid"] },
    ],
  },

  // DEPENDENT: weak entity, composite primary key (employee_id, dependent_name).
  // The name goes in the URL, so it is encoded (names contain spaces).
  dependents: {
    title: "Dependents",
    singular: "dependent",
    endpoint: "/api/dependents",
    path: (r) => `${r.employee_id}/${encodeURIComponent(r.dependent_name)}`,
    describe: (r) => `${r.dependent_name} (dependent of ${r.employee_name})`,
    columns: [
      { key: "employee_name", label: "Employee" },
      { key: "dependent_name", label: "Dependent" },
      { key: "relationship_type", label: "Relationship" },
      { key: "date_of_birth", label: "Date of birth" },
      { key: "coverage_start_date", label: "Coverage start" },
      { key: "coverage_status", label: "Coverage", badge: true },
    ],
    fields: [
      { name: "employee_id", label: "Employee", type: "select", lookup: "employees", required: true, key: true },
      { name: "dependent_name", label: "Dependent name", type: "text", required: true, maxLength: 100, key: true },
      { name: "relationship_type", label: "Relationship", type: "select", required: true, options: ["Spouse", "Child"] },
      { name: "coverage_status", label: "Coverage status", type: "select", required: true, options: ["Active", "Inactive"] },
      { name: "date_of_birth", label: "Date of birth", type: "date", required: true },
      { name: "coverage_start_date", label: "Coverage start", type: "date", required: true, defaultToday: true },
    ],
    dateOrders: [{ start: "date_of_birth", end: "coverage_start_date", message: "Coverage start cannot be before date of birth." }],
  },
};
