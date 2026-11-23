/* A3 View 2: Project Workload Summary (SELECT from VW_PROJECT_WORKLOAD) */

SELECT
    project_id AS 'Project ID',
    project_name AS 'Project Name',
    assigned_employees AS 'Assigned Employees',
    total_hours AS 'Total Hours',
    average_hours_per_employee AS 'Average Hours per Employee'
FROM VW_PROJECT_WORKLOAD
ORDER BY total_hours DESC, project_id;