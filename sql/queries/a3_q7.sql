/* A3 Query 7: Employees with Above-Average Review Scores */

SELECT
    PERFORMANCE_REVIEW.review_id AS 'Review ID',
    EMPLOYEE.first_name AS 'First Name',
    EMPLOYEE.last_name AS 'Last Name',
    DEPARTMENT.department_name AS 'Department',
    PERFORMANCE_REVIEW.overall_score AS 'Overall Score'
FROM PERFORMANCE_REVIEW
INNER JOIN EMPLOYEE
    ON PERFORMANCE_REVIEW.employee_id = EMPLOYEE.employee_id
INNER JOIN DEPARTMENT
    ON EMPLOYEE.department_id = DEPARTMENT.department_id
WHERE PERFORMANCE_REVIEW.overall_score > (
    SELECT AVG(overall_score)
    FROM PERFORMANCE_REVIEW
)
ORDER BY PERFORMANCE_REVIEW.overall_score DESC,
         EMPLOYEE.last_name, PERFORMANCE_REVIEW.review_id;
