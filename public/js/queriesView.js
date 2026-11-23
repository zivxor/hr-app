/*
 * queriesView.js
 * The "Queries" tab: pick a saved query from a previous assignment, run it,
 * and show the result with the column headers the query defines.
 */
import { api } from "./api.js";
import { el, renderTable, showMessage } from "./ui.js";

// A column is right-aligned when every value in it is a number (amounts, counts, scores).
// mysql2 returns DECIMAL values as strings, so numeric-looking strings count too.
function isNumericColumn(rows, index) {
  const values = rows.map((row) => row[index]).filter((v) => v !== null && v !== "");
  return values.length > 0 && values.every((v) => /^-?\d+(\.\d+)?$/.test(String(v)));
}

async function runQuery(id, results, button) {
  button.disabled = true;
  button.textContent = "Running…";
  try {
    const { name, columns, rows } = await api("GET", `/api/queries/${encodeURIComponent(id)}`);
    const tableColumns = columns.map((label, i) => ({ label, align: isNumericColumn(rows, i) ? "right" : undefined }));
    results.replaceChildren(
      el("div", { class: "result-header" },
        el("h3", {}, name),
        el("span", { class: "count" }, `${rows.length} ${rows.length === 1 ? "row" : "rows"}`)),
      renderTable(tableColumns, rows));
  } catch (error) {
    results.replaceChildren();
    showMessage("error", error.message);
  } finally {
    button.disabled = false;
    button.textContent = "Run query";
  }
}

export async function showQueriesView(container) {
  const select = el("select", { id: "query-select", "aria-label": "Saved query" });
  const button = el("button", { class: "btn btn-primary" }, "Run query");
  const results = el("div", { class: "query-results" });
  button.addEventListener("click", () => runQuery(select.value, results, button));

  container.replaceChildren(
    el("div", { class: "toolbar" }, el("h2", {}, "Saved Queries")),
    el("p", { class: "intro" },
      "Queries from Assignments 3 and 5, run exactly as written in sql/queries/. " +
      "Some use the stored functions and views created in A5 (e.g. fn_current_salary, vw_retention_risk)."),
    el("div", { class: "query-bar" }, select, button),
    results);

  try {
    const queries = await api("GET", "/api/queries");
    select.replaceChildren(...queries.map((q) => el("option", { value: q.id }, q.name)));
  } catch (error) {
    button.disabled = true;
    showMessage("error", error.message);
  }
}
