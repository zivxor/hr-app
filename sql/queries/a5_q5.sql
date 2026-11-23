/* A5 Q5: Review Score Quartile Analysis (NTILE) */

WITH weighted_reviews AS (
    SELECT d.department_name,
           CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
           pr.review_date,
           fn_weighted_review_score(pr.review_id) AS weighted_score
      FROM PERFORMANCE_REVIEW pr
      JOIN EMPLOYEE e ON e.employee_id = pr.employee_id
      JOIN DEPARTMENT d ON d.department_id = e.department_id
)
SELECT department_name,
       employee_name,
       review_date,
       weighted_score,
       NTILE(4) OVER (ORDER BY weighted_score DESC) AS score_quartile
  FROM weighted_reviews
 ORDER BY weighted_score DESC;
