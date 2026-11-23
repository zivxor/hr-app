/* A3 Query 5: Current Salary of Each Employee */

SELECT
    EMPLOYEE.employee_id AS 'Employee ID',
    EMPLOYEE.first_name AS 'First Name',
    EMPLOYEE.last_name AS 'Last Name',
    DEPARTMENT.department_name AS 'Department',
    JOB_ROLE.title AS 'Job Title',
    SALARY.amount AS 'Current Salary',
    DATE_FORMAT(
        SALARY.effective_date, '%Y-%m-%d'
    ) AS 'Effective Since'
FROM EMPLOYEE
INNER JOIN DEPARTMENT
    ON EMPLOYEE.department_id = DEPARTMENT.department_id
INNER JOIN JOB_ROLE
    ON EMPLOYEE.job_role_id = JOB_ROLE.job_role_id
INNER JOIN SALARY
    ON EMPLOYEE.employee_id = SALARY.employee_id
WHERE SALARY.effective_date = (
    SELECT MAX(S2.effective_date)
    FROM SALARY S2
    WHERE S2.employee_id = EMPLOYEE.employee_id
)
ORDER BY SALARY.amount DESC;