/*
 * main.js
 * Starts the UI: builds the navigation tabs, switches between views,
 * keeps the dropdown lookups fresh, and handles "Reset database".
 */
import { api } from "./api.js";
import { showCrudView } from "./crudView.js";
import { showQueriesView } from "./queriesView.js";
import { TABLES } from "./tables.js";
import { confirmDialog, el, showMessage } from "./ui.js";

const QUERIES_TAB = "queries";
const view = document.getElementById("view");
let currentTab = null;

// Shared state for the table views. Lookups (employees, departments, ...) fill the
// foreign-key dropdowns and are reloaded after every change, so e.g. a newly added
// department immediately appears in the employee form.
const context = {
  lookups: { employees: [], departments: [], jobRoles: [], projects: [] },
  async onDataChanged() {
    await refreshLookups();
    await showTab(currentTab);
  },
};

async function refreshLookups() {
  try {
    context.lookups = await api("GET", "/api/lookups");
  } catch (error) {
    showMessage("error", error.message);
  }
}

async function showTab(tab) {
  currentTab = tab;
  for (const link of document.querySelectorAll("#tabs a")) {
    link.classList.toggle("active", link.dataset.tab === tab);
  }
  if (tab === QUERIES_TAB) await showQueriesView(view);
  else await showCrudView(view, TABLES[tab], context);
}

// Tabs are plain links to #name, so the browser's back button and a page refresh
// keep the user on the same tab.
function tabFromHash() {
  const tab = location.hash.slice(1);
  return tab === QUERIES_TAB || tab in TABLES ? tab : "employees";
}

function buildTabs() {
  const tabs = [...Object.entries(TABLES).map(([key, config]) => [key, config.title]), [QUERIES_TAB, "Queries"]];
  document.getElementById("tabs").replaceChildren(
    ...tabs.map(([key, title]) => el("a", { href: `#${key}`, "data-tab": key }, title)));
}

// Reruns schema.sql, populate.sql and db_objects.sql on the server, undoing all test changes
async function resetDatabase(button) {
  const confirmed = await confirmDialog(
    "Reset the database?",
    "This drops the database and rebuilds it from sql/schema.sql, sql/populate.sql and sql/db_objects.sql. " +
      "Every change made in the app (adds, edits, deletes) will be lost.",
    "Reset database"
  );
  if (!confirmed) return;
  button.disabled = true;
  button.textContent = "Resetting…";
  try {
    const result = await api("POST", "/api/admin/reset");
    showMessage("success", result.message);
    await context.onDataChanged();
  } catch (error) {
    showMessage("error", error.message);
  } finally {
    button.disabled = false;
    button.textContent = "Reset database";
  }
}

async function start() {
  buildTabs();
  const resetButton = document.getElementById("reset-button");
  resetButton.addEventListener("click", () => resetDatabase(resetButton));
  window.addEventListener("hashchange", () => showTab(tabFromHash()));
  await refreshLookups();
  await showTab(tabFromHash());
}

start();
