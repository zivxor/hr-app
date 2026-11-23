/*
 * ui.js
 * Shared UI building blocks: element creation, the message banner,
 * the confirmation dialog and the data table renderer.
 * Text is always inserted with textContent (never innerHTML), so values
 * from the database can't inject HTML into the page.
 */

// Creates an element: el("button", { class: "btn", onclick: fn }, "Save")
export function el(tag, attributes = {}, ...children) {
  const element = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) {
    if (value === undefined || value === null || value === false) continue;
    if (name.startsWith("on")) element.addEventListener(name.slice(2), value);
    else if (value === true) element.setAttribute(name, "");
    else element.setAttribute(name, value);
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined) continue;
    element.append(child instanceof Node ? child : String(child));
  }
  return element;
}

let messageTimer;

// Shows a success or error banner at the top of the page. Successes fade out on their own;
// errors stay until dismissed, so a message like a blocked delete isn't missed.
export function showMessage(type, text) {
  const banner = document.getElementById("message");
  banner.className = `message message-${type}`;
  banner.replaceChildren(
    el("span", {}, text),
    el("button", { class: "message-close", "aria-label": "Dismiss", onclick: hideMessage }, "×")
  );
  banner.hidden = false;
  clearTimeout(messageTimer);
  if (type === "success") messageTimer = setTimeout(hideMessage, 5000);
}

export function hideMessage() {
  document.getElementById("message").hidden = true;
}

// Asks the user to confirm a destructive action. Resolves to true only if they confirm.
// Uses the page's own <dialog> rather than window.confirm(), so the warning text
// (e.g. what a CASCADE delete will also remove) is readable and styled.
export function confirmDialog(title, text, confirmLabel = "Delete") {
  const dialog = document.getElementById("confirm-dialog");
  dialog.querySelector("h2").textContent = title;
  dialog.querySelector("p").textContent = text;
  dialog.querySelector("[value=confirm]").textContent = confirmLabel;
  dialog.returnValue = "";
  dialog.showModal();
  return new Promise((resolve) => {
    dialog.addEventListener("close", () => resolve(dialog.returnValue === "confirm"), { once: true });
  });
}

// Formats one cell. NULL shows a dimmed placeholder (or the column's own text, e.g.
// "Ongoing" for a project with no end date) instead of an empty gap.
function cell(value, column = {}) {
  if (value === null || value === undefined || value === "") {
    return el("td", { class: "null" }, column.nullText ?? "—");
  }
  // Badge columns (e.g. leave status) get a coloured pill: "In Progress" -> badge-in-progress
  const content = column.badge
    ? el("span", { class: `badge badge-${String(value).toLowerCase().replace(/\s+/g, "-")}` }, value)
    : value;
  return el("td", { class: column.align === "right" ? "num" : null }, content);
}

// Renders a table. `columns` is a list of { key, label, align?, nullText?, badge? }.
// Rows can be objects (read by column key) or arrays (read by position, as returned by
// the query runner). `actions(row)` optionally returns buttons for a last column.
export function renderTable(columns, rows, actions) {
  if (rows.length === 0) {
    return el("p", { class: "empty" }, "No rows to show.");
  }
  const header = el("tr", {}, columns.map((c) => el("th", { class: c.align === "right" ? "num" : null }, c.label)),
    actions ? el("th", { class: "actions-col" }, "Actions") : null);

  const body = rows.map((row) =>
    el("tr", {},
      columns.map((c, i) => cell(Array.isArray(row) ? row[i] : row[c.key], c)),
      actions ? el("td", { class: "actions" }, actions(row)) : null)
  );

  return el("div", { class: "table-wrap" },
    el("table", {}, el("thead", {}, header), el("tbody", {}, body)));
}
