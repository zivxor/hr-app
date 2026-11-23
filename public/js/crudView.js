/*
 * crudView.js
 * Renders one table tab from its definition in tables.js: the data table with
 * Edit / Delete buttons, plus the Add / Edit form shown in a modal dialog.
 */
import { api } from "./api.js";
import { confirmDialog, el, renderTable, showMessage } from "./ui.js";

// Today's date as YYYY-MM-DD in the user's local time zone (toISOString alone is UTC,
// which would give tomorrow's date in the evening in Canada).
function today() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

// Builds the <select> choices: from /api/lookups for foreign keys, or a fixed list
function selectOptions(field, lookups) {
  const choices = field.lookup
    ? lookups[field.lookup].map((item) => ({ value: String(item.id), label: item.label }))
    : field.options.map((option) => ({ value: option, label: option }));
  // Required selects start on a disabled placeholder so the user must make a choice;
  // optional ones (e.g. department manager) offer an explicit "None" = NULL.
  const placeholder = field.required
    ? el("option", { value: "", disabled: true }, "Select…")
    : el("option", { value: "" }, "— None —");
  return [placeholder, ...choices.map((c) => el("option", { value: c.value }, c.label))];
}

// Creates the input for one form field, pre-filled when editing
function buildInput(field, value, lookups, locked) {
  const common = {
    id: `field-${field.name}`,
    name: field.name,
    required: field.required,
    disabled: locked,
  };
  if (field.type === "select") {
    const select = el("select", common, selectOptions(field, lookups));
    select.value = value ?? "";
    return select;
  }
  if (field.type === "textarea") {
    const textarea = el("textarea", { ...common, maxlength: field.maxLength, rows: 3 });
    textarea.value = value ?? "";
    return textarea;
  }
  const input = el("input", {
    ...common,
    type: field.type,
    maxlength: field.maxLength,
    min: field.min,
    max: field.max,
    step: field.step,
  });
  input.value = value ?? "";
  return input;
}

// Client-side cross-field check (e.g. end date >= start date). Marks the end field invalid
// so the browser shows the message right next to it, exactly like its built-in checks.
function checkDateOrders(form, dateOrders = []) {
  for (const { start, end, message } of dateOrders) {
    const startValue = form.elements[start].value;
    const endInput = form.elements[end];
    if (startValue && endInput.value && endInput.value < startValue) {
      endInput.setCustomValidity(message);
      endInput.reportValidity();
      return false;
    }
  }
  return true;
}

// Opens the add form (row = null) or the edit form (row = existing record)
function openForm(config, context, row) {
  const editing = row !== null;
  const dialog = document.getElementById("form-dialog");
  const formError = el("p", { class: "form-error", hidden: true });

  const fields = config.fields.map((field) => {
    // Composite-key fields identify the row, so they are locked when editing
    // (the server ignores them on update as well).
    const locked = editing && field.key;
    const value = editing ? row[field.name] : field.defaultToday ? today() : "";
    const input = buildInput(field, value === null ? "" : String(value ?? ""), context.lookups, locked);
    return el("div", { class: field.type === "textarea" ? "field field-wide" : "field" },
      el("label", { for: input.id }, field.label, field.required ? el("span", { class: "required" }, " *") : null),
      input,
      locked ? el("small", { class: "hint" }, "Part of the primary key, can't be changed.") : null);
  });

  const saveButton = el("button", { type: "submit", class: "btn btn-primary" }, editing ? "Save changes" : `Add ${config.singular}`);
  const form = el("form", { class: "form" },
    el("h2", {}, editing ? `Edit ${config.singular}` : `Add ${config.singular}`),
    el("div", { class: "form-grid" }, fields),
    formError,
    el("div", { class: "form-actions" },
      el("button", { type: "button", class: "btn", onclick: () => dialog.close() }, "Cancel"),
      saveButton));

  // A date-order error is attached to the end field, but fixing the start field must clear
  // it too, otherwise the browser keeps blocking the submit. So any edit clears them all;
  // checkDateOrders runs again on the next submit.
  form.addEventListener("input", () => {
    for (const element of form.elements) element.setCustomValidity?.("");
  });

  // The browser's built-in checks (required, maxlength, min/max, date format) run before
  // this handler fires; this adds the cross-field rule, then sends the data to the server.
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!checkDateOrders(form, config.dateOrders)) return;

    // Disabled (locked key) inputs are skipped, matching what the update route accepts
    const values = Object.fromEntries(new FormData(form));
    saveButton.disabled = true;
    try {
      const result = editing
        ? await api("PUT", `${config.endpoint}/${config.path(row)}`, values)
        : await api("POST", config.endpoint, values);
      dialog.close();
      showMessage("success", result.message);
      await context.onDataChanged();
    } catch (error) {
      // Server-side errors (validation, duplicate key, bad foreign key) stay in the form,
      // so the user can correct the input without retyping everything.
      formError.textContent = error.message;
      formError.hidden = false;
    } finally {
      saveButton.disabled = false;
    }
  });

  dialog.replaceChildren(form);
  dialog.showModal();
  form.querySelector("input:not([disabled]), select:not([disabled]), textarea")?.focus();
}

// Asks for confirmation (including what the foreign keys will do), then deletes
async function deleteRow(config, context, row) {
  const warning = config.deleteWarning ? `\n\n${config.deleteWarning}` : "";
  const confirmed = await confirmDialog(
    `Delete ${config.singular}?`,
    `Delete ${config.describe(row)}? This cannot be undone.${warning}`
  );
  if (!confirmed) return;
  try {
    const result = await api("DELETE", `${config.endpoint}/${config.path(row)}`);
    showMessage("success", result.message);
    await context.onDataChanged();
  } catch (error) {
    // e.g. "Cannot delete: SALARY records still depend on this one (ON DELETE RESTRICT)..."
    showMessage("error", error.message);
  }
}

// Renders the whole tab into `container`. `context` supplies the dropdown lookups and
// a callback that reloads data after any change.
export async function showCrudView(container, config, context) {
  const count = el("span", { class: "count" });
  const body = el("div", {}, el("p", { class: "empty" }, "Loading…"));
  container.replaceChildren(
    el("div", { class: "toolbar" },
      el("h2", {}, config.title, count),
      el("button", { class: "btn btn-primary", onclick: () => openForm(config, context, null) }, `+ Add ${config.singular}`)),
    body);

  try {
    const rows = await api("GET", config.endpoint);
    count.textContent = `${rows.length} ${rows.length === 1 ? "row" : "rows"}`;
    body.replaceChildren(renderTable(config.columns, rows, (row) => [
      el("button", { class: "btn btn-small", onclick: () => openForm(config, context, row) }, "Edit"),
      el("button", { class: "btn btn-small btn-danger", onclick: () => deleteRow(config, context, row) }, "Delete"),
    ]));
  } catch (error) {
    body.replaceChildren(el("p", { class: "empty" }, "Could not load data."));
    showMessage("error", error.message);
  }
}
