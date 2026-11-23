/* A5 Q8: Training Impact by Category (conditional aggregation) */

SELECT tp.training_category,
       COUNT(DISTINCT CASE WHEN ei.completion_status = 'Completed'
                           THEN ei.employee_id END) AS completers,
       ROUND(AVG(CASE WHEN ei.completion_status = 'Completed'
                      THEN pr.overall_score END), 2) AS avg_review_completers,
       COUNT(DISTINCT CASE WHEN ei.completion_status <> 'Completed'
                           THEN ei.employee_id END) AS non_completers,
       ROUND(AVG(CASE WHEN ei.completion_status <> 'Completed'
                      THEN pr.overall_score END), 2) AS avg_review_non_completers
  FROM ENROLLS_IN ei
  JOIN TRAINING_PROGRAM tp ON tp.training_id = ei.training_id
  JOIN PERFORMANCE_REVIEW pr ON pr.employee_id = ei.employee_id
 GROUP BY tp.training_category
HAVING completers >= 2
 ORDER BY avg_review_completers DESC;
