/* A5 Q7: Unaddressed Development Needs (EXCEPT set operation) */

SELECT t.employee_name,
       t.department_name,
       t.overall_score,
       c.competency_name AS weakest_competency,
       a.score AS weakest_score
  FROM (
        SELECT e.employee_id,
               CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
               d.department_name,
               pr.overall_score,
               pr.review_id
          FROM PERFORMANCE_REVIEW pr
          JOIN EMPLOYEE e ON e.employee_id = pr.employee_id
          JOIN DEPARTMENT d ON d.department_id = e.department_id
         WHERE pr.overall_score <= 3
        EXCEPT
        SELECT e.employee_id,
               CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
               d.department_name,
               pr.overall_score,
               pr.review_id
          FROM ENROLLS_IN ei
          JOIN EMPLOYEE e ON e.employee_id = ei.employee_id
          JOIN DEPARTMENT d ON d.department_id = e.department_id
          JOIN PERFORMANCE_REVIEW pr ON pr.employee_id = e.employee_id
         WHERE ei.completion_status IN ('Completed', 'In Progress')
       ) t
  JOIN ASSESSES a ON a.review_id = t.review_id
  JOIN COMPETENCY c ON c.competency_id = a.competency_id
 WHERE a.competency_id = (SELECT a3.competency_id
                            FROM ASSESSES a3
                           WHERE a3.review_id = t.review_id
                           ORDER BY a3.score ASC, a3.competency_id ASC
                           LIMIT 1)
 ORDER BY t.overall_score, t.employee_name;
