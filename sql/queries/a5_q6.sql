/* A5 Q6: Top Contributor per Project (RANK + SUM windows) */

WITH ranked_contributors AS (
    SELECT p.project_name,
           CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
           a.project_role,
           a.hours_worked,
           a.project_rating,
           RANK() OVER (PARTITION BY a.project_id
                        ORDER BY a.hours_worked DESC) AS hours_rank,
           ROUND(a.hours_worked /
                 SUM(a.hours_worked) OVER (PARTITION BY a.project_id) * 100,
                 1) AS pct_of_project_hours
      FROM ASSIGNED_TO a
      JOIN PROJECT p ON p.project_id = a.project_id
      JOIN EMPLOYEE e ON e.employee_id = a.employee_id
)
SELECT project_name,
       employee_name,
       project_role,
       hours_worked,
       project_rating,
       pct_of_project_hours
  FROM ranked_contributors
 WHERE hours_rank = 1
 ORDER BY pct_of_project_hours DESC;
