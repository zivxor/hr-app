/*
 * errors.ts
 * Turns MySQL error codes into short messages the UI can show to the user.
 * The database enforces the real rules (keys, foreign keys, CHECK constraints);
 * this file only explains in plain language why an operation was refused.
 */

// Thrown by route handlers for bad input, so the error handler can answer 400
// with the message instead of treating it as a database failure.
export class ValidationError extends Error {
  readonly status = 400;
}

// Pulls the first `name` in backticks after a marker from a MySQL error message, e.g.
// "... (`cp363_a2_group13`.`SALARY`, CONSTRAINT ..." -> "SALARY"
function tableAfter(message: string, marker: RegExp): string | undefined {
  return message.match(marker)?.[1]?.toUpperCase();
}

export function friendlyError(err: unknown): { status: number; message: string } {
  if (err instanceof ValidationError) {
    return { status: err.status, message: err.message };
  }

  const code = (err as { code?: string }).code;
  const raw = (err as Error).message ?? "";

  switch (code) {
    case "ER_DUP_ENTRY": { // UNIQUE or PRIMARY KEY violated
      // e.g. "Duplicate entry 'x' for key 'employee.email'" -> "EMPLOYEE.email must be unique".
      // The server may report table names in lower case, so normalize them. For composite
      // keys (DEPENDENT, ASSIGNED_TO) the key is named PRIMARY: the whole key combination exists.
      const key = raw.match(/for key '([^']+)'/)?.[1]?.replace(/^[^.]+/, (table) => table.toUpperCase());
      const detail = key?.endsWith(".PRIMARY")
        ? `that primary key already exists in ${key.slice(0, -".PRIMARY".length)}`
        : key && `${key} must be unique`;
      return { status: 409, message: `A record with that value already exists${detail ? ` (${detail})` : ""}.` };
    }
    case "ER_NO_REFERENCED_ROW_2": { // FK points to a row that doesn't exist
      const parent = tableAfter(raw, /REFERENCES `([^`]+)`/);
      return { status: 400, message: `Referenced record does not exist${parent ? ` in ${parent}` : ""}.` };
    }
    case "ER_ROW_IS_REFERENCED_2": { // ON DELETE RESTRICT blocked the delete
      // The message names the child table, e.g. (`db`.`SALARY`, CONSTRAINT `fk_salary_employee` ...)
      const child = tableAfter(raw, /\(`[^`]+`\.`([^`]+)`/);
      return {
        status: 409,
        message: `Cannot delete: ${child ?? "other"} records still depend on this one (ON DELETE RESTRICT). Remove those records first.`,
      };
    }
    case "ER_CHECK_CONSTRAINT_VIOLATED": { // a CHECK constraint failed
      const rule = raw.match(/constraint '([^']+)'/i)?.[1];
      return { status: 400, message: `Value breaks a database rule${rule ? ` (${rule})` : ""}.` };
    }
    case "ER_BAD_NULL_ERROR": // NOT NULL column left empty
      return { status: 400, message: "A required value is missing." };
    case "ER_DATA_TOO_LONG": // text longer than the VARCHAR size
      return { status: 400, message: "A value is too long for its column." };
    case "ER_TRUNCATED_WRONG_VALUE":
    case "ER_TRUNCATED_WRONG_VALUE_FOR_FIELD":
    case "ER_WARN_DATA_OUT_OF_RANGE": // wrong format or a number too large for the column
      return { status: 400, message: "A value has the wrong format or is out of range." };
    default:
      return { status: 500, message: raw || "Unknown database error." };
  }
}
